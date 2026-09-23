/* Shared helpers for the /api functions (Vercel Node.js runtime, no dependencies).
   Files starting with "_" are not exposed as routes.

   Environment variables (set them in Vercel → foodsafetymvp → Settings → Environment Variables):
     RESEND_API_KEY      Resend API key. If missing, emails are NOT sent: they're written to
                         .claude/outbox/ (local dev) or logged, so the site keeps working.
     RESEND_FROM         Sender, e.g. "Stratum <noreply@stratumpr.com>" (domain must be verified in Resend)
     RESEND_SEGMENT      Name of the Resend segment for subscribers (default "Food Safety MVP"),
                         or RESEND_SEGMENT_ID to skip the name lookup
     LEADS_TO            Where lead notifications go (default contact@stratumpr.com)
     CONFIRM_SECRET      Long random string used to sign the newsletter confirmation links
     SITE_URL            Public site URL (default https://mvp.stratumpr.com)

   When the Azure backend is ready, this file is the only one that talks to Resend. */
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const env = (k, d = "") => (process.env[k] || d).trim();
const SITE_URL = () => env("SITE_URL", "https://mvp.stratumpr.com").replace(/\/$/, "");
const LEADS_TO = () => env("LEADS_TO", "contact@stratumpr.com");
const FROM = () => env("RESEND_FROM", "Stratum <noreply@stratumpr.com>");
const DRY_RUN = () => !env("RESEND_API_KEY");

// ---------- small utils ----------
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clip = (s, n = 300) => String(s ?? "").trim().slice(0, n);
const isEmail = (s) => /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[a-z]{2,}$/i.test(String(s || "").trim()) && String(s).length <= 254;
const lang = (l) => (l === "en" ? "en" : "es");
// Names/businesses end up inside emails we send to the address typed in; refuse link-like text so
// the forms can't be used to mail URLs to strangers (email clients auto-link plain URLs).
const hasLink = (s) => /(https?:|www\.|\.(com|net|org|io|ru|xyz|top|info|biz|link|click)\b|@)/i.test(String(s || ""));
const cleanName = (s, n = 80) => { const v = clip(s, n); return v && !hasLink(v) ? v : ""; };

// Best-effort rate limit (per serverless instance): 8 requests per minute per IP.
const hits = new Map();
function rateLimited(req) {
  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "?").split(",")[0].trim();
  const now = Date.now(), recent = (hits.get(ip) || []).filter((t) => now - t < 60000);
  recent.push(now); hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 8;
}

// ---------- request handling ----------
const ALLOWED_ORIGINS = [/^https:\/\/mvp\.stratumpr\.com$/, /^https:\/\/([a-z0-9-]+\.)*stratumpr\.com$/, /^https:\/\/foodsafetymvp[a-z0-9-]*\.vercel\.app$/, /^http:\/\/localhost(:\d+)?$/];

/** Common guard for POST endpoints. Returns the parsed body, or null after responding. */
async function readRequest(req, res) {
  if (req.method !== "POST") { res.status(405).json({ ok: false, error: "method" }); return null; }
  const origin = req.headers.origin || "";
  if (origin && !ALLOWED_ORIGINS.some((re) => re.test(origin))) { res.status(403).json({ ok: false, error: "origin" }); return null; }
  if (rateLimited(req)) { res.status(429).json({ ok: false, error: "rate" }); return null; }
  // On Vercel without a Resend key, say so instead of pretending the email went out
  // (the pages then show their "couldn't send" messages). Locally, dry-run keeps working.
  if (process.env.VERCEL && DRY_RUN()) { console.warn("[api] RESEND_API_KEY is not set; nothing sent"); res.status(503).json({ ok: false, error: "not_configured" }); return null; }
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = null; } }
  if (!body || typeof body !== "object") { res.status(400).json({ ok: false, error: "body" }); return null; }
  if (JSON.stringify(body).length > 60000) { res.status(413).json({ ok: false, error: "size" }); return null; }
  if (body._gotcha) { res.status(200).json({ ok: true }); return null; } // honeypot: pretend success
  return body;
}

