/* POST /api/guide — requirements guide unlock form.
   Lead email to LEADS_TO; newsletter confirmation if "noticias" was ticked. */
const { readRequest, sendEmail, sendConfirmEmail, layout, kvTable, esc, clip, cleanName, isEmail, lang, LEADS_TO, C } = require("./_lib");

module.exports = async (req, res) => {
  const b = await readRequest(req, res);
  if (!b) return;
  const name = cleanName(b.name), business = cleanName(b.business), email = clip(b.email, 254), phone = clip(b.phone, 40), updates = !!b.updates;
  if (!isEmail(email) || !name || !business) return res.status(400).json({ ok: false, error: "contact" });
  try {
    const title = `Guía de requisitos · ${business}`;
    const html = layout({ lang: "es", preheader: title, body: `
      <h1 style="margin:0 0 6px;font-size:20px;">${esc(title)}</h1>
      <p style="margin:0 0 18px;font-size:14px;color:${C.muted};">Desbloqueó la guía de enlaces oficiales · ${esc(lang(b.lang).toUpperCase())}</p>
      ${kvTable([["Nombre", esc(name)], ["Negocio", esc(business)], ["Correo", `<a href="mailto:${esc(email)}">${esc(email)}</a>`], ["Teléfono", esc(phone)], ["Quiere noticias", updates ? "Sí (se envió confirmación)" : "No"]])}` });
    await Promise.all([
      sendEmail({ to: LEADS_TO(), subject: `Nuevo lead · ${title}`, html, text: `${title}\n${name} · ${email}`, replyTo: email, tag: "lead-guide" }),
      updates ? sendConfirmEmail({ email, name, lang: b.lang, source: "guide" }) : null,
    ]);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[guide]", err);
    return res.status(502).json({ ok: false, error: "send" });
  }
};
