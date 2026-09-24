/* POST /api/pricing — "Solicitar acceso" requests from the pricing page (precios.html).
   A pilot request, not a purchase: it emails the lead to LEADS_TO with the plan, billing and
   supplier range they picked (plus the ROI calculator numbers, if they came from it).
   Reply-To is the requester, like the contact form. Only known plan/billing/range values are
   accepted, and the free text is escaped. */
const { readRequest, sendEmail, layout, kvTable, esc, clip, isEmail, cleanName, lang, LEADS_TO, C } = require("./_lib");

const TIERS = { esencial: "Esencial ($179/mes)", profesional: "Profesional ($429/mes)", plus: "Planta Plus (desde $849/mes)", unsure: "No está seguro" };
const BILLING = { monthly: "Mensual", annual: "Anual (2 meses gratis)" };
const SUPPLIERS = ["1-5", "6-20", "21-50", "51-100", "100+"];
const SOURCES = { card: "Botón del plan", roi: "Calculadora de ROI", link: "Enlace directo" };

const n = (v, max) => { const x = Number(v); return Number.isFinite(x) ? Math.max(-max, Math.min(max, Math.round(x))) : null; };

module.exports = async (req, res) => {
  const b = await readRequest(req, res);
  if (!b) return;
  const name = cleanName(b.name, 80), business = cleanName(b.business, 80), email = clip(b.email, 254);
  const phone = clip(b.phone, 40).replace(/[^\d+()\-\s.]/g, ""), message = clip(b.message, 2000);
  const tier = TIERS[b.tier] ? b.tier : null, billing = BILLING[b.billing] ? b.billing : null;
  const suppliers = SUPPLIERS.includes(b.suppliers) ? b.suppliers : null;
  if (!isEmail(email) || !name || !business || !tier || !billing || !suppliers) return res.status(400).json({ ok: false, error: "fields" });

  const r = b.roi && typeof b.roi === "object" ? b.roi : null;
  const roiRows = r ? [
    ["Suplidores (calculadora)", esc(n(r.suppliers, 100000) ?? "—")],
    ["Horas al mes (documentos + auditorías)", esc(n(r.hoursPerMonth, 10000) ?? "—")],
    ["Costo por hora", "$" + esc(n(r.rate, 10000) ?? "—")],
    ["Consultoría que podría reducir", "$" + esc(n(r.consulting, 1000000) ?? "—") + "/mes"],
    ["Ahorro esperado", esc(n(r.savePct, 100) ?? "—") + "%"],
    ["Diferencia estimada", "$" + esc(n(r.netPerMonth, 1000000) ?? "—") + "/mes"],
  ] : [];

  try {
    const title = `Solicitud de acceso · ${TIERS[tier].split(" (")[0]} · ${business}`;
    const html = layout({ lang: "es", preheader: title, body: `
      <h1 style="margin:0 0 6px;font-size:20px;">${esc(title)}</h1>
      <p style="margin:0 0 18px;font-size:14px;color:${C.muted};">Desde la página de precios (${esc(SOURCES[b.source] || "—")}) · ${esc(lang(b.lang).toUpperCase())} · responde a este correo para contestarle directamente</p>
      ${kvTable([
        ["Nombre", esc(name)], ["Negocio", esc(business)],
        ["Correo", `<a href="mailto:${esc(email)}">${esc(email)}</a>`], ["Teléfono", esc(phone || "—")],
        ["Plan", esc(TIERS[tier])], ["Pago", esc(BILLING[billing])], ["Suplidores activos", esc(suppliers)],
        ...roiRows,
      ])}
      ${message ? `<div style="margin-top:18px;padding:16px;border-radius:12px;background:${C.bg};font-size:15px;line-height:1.55;white-space:pre-wrap;">${esc(message)}</div>` : ""}` });
    await sendEmail({
      to: LEADS_TO(), subject: title, html, replyTo: email, tag: "pricing",
      text: `${name} <${email}> · ${business}\nPlan: ${TIERS[tier]} · ${BILLING[billing]} · ${suppliers} suplidores\n\n${message}`,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[pricing]", err);
    return res.status(502).json({ ok: false, error: "send" });
  }
};
