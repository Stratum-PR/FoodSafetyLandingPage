/* GET /api/confirm?d=…&sig=… — the link in the double opt-in email.
   Verifies the signature, adds the address to the Resend audience, shows a small page. */
const { readConfirmLink, addToAudience, esc, lang, SITE_URL } = require("./_lib");

function page(l, ok) {
  const L = lang(l);
  const T = L === "en"
    ? ok ? ["You're subscribed", "Thanks for confirming. We'll send you Stratum news; you can unsubscribe from any email."] : ["Link not valid", "This confirmation link is invalid or has expired. Sign up again from the site to get a new one."]
    : ok ? ["¡Suscripción confirmada!", "Gracias por confirmar. Te enviaremos noticias de Stratum; puedes darte de baja desde cualquier correo."] : ["Enlace no válido", "Este enlace de confirmación no es válido o ya expiró. Regístrate otra vez desde el sitio para recibir uno nuevo."];
  return `<!DOCTYPE html><html lang="${L}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(T[0])} · Stratum</title></head>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#F3F5FA;font-family:Arial,Helvetica,sans-serif;color:#16204F;padding:24px;">
<main style="max-width:460px;background:#fff;border:1px solid #E2E5EC;border-radius:20px;padding:32px;text-align:center;">
<img src="${SITE_URL()}/assets/stratum-logo-4.png" alt="Stratum" width="150" style="width:150px;height:auto;">
<h1 style="font-size:24px;margin:24px 0 10px;">${esc(T[0])}</h1><p style="color:#586187;line-height:1.55;margin:0 0 24px;">${esc(T[1])}</p>
<a href="${SITE_URL()}/?lang=${L}" style="display:inline-block;background:#1E2B7E;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:10px;">${L === "en" ? "Back to Stratum" : "Volver a Stratum"}</a>
</main></body></html>`;
}

module.exports = async (req, res) => {
  const q = req.query || {};
  let data = null;
  try { data = readConfirmLink(q.d, q.sig); } catch (err) { console.error("[confirm]", err); }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  if (!data) return res.status(400).send(page(q.l, false));
  try {
    await addToAudience({ email: data.e, name: data.n });
    return res.status(200).send(page(data.l, true));
  } catch (err) {
    console.error("[confirm]", err);
    return res.status(502).send(page(data.l, false));
  }
};
