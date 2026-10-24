/* POST /api/demo — "Agenda una demo" form on the home page. Goes only to LEADS_TO, with Reply-To set to the sender. */
const { readRequest, sendEmail, layout, kvTable, esc, clip, cleanName, isEmail, lang, LEADS_TO, C } = require("./_lib");

module.exports = async (req, res) => {
  const b = await readRequest(req, res);
  if (!b) return;
  const name = cleanName(b.name), business = cleanName(b.business), email = clip(b.email, 254), phone = clip(b.phone, 40);
  if (!isEmail(email) || !name || !business) return res.status(400).json({ ok: false, error: "fields" });
  try {
    const title = `Solicitud de demo · ${business}`;
    const html = layout({ lang: "es", preheader: title, body: `
      <h1 style="margin:0 0 6px;font-size:20px;">${esc(title)}</h1>
      <p style="margin:0 0 18px;font-size:14px;color:${C.muted};">Pidió una demo de StratumScan desde la página principal · ${esc(lang(b.lang).toUpperCase())}</p>
      ${kvTable([["Nombre", esc(name)], ["Negocio", esc(business)], ["Correo", `<a href="mailto:${esc(email)}">${esc(email)}</a>`], ["Teléfono", esc(phone)]])}` });
    await sendEmail({ to: LEADS_TO(), subject: `Nuevo lead · ${title}`, html, text: `${title}\n${name} · ${email} · ${phone}`, replyTo: email, tag: "lead-demo" });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[demo]", err);
    return res.status(502).json({ ok: false, error: "send" });
  }
};
