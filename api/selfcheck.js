/* POST /api/selfcheck — self-check submissions.
   stage "completed":      passport email to the user + lead email to LEADS_TO
                           (+ newsletter confirmation if they ticked "noticias")
   stage "lab_connect" /
         "design_partner": hot-lead email to LEADS_TO
   Anything else is accepted and ignored (no database yet).

   The passport email is built from js/selfcheck-data.js (our own text), looked up by
   item key. From the request we only take numbers, item keys and the escaped
   name/business, so the form can't be used to mail arbitrary content to strangers. */
const { readRequest, sendEmail, sendConfirmEmail, layout, btn, kvTable, esc, clip, cleanName, isEmail, lang, LEADS_TO, SITE_URL, C } = require("./_lib");
const DATA = require("../js/selfcheck-data.js");
const GUIDE = require("../js/guide.js");

/* Full official-links guide (same groups as the site). Links tied to one of the
   user's pending items get a "Para ti" tag. */
function guideSection(r, L) {
  const T = L === "en"
    ? { h: "Official links guide", p: "Every requirement for supplying Walmart, with its official source.", forYou: "For you", verified: "Sources verified September 21, 2026." }
    : { h: "Guía de enlaces oficiales", p: "Cada requisito para suplir a Walmart, con su fuente oficial.", forYou: "Para ti", verified: "Fuentes verificadas el 21 de septiembre de 2026." };
  const mine = new Set(r.pending.map((p) => p.url).filter(Boolean));
  const tones = { walmart: "#DCE8F8", registro: "#F3EEBF", fda: "#E4E8F5" };
  return `
  <h2 style="margin:30px 0 4px;font-size:18px;">${esc(T.h)}</h2>
  <p style="margin:0 0 12px;font-size:14px;color:${C.muted};">${esc(T.p)}</p>
  ${GUIDE.GUIDE_GROUPS.map((g) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 10px;border-radius:12px;background:${tones[g.tone] || C.bg};">
      <tr><td style="padding:12px 14px 4px;font-size:15px;font-weight:bold;color:${C.ink};">${esc(g[L])}</td></tr>
      ${g.idx.map((i) => GUIDE.GUIDE[i]).map(([url, label, host]) => `
      <tr><td style="padding:8px 14px;border-top:1px solid rgba(22,32,79,.08);">
        <a href="${esc(url)}" style="font-size:14px;font-weight:bold;color:${C.blue};text-decoration:none;">${esc(label[L])} ↗</a>
        ${mine.has(url) ? `&nbsp;<span style="display:inline-block;background:${C.sand};color:${C.navy};font-size:11px;font-weight:bold;padding:1px 7px;border-radius:5px;">${esc(T.forYou)}</span>` : ""}
        <div style="font-size:12px;color:${C.muted};">${esc(host)}</div>
      </td></tr>`).join("")}
      <tr><td style="height:6px;line-height:6px;font-size:0;">&nbsp;</td></tr>
    </table>`).join("")}
  <p style="margin:6px 0 0;font-size:12px;color:${C.muted};">${esc(T.verified)}</p>`;
}

const TIER_COLORS = { ready: ["#E6F4EE", "#1b7a4c"], close: [C.sandSoft, C.olive], gaps: ["#FCECEA", "#B3261E"] };

function buildReport(b) {
  const L = lang(b.lang), r = b.report || {};
  const keys = (arr) => (Array.isArray(arr) ? arr : []).filter((k) => typeof k === "string" && DATA.ITEMS[k]).slice(0, 20);
  const item = (k) => { const it = DATA.ITEMS[k]; return { t: it[L][0], d: it[L][1], url: it.url || "", prio: !!it.block, sec: DATA.SECTIONS[L][it.sec] }; };
  const tier = ["ready", "close", "gaps"].includes(r.tier) ? r.tier : "close";
  const num = (v, max) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));
  return {
    tier, tierLabel: DATA.TIERS[L][tier][0], tierText: DATA.TIERS[L][tier][1], tierLabelEs: DATA.TIERS.es[tier][0],
    points: num(r.points, 64), max: num(r.max, 64), pct: num(r.pct, 100), blockers: num(r.blockers, 20),
    passNo: /^PR-\d{2}-[A-Z0-9]{4}$/.test(r.passNo || "") ? r.passNo : "",
    issued: new Date().toLocaleDateString(L === "es" ? "es-PR" : "en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Puerto_Rico" }),
    pending: keys(r.pendingKeys).map(item),
    done: keys(r.doneKeys).map((k) => DATA.ITEMS[k][L][0]),
    stamps: (() => {
      const pk = keys(r.pendingKeys), dk = keys(r.doneKeys);
      const secs = [...new Set([...pk, ...dk].map((k) => DATA.ITEMS[k].sec))].sort();
      return secs.map((sec) => {
        const n = [...pk, ...dk].filter((k) => DATA.ITEMS[k].sec === sec).length;
        const ok = dk.filter((k) => DATA.ITEMS[k].sec === sec).length;
        return { name: DATA.SECTIONS[L][sec], ok, n, done: ok === n };
      });
    })(),
  };
}

/* The passport card, rebuilt for email: tables + inline styles only (no SVG/animation),
   with solid-color fallbacks where Gmail/Outlook drop gradients or rounded corners. */
function passportCard(r, c, L) {
  const T = L === "en"
    ? { title: "Walmart passport", no: "No.", holder: "Holder", origin: "Your business", dest: "Walmart", pts: "points", pend: "To do", prio: "Priorities", issued: "Issued", stamps: "Stamps", ok: "Approved" }
    : { title: "Pasaporte Walmart", no: "Nº", holder: "Titular", origin: "Tu negocio", dest: "Walmart", pts: "puntos", pend: "Pendientes", prio: "Prioridades", issued: "Emitido", stamps: "Sellos", ok: "Aprobado" };
  const [tierBg, tierFg] = TIER_COLORS[r.tier];
  const pct = r.max ? Math.round((r.points / r.max) * 100) : 0;
  const bar = Math.max(4, Math.min(96, pct)); // keep a sliver visible at the ends
  const label = `font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;`;
  const stampCell = (st) => `
      <td align="center" valign="top" width="25%" style="width:25%;padding:0 2px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
          <td align="center" valign="middle" width="56" height="56" style="width:56px;min-width:56px;height:56px;border-radius:50%;${st.done
            ? `border:2px solid ${C.navy};background:#F4F6FC;color:${C.navy};`
            : `border:2px dashed ${C.line};color:${C.muted};`}font-family:Arial,Helvetica,sans-serif;">
            ${st.done
              ? `<div style="font-size:20px;line-height:20px;font-weight:bold;">✓</div><div style="font-size:7px;font-weight:bold;letter-spacing:.3px;text-transform:uppercase;">${esc(T.ok)}</div>`
              : `<div style="font-size:15px;font-weight:bold;">${st.ok}/${st.n}</div>`}
          </td></tr></table>
        <div style="margin-top:6px;font-size:11.5px;font-weight:bold;color:${C.ink};">${esc(st.name)}</div>
      </td>`;

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.line};border-radius:18px;overflow:hidden;border-collapse:separate;">
    <!-- navy header: logo, number, holder, PR → WMT progress -->
    <tr><td style="background:${C.navy};background-image:linear-gradient(135deg,${C.navy},${C.blue});padding:20px 22px 22px;color:#ffffff;border-radius:18px 18px 0 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td valign="middle" width="45%" style="width:45%;"><img src="${SITE_URL()}/assets/stratum-logo-2.png" alt="Stratum" width="104" style="display:block;width:104px;max-width:100%;height:auto;border:0;"></td>
        <td valign="middle" align="right" style="color:#ffffff;padding-left:10px;">
          <div style="${label}">${esc(T.title)}</div>
          ${r.passNo ? `<div style="font-size:12px;font-weight:bold;letter-spacing:.5px;color:#E4E8F5;">${esc(T.no)} ${esc(r.passNo)}</div>` : ""}
        </td></tr></table>
      <div style="margin-top:16px;${label}color:#E4E8F5;">${esc(T.holder)}</div>
      <div style="font-size:22px;font-weight:bold;line-height:1.2;color:#ffffff;">${esc(c.biz)}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;"><tr>
        <td valign="middle" width="56" style="width:56px;color:#ffffff;"><div style="font-size:22px;font-weight:bold;line-height:1;">PR</div><div style="font-size:11px;color:#E4E8F5;margin-top:3px;">${esc(T.origin)}</div></td>
        <td valign="middle" style="padding:0 10px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td width="${bar}%" style="height:4px;line-height:4px;font-size:0;background:${C.sand};border-radius:4px;">&nbsp;</td>
            <td style="height:4px;line-height:4px;font-size:0;background:#4A5AA8;">&nbsp;</td>
          </tr></table>
          <div style="margin-top:6px;text-align:center;"><span style="display:inline-block;background:${C.sand};color:${C.navy};font-size:12px;font-weight:bold;padding:2px 9px;border-radius:999px;">${pct}%</span></div>
        </td>
        <td valign="middle" width="64" align="right" style="width:64px;color:#ffffff;"><div style="font-size:22px;font-weight:bold;line-height:1;">WMT</div><div style="font-size:11px;color:#E4E8F5;margin-top:3px;">${esc(T.dest)}</div></td>
      </tr></table>
    </td></tr>

    <!-- score + tier -->
    <tr><td style="padding:20px 22px 6px;background:#ffffff;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td valign="middle" width="112" style="width:112px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td align="center" valign="middle" width="96" height="96" style="width:96px;height:96px;border-radius:50%;border:9px solid ${C.navy};background:#ffffff;">
              <div style="font-size:30px;font-weight:bold;line-height:1;color:${C.ink};">${r.points}</div>
              <div style="font-size:11px;color:${C.muted};">/ ${r.max}</div>
            </td></tr></table>
        </td>
        <td valign="middle" style="padding-left:6px;">
          <span style="display:inline-block;background:${tierBg};color:${tierFg};font-weight:bold;font-size:13px;padding:4px 12px;border-radius:999px;">${esc(r.tierLabel)}</span>
          <div style="margin-top:8px;font-size:14px;line-height:1.45;color:${C.muted};">${esc(r.tierText)}</div>
        </td></tr></table>
    </td></tr>

    <!-- fields -->
    <tr><td style="padding:12px 22px 16px;background:#ffffff;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.line};"><tr>
        <td style="padding-top:12px;padding-right:12px;"><div style="${label}letter-spacing:.5px;color:${C.muted};">${esc(T.pend)}</div><div style="font-size:16px;font-weight:bold;">${r.pending.length}</div></td>
        <td style="padding-top:12px;padding-right:12px;"><div style="${label}letter-spacing:.5px;color:${C.muted};">${esc(T.prio)}</div><div style="font-size:16px;font-weight:bold;">${r.blockers}</div></td>
        <td style="padding-top:12px;" align="right"><div style="${label}letter-spacing:.5px;color:${C.muted};">${esc(T.issued)}</div><div style="font-size:16px;font-weight:bold;">${esc(r.issued)}</div></td>
      </tr></table>
    </td></tr>

    <!-- tear-off line + stamps -->
    <tr><td style="padding:0 22px;background:#ffffff;"><div style="border-top:2px dashed ${C.line};height:0;line-height:0;font-size:0;">&nbsp;</div></td></tr>
    <tr><td style="padding:14px 18px 22px;background:#ffffff;border-radius:0 0 18px 18px;">
      <div style="${label}color:${C.muted};padding:0 4px 12px;">${esc(T.stamps)}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${r.stamps.map(stampCell).join("")}</tr></table>
    </td></tr>
  </table>`;
}

