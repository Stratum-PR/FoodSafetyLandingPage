/* POST /api/signup — early-access list.
   Lead email to LEADS_TO + double opt-in confirmation to the user
   (they join the mailing list only after clicking the link: /api/confirm). */
const { readRequest, sendEmail, sendConfirmEmail, layout, kvTable, esc, clip, cleanName, isEmail, lang, LEADS_TO, C } = require("./_lib");

module.exports = async (req, res) => {
  const b = await readRequest(req, res);
  if (!b) return;
  const name = cleanName(b.name), business = cleanName(b.business), email = clip(b.email, 254), phone = clip(b.phone, 40);
  if (!isEmail(email) || !name || !business) return res.status(400).json({ ok: false, error: "contact" });
  if (b.consent !== true) return res.status(400).json({ ok: false, error: "consent" });
  try {
    const title = `Acceso anticipado · ${business}`;
    const html = layout({ lang: "es", preheader: title, body: `
      <h1 style="margin:0 0 6px;font-size:20px;">${esc(title)}</h1>
      <p style="margin:0 0 18px;font-size:14px;color:${C.muted};">Se unió a la lista de acceso anticipado · ${esc(lang(b.lang).toUpperCase())}</p>
      ${kvTable([["Nombre", esc(name)], ["Negocio", esc(business)], ["Correo", `<a href="mailto:${esc(email)}">${esc(email)}</a>`], ["Teléfono", esc(phone)], ["Consentimiento", `Sí · ${esc(clip(b.consentAt, 40))}`], ["Lista de correo", "Pendiente de confirmar (doble opt-in)"]])}` });
    await Promise.all([
      sendEmail({ to: LEADS_TO(), subject: `Nuevo lead · ${title}`, html, text: `${title}\n${name} · ${email}`, replyTo: email, tag: "lead-signup" }),
      sendConfirmEmail({ email, name, lang: b.lang, source: "signup" }),
    ]);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[signup]", err);
    return res.status(502).json({ ok: false, error: "send" });
  }
};
