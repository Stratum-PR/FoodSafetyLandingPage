/* POST /api/contact — footer contact form. Goes only to LEADS_TO, with Reply-To set to the sender. */
const { readRequest, sendEmail, layout, kvTable, esc, clip, isEmail, lang, LEADS_TO, C } = require("./_lib");

module.exports = async (req, res) => {
  const b = await readRequest(req, res);
  if (!b) return;
  const name = clip(b.name, 80), business = clip(b.business, 80), email = clip(b.email, 254), message = clip(b.message, 4000);
  if (!isEmail(email) || !name || !business || !message) return res.status(400).json({ ok: false, error: "fields" });
  try {
    const title = `Mensaje de contacto · ${business}`;
    const html = layout({ lang: "es", preheader: title, body: `
      <h1 style="margin:0 0 6px;font-size:20px;">${esc(title)}</h1>
      <p style="margin:0 0 18px;font-size:14px;color:${C.muted};">Responde a este correo para contestarle directamente · ${esc(lang(b.lang).toUpperCase())}</p>
      ${kvTable([["Nombre", esc(name)], ["Negocio", esc(business)], ["Correo", `<a href="mailto:${esc(email)}">${esc(email)}</a>`]])}
      <div style="margin-top:18px;padding:16px;border-radius:12px;background:${C.bg};font-size:15px;line-height:1.55;white-space:pre-wrap;">${esc(message)}</div>` });
    await sendEmail({ to: LEADS_TO(), subject: title, html, text: `${name} <${email}> · ${business}\n\n${message}`, replyTo: email, tag: "contact" });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[contact]", err);
    return res.status(502).json({ ok: false, error: "send" });
  }
};