function passportEmail(b, r) {
  const L = lang(b.lang), c = b.contact;
  const T = L === "en"
    ? { s: "Your Walmart passport", hi: "Hi", intro: "Here is your Walmart passport from the Stratum self-check. Keep it handy: every pending item comes with its official source.", holder: "Holder", no: "No.", issued: "Issued", pts: "points", pend: "Your to-do list", prio: "Priority", src: "Official source", have: "Already done", none: "Nothing pending. Check that everything stays current each year.", guide: "Open the guide on the site", q: "Questions? Just reply to this email." }
    : { s: "Tu pasaporte Walmart", hi: "Hola", intro: "Aquí tienes tu pasaporte Walmart de la autoevaluación de Stratum. Guárdalo: cada pendiente incluye su fuente oficial.", holder: "Titular", no: "Nº", issued: "Emitido", pts: "puntos", pend: "Tu lista de pendientes", prio: "Prioridad", src: "Fuente oficial", have: "Ya tienes", none: "No tienes pendientes. Revisa que todo siga vigente cada año.", guide: "Abrir la guía en el sitio", q: "¿Preguntas? Responde a este correo." };
  const [tierBg, tierFg] = TIER_COLORS[r.tier];

  const body = `
  <p style="margin:0 0 6px;font-size:15px;">${esc(T.hi)} ${esc(c.name)},</p>
  <p style="margin:0 0 22px;font-size:15px;line-height:1.55;color:${C.muted};">${esc(T.intro)}</p>

  ${passportCard(r, c, L)}

  <h2 style="margin:28px 0 10px;font-size:18px;">${esc(T.pend)} (${r.pending.length})</h2>
  ${r.pending.length ? r.pending.map((p) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 10px;border:1px solid ${p.prio ? "#E8E2AE" : C.line};border-radius:12px;background:${p.prio ? C.sandSoft : "#ffffff"};">
      <tr><td style="padding:12px 14px;">
        <div style="font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${C.blue};">${esc(p.sec)}${p.prio ? ` · <span style="color:${C.olive}">${esc(T.prio)}</span>` : ""}</div>
        <div style="font-size:15px;font-weight:bold;margin:4px 0 3px;">${esc(p.t)}</div>
        <div style="font-size:14px;line-height:1.5;color:${C.muted};">${esc(p.d)}</div>
        ${p.url ? `<a href="${esc(p.url)}" style="display:inline-block;margin-top:6px;font-size:14px;font-weight:bold;color:${C.blue};">${esc(T.src)} ↗</a>` : ""}
      </td></tr>
    </table>`).join("") : `<p style="font-size:14px;color:${C.muted};">${esc(T.none)}</p>`}

  ${r.done.length ? `<h2 style="margin:24px 0 8px;font-size:16px;">${esc(T.have)} (${r.done.length})</h2>
  <p style="margin:0;font-size:14px;line-height:1.7;color:${C.muted};">${r.done.map((d) => `✓ ${esc(d)}`).join("<br>")}</p>` : ""}

  ${guideSection(r, L)}

  <div style="margin:28px 0 10px;">${btn(`${SITE_URL()}/?lang=${L}#guia`, T.guide)}</div>
  <p style="margin:12px 0 0;font-size:14px;color:${C.muted};">${esc(T.q)}</p>`;

  const text = [`${T.s} · ${c.biz}`, `${r.points}/${r.max} · ${r.tierLabel}`, "",
    `${T.pend}:`, ...r.pending.map((p) => `- ${p.t}${p.prio ? ` (${T.prio})` : ""}: ${p.d}${p.url ? ` ${p.url}` : ""}`),
    "", L === "en" ? "Official links:" : "Enlaces oficiales:", ...GUIDE.GUIDE.map(([url, label]) => `- ${label[L]}: ${url}`)].join("\n");
  return { subject: `${T.s} · ${c.biz}`, html: layout({ lang: L, preheader: `${r.points}/${r.max} · ${r.tierLabel}`, body }), text };
}

/* Internal lead email (goes only to LEADS_TO), so it can include everything the user typed. */
function leadEmail(b, r, title) {
  const c = b.contact;
  const qa = Array.isArray(b.qa) ? b.qa.slice(0, 40) : [];
  const body = `
  <h1 style="margin:0 0 6px;font-size:20px;">${esc(title)}</h1>
  <p style="margin:0 0 18px;font-size:14px;color:${C.muted};">${esc(new Date().toLocaleString("es-PR", { timeZone: "America/Puerto_Rico" }))} · ${esc(lang(b.lang).toUpperCase())}</p>
  ${kvTable([
    ["Nombre", esc(c.name)],
    ["Negocio", esc(c.biz)],
    ["Correo", `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`],
    ["Teléfono", esc(c.phone)],
    ["Quiere noticias", c.updates ? "Sí (se envió confirmación)" : "No"],
    ["Puntuación", r ? `${r.points} / ${r.max} (${r.pct}%) · ${esc(r.tierLabelEs)}` : ""],
    ["Idioma del usuario", lang(b.lang) === "en" ? "Inglés" : "Español"],
    ["Prioridades pendientes", r ? String(r.blockers) : ""],
    ["Pendientes", r ? esc(r.pending.map((p) => p.t).join(", ")) : ""],
    ["Pidió laboratorio", b.labConnect ? "Sí" : ""],
    ["Pasaporte", r ? esc(r.passNo) : ""],
  ])}
  ${qa.length ? `<h2 style="margin:22px 0 8px;font-size:16px;">Respuestas</h2>${kvTable(qa.map((x) => [clip(x.q, 200), esc(clip(x.a, 400))]))}` : ""}`;
  return { html: layout({ lang: "es", preheader: title, body }), text: `${title}\n${c.name} · ${c.biz} · ${c.email}` };
}

module.exports = async (req, res) => {
  const b = await readRequest(req, res);
  if (!b) return;
  const raw = b.contact || {};
  // name/business end up in an email sent to the typed address: no links allowed
  b.contact = { name: cleanName(raw.name), biz: cleanName(raw.biz), email: clip(raw.email, 254), phone: clip(raw.phone, 40), updates: !!raw.updates };
  const c = b.contact;
  try {
    if (b.stage === "completed") {
      if (!isEmail(c.email) || !c.name || !c.biz) return res.status(400).json({ ok: false, error: "contact" });
      const r = buildReport(b);
      const passport = passportEmail(b, r);
      const lead = leadEmail(b, r, `Autoevaluación completada · ${c.biz} · ${r.points}/${r.max}`);
      await Promise.all([
        sendEmail({ to: c.email, subject: passport.subject, html: passport.html, text: passport.text, replyTo: LEADS_TO(), tag: "passport" }),
        sendEmail({ to: LEADS_TO(), subject: `Nuevo lead · Autoevaluación · ${c.biz} · ${r.points}/${r.max} (${r.tierLabelEs})`, html: lead.html, text: lead.text, replyTo: c.email, tag: "lead-selfcheck" }),
        c.updates ? sendConfirmEmail({ email: c.email, name: c.name, lang: b.lang, source: "selfcheck" }) : null,
      ]);
      return res.status(200).json({ ok: true });
    }
    if (b.stage === "lab_connect" || b.stage === "design_partner") {
      if (!isEmail(c.email)) return res.status(400).json({ ok: false, error: "contact" });
      const what = b.stage === "lab_connect" ? "Quiere conectar con un laboratorio" : "Quiere la revisión gratis (socio de diseño)";
      const lead = leadEmail(b, buildReport(b), `🔥 ${what} · ${c.biz || c.email}`);
      await sendEmail({ to: LEADS_TO(), subject: `🔥 Lead caliente · ${what} · ${c.biz || c.email}`, html: lead.html, text: lead.text, replyTo: c.email, tag: "lead-hot" });
      return res.status(200).json({ ok: true });
    }
    return res.status(204).end(); // other events: nothing to store yet
  } catch (err) {
    console.error("[selfcheck]", err);
    return res.status(502).json({ ok: false, error: "send" });
  }
};