// ---------- Resend ----------
async function resend(pathname, payload, method = "POST") {
  const r = await fetch("https://api.resend.com" + pathname, {
    method,
    headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: method === "GET" ? undefined : JSON.stringify(payload || {}),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Resend ${pathname} ${r.status}: ${text.slice(0, 300)}`);
  try { return JSON.parse(text); } catch { return {}; }
}

/** Send one email. In dry-run mode, write it to .claude/outbox (local) or log it. */
async function sendEmail({ to, subject, html, text, replyTo, tag }) {
  const msg = { from: FROM(), to: Array.isArray(to) ? to : [to], subject, html, text };
  if (replyTo) msg.reply_to = replyTo;
  if (DRY_RUN()) {
    const dir = path.join(process.cwd(), ".claude", "outbox");
    try {
      fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, `${Date.now()}-${tag || "email"}.html`);
      fs.writeFileSync(file, `<!-- DRY RUN\nfrom: ${msg.from}\nto: ${msg.to.join(", ")}\nreply-to: ${replyTo || "-"}\nsubject: ${subject}\n-->\n${html}`);
      console.log(`[dry-run] ${tag || "email"} → ${msg.to.join(", ")} · "${subject}" · ${file}`);
    } catch {
      console.log(`[dry-run] ${tag || "email"} → ${msg.to.join(", ")} · "${subject}" (RESEND_API_KEY not set; email not sent)`);
    }
    return { dryRun: true };
  }
  return resend("/emails", msg);
}

/** The segment subscribers go into: RESEND_SEGMENT_ID, or looked up by name (RESEND_SEGMENT, default "Food Safety MVP"). */
let segmentCache;
async function segmentId() {
  if (env("RESEND_SEGMENT_ID")) return env("RESEND_SEGMENT_ID");
  if (segmentCache) return segmentCache;
  const want = env("RESEND_SEGMENT", "Food Safety MVP").toLowerCase();
  const list = await resend("/segments", null, "GET");
  const hit = (list.data || []).find((s) => String(s.name).trim().toLowerCase() === want);
  if (!hit) { console.warn(`[contacts] segment "${want}" not found in Resend; contact added without a segment`); return ""; }
  return (segmentCache = hit.id);
}

/** Add a confirmed subscriber to Resend Contacts (the mailing list) and to the site's segment. */
async function addToAudience({ email, name }) {
  if (DRY_RUN()) { console.log(`[dry-run] contacts += ${email}`); return { dryRun: true }; }
  const [first, ...rest] = String(name || "").trim().split(/\s+/);
  const segment = await segmentId().catch((e) => { console.warn("[contacts] segment lookup failed:", e.message); return ""; });
  const contact = { email, first_name: first || undefined, last_name: rest.join(" ") || undefined, unsubscribed: false };
  if (segment) contact.segments = [{ id: segment }];
  try {
    return await resend("/contacts", contact);
  } catch (e) {
    if (!/already exists/i.test(e.message)) throw e;
    // Already a contact (e.g. confirmed before, or added by hand): just make sure they're in the segment.
    if (segment) await resend(`/contacts/${encodeURIComponent(email)}/segments/${segment}`).catch((err) => console.warn("[contacts] add to segment:", err.message));
    return { exists: true };
  }
}

// ---------- signed double opt-in links ----------
const secret = () => {
  const s = env("CONFIRM_SECRET");
  if (s) return s;
  if (DRY_RUN()) return "dev-only-secret"; // local preview only
  throw new Error("CONFIRM_SECRET is not set"); // never sign real links with a guessable key
};
function sign(data) { return crypto.createHmac("sha256", secret()).update(data).digest("base64url").slice(0, 32); }
function confirmLink({ email, name, lang: l, source }) {
  const payload = Buffer.from(JSON.stringify({ e: email, n: clip(name, 80), l: lang(l), s: source, t: Date.now() })).toString("base64url");
  return `${SITE_URL()}/api/confirm?d=${payload}&sig=${sign(payload)}`;
}
function readConfirmLink(d, sig) {
  if (!d || !sig || sign(d) !== sig) return null;
  try {
    const data = JSON.parse(Buffer.from(d, "base64url").toString());
    if (!isEmail(data.e) || Date.now() - data.t > 30 * 864e5) return null; // links expire after 30 days
    return data;
  } catch { return null; }
}

// ---------- email layout (table-based + inline styles for email clients) ----------
const C = { navy: "#1E2B7E", blue: "#266AB2", ink: "#16204F", muted: "#586187", line: "#E2E5EC", bg: "#F3F5FA", sand: "#E6E09E", sandSoft: "#F6F3CF", olive: "#5B5410" };

function layout({ lang: l, preheader, body }) {
  const L = lang(l);
  const foot = L === "en"
    ? "Stratum PR is not affiliated with Walmart. Requirements vary by product category; confirm them with your buyer."
    : "Stratum PR no está afiliado con Walmart. Los requisitos varían por categoría de producto; confírmalos con tu comprador.";
  return `<!DOCTYPE html><html lang="${L}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Stratum</title></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:Arial,Helvetica,sans-serif;color:${C.ink};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader || "")}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid ${C.line};">
<tr><td style="background:${C.navy};background-image:linear-gradient(135deg,${C.navy},${C.blue});padding:22px 28px;">
  <img src="${SITE_URL()}/assets/stratum-logo-2.png" alt="Stratum" width="150" style="display:block;width:150px;height:auto;border:0;">
</td></tr>
<tr><td style="padding:28px;">${body}</td></tr>
<tr><td style="padding:18px 28px 24px;border-top:1px solid ${C.line};font-size:12px;line-height:1.5;color:${C.muted};">
  ${esc(foot)}<br><a href="${SITE_URL()}/privacidad.html" style="color:${C.blue};">${L === "en" ? "Privacy Policy" : "Política de privacidad"}</a> · Stratum PR · Trujillo Alto, Puerto Rico
</td></tr></table></td></tr></table></body></html>`;
}

const btn = (href, label) => `<a href="${esc(href)}" style="display:inline-block;background:${C.navy};color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:13px 22px;border-radius:10px;">${esc(label)}</a>`;

/** A simple key/value table for internal lead emails. */
function kvTable(rows) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">${rows
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `<tr><td style="padding:8px 10px;border-bottom:1px solid ${C.line};color:${C.muted};width:38%;vertical-align:top;">${esc(k)}</td><td style="padding:8px 10px;border-bottom:1px solid ${C.line};vertical-align:top;">${v}</td></tr>`)
    .join("")}</table>`;
}

/** Double opt-in email, shared by every form with a "news" checkbox. */
async function sendConfirmEmail({ email, name, lang: l, source }) {
  const L = lang(l);
  const link = confirmLink({ email, name, lang: L, source });
  const T = L === "en"
    ? { s: "Confirm your subscription to Stratum", h: "One click to confirm", p: "You asked to receive news from Stratum. Confirm your email and we'll add you to the list. If it wasn't you, just ignore this email.", b: "Confirm my subscription" }
    : { s: "Confirma tu suscripción a Stratum", h: "Un clic para confirmar", p: "Pediste recibir noticias de Stratum. Confirma tu correo y te añadimos a la lista. Si no fuiste tú, ignora este correo.", b: "Confirmar mi suscripción" };
  const html = layout({ lang: L, preheader: T.p, body: `<h1 style="margin:0 0 10px;font-size:22px;">${esc(T.h)}</h1><p style="margin:0 0 22px;font-size:15px;line-height:1.55;color:${C.muted};">${esc(T.p)}</p>${btn(link, T.b)}` });
  return sendEmail({ to: email, subject: T.s, html, text: `${T.p}\n\n${link}`, tag: "confirm" });
}

module.exports = { env, SITE_URL, LEADS_TO, DRY_RUN, esc, clip, isEmail, lang, hasLink, cleanName, readRequest, sendEmail, addToAudience, sendConfirmEmail, readConfirmLink, layout, btn, kvTable, C };
