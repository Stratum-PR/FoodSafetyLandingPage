/* GET/POST /api/plan — the private MVP plan page, behind a password.

   The page is stored encrypted in api/_plan-data.js (safe in the public repo) and is decrypted
   here only after the password matches. Both values live in Vercel, never in the repo:
     PLAN_PASSWORD   the password to open the page
     PLAN_KEY        32 random bytes, base64: decrypts the page and signs the session cookie

   A correct password sets a 12-hour cookie scoped to /api/plan. Failed attempts are limited per IP
   (best effort, per serverless instance, like the other forms). Changing PLAN_PASSWORD signs
   everyone out. */
const crypto = require("crypto");

const COOKIE = "stratum_plan";
const SESSION_S = 12 * 60 * 60;
const MAX_FAILS = 5;
const WINDOW_MS = 15 * 60 * 1000;

const env = (k) => (process.env[k] || "").trim();
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ipOf = (req) => String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "?").split(",")[0].trim();

// ---------- failed-attempt limit ----------
const fails = new Map();
const recentFails = (ip) => (fails.get(ip) || []).filter((t) => Date.now() - t < WINDOW_MS);
function recordFail(ip) {
  const list = recentFails(ip);
  list.push(Date.now());
  fails.set(ip, list);
  if (fails.size > 5000) fails.clear();
  return list.length;
}

// ---------- crypto ----------
function keyBytes() {
  const k = Buffer.from(env("PLAN_KEY"), "base64");
  return k.length === 32 ? k : null;
}
const sign = (key, value) => crypto.createHmac("sha256", key).update(value).digest("base64url");
const sameText = (a, b) => {
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
};
// The signature covers the password too, so changing PLAN_PASSWORD ends every session.
const sessionValue = (key, exp) => `${exp}.${sign(key, `plan|${exp}|${env("PLAN_PASSWORD")}`)}`;
function validSession(req, key) {
  const m = String(req.headers.cookie || "").match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!m) return false;
  const [exp] = m[1].split(".");
  if (!/^\d+$/.test(exp) || Number(exp) < Math.floor(Date.now() / 1000)) return false;
  return sameText(m[1], sessionValue(key, exp));
}
function decryptPage(key) {
  const p = require("./_plan-data");
  const d = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(p.iv, "base64"));
  d.setAuthTag(Buffer.from(p.tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(p.data, "base64")), d.final()]).toString("utf8");
}

// ---------- responses ----------
function send(res, status, html) {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, private");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("X-Frame-Options", "DENY");
  // "same-origin", not "no-referrer": with no-referrer, browsers send `Origin: null` on the form
  // post and the origin check below would reject every attempt.
  res.setHeader("Referrer-Policy", "same-origin");
  res.end(html);
}

function formPage(message = "", disabled = false) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Stratum FSQMS MVP</title>
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/css/fonts.css">
<style>
  :root{--bg:#F3F5FA;--card:#fff;--ink:#16204F;--muted:#586187;--line:#DDE1EC;--navy:#1E2B7E;--bad:#B3261E;--bad-bg:#FBE7E5}
  @media (prefers-color-scheme:dark){:root{color-scheme:dark;--bg:#0C1130;--card:#141B42;--ink:#E7EAF7;--muted:#9EA6CB;--line:#27305E;--navy:#3A4FC0;--bad:#F29389;--bad-bg:#3E1B1B}}
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px 16px;background:var(--bg);color:var(--ink);font-family:"Archivo","Segoe UI",system-ui,sans-serif}
  main{width:100%;max-width:380px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:28px 24px}
  .eyebrow{font-family:ui-monospace,Consolas,monospace;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
  h1{font-size:24px;line-height:1.15;margin:6px 0 6px}
  p{margin:0 0 18px;color:var(--muted);font-size:15px;line-height:1.5}
  label{display:block;font-size:14px;font-weight:600;margin-bottom:6px}
  input{width:100%;font:inherit;font-size:18px;letter-spacing:.2em;padding:11px 12px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--ink)}
  input:focus-visible,button:focus-visible{outline:3px solid #266AB2;outline-offset:2px}
  button{margin-top:14px;width:100%;font:inherit;font-size:16px;font-weight:700;padding:12px;border:0;border-radius:10px;background:var(--navy);color:#fff;cursor:pointer}
  button:disabled{opacity:.5;cursor:not-allowed}
  .err{margin:12px 0 0;padding:9px 11px;border-radius:9px;background:var(--bad-bg);color:var(--bad);font-size:14px}
</style>
</head>
<body>
<main>
  <div class="eyebrow">Stratum PR · Internal</div>
  <h1>MVP plan</h1>
  <p>This page is private. Enter the password to open it.</p>
  <form method="post" action="/api/plan">
    <label for="password">Password</label>
    <input id="password" name="password" type="password" inputmode="numeric" autocomplete="current-password" required autofocus${disabled ? " disabled" : ""}>
    <button type="submit"${disabled ? " disabled" : ""}>Open the plan</button>
    ${message ? `<p class="err" role="alert">${esc(message)}</p>` : ""}
  </form>
</main>
</body>
</html>`;
}

// Form posts arrive parsed on Vercel and as a raw string from the local dev server.
function readPassword(body) {
  if (body && typeof body === "object") return String(body.password || "");
  return new URLSearchParams(String(body || "")).get("password") || "";
}

module.exports = async (req, res) => {
  const key = keyBytes();
  if (!key || !env("PLAN_PASSWORD")) {
    console.warn("[plan] PLAN_KEY or PLAN_PASSWORD is not set");
    return send(res, 503, formPage("The plan isn't set up on this server yet.", true));
  }

  if (req.method === "GET") {
    if (!validSession(req, key)) return send(res, 200, formPage());
    try { return send(res, 200, decryptPage(key)); }
    catch (err) {
      console.error("[plan] can't decrypt; is PLAN_KEY the one used by dev/encrypt-plan.js?", err.message);
      return send(res, 500, formPage("The plan couldn't be opened. Check the server settings.", true));
    }
  }

  if (req.method !== "POST") { res.statusCode = 405; res.setHeader("Allow", "GET, POST"); return res.end(); }

  const origin = req.headers.origin;
  if (origin) {
    let host = "";
    try { host = new URL(origin).host; } catch {}
    if (host !== req.headers.host) return send(res, 403, formPage("This form can only be sent from the plan page."));
  }

  const ip = ipOf(req);
  if (recentFails(ip).length >= MAX_FAILS) {
    return send(res, 429, formPage("Too many wrong attempts. Try again in 15 minutes.", true));
  }

  if (!sameText(readPassword(req.body), env("PLAN_PASSWORD"))) {
    const left = MAX_FAILS - recordFail(ip);
    return send(res, 401, formPage(left > 0
      ? `That password isn't right. ${left} ${left === 1 ? "attempt" : "attempts"} left.`
      : "Too many wrong attempts. Try again in 15 minutes.", left <= 0));
  }

  fails.delete(ip);
  const exp = Math.floor(Date.now() / 1000) + SESSION_S;
  const secure = process.env.VERCEL || req.headers["x-forwarded-proto"] === "https" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${COOKIE}=${sessionValue(key, exp)}; Path=/api/plan; Max-Age=${SESSION_S}; HttpOnly; SameSite=Strict${secure}`);
  res.statusCode = 303; // back to GET, so a refresh doesn't resend the password
  res.setHeader("Location", "/api/plan");
  res.setHeader("Cache-Control", "no-store");
  return res.end();
};
