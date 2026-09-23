// Local preview server for the Stratum site (dev only; excluded from Vercel by .vercelignore).
// - Serves the static site with no-cache headers (edits show on a normal refresh)
// - Runs /api/*.js like Vercel does (req.body / req.query / res.status().json())
// - With no RESEND_API_KEY, emails are written to .claude/outbox/ instead of sent;
//   browse them at http://localhost:5173/__outbox
const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const ROOT = path.resolve(__dirname, "..");
const OUTBOX = path.join(ROOT, ".claude", "outbox");
const PORT = 5173;
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon" };
process.chdir(ROOT);

function vercelRes(res) {
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (o) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(o)); return res; };
  res.send = (b) => { res.end(b); return res; };
  return res;
}

async function runApi(name, req, res, url) {
  const file = path.join(ROOT, "api", name + ".js");
  if (name.startsWith("_") || !fs.existsSync(file)) { res.statusCode = 404; return res.end("Not found"); }
  delete require.cache[require.resolve(file)]; // pick up edits without restarting
  for (const k of Object.keys(require.cache)) if (k.includes(path.join(ROOT, "api")) || k.endsWith("selfcheck-data.js") || k.endsWith("guide.js")) delete require.cache[k];
  let raw = "";
  for await (const chunk of req) raw += chunk;
  const ct = req.headers["content-type"] || "";
  req.body = ct.includes("application/json") ? (() => { try { return JSON.parse(raw || "{}"); } catch { return raw; } })() : raw;
  req.query = Object.fromEntries(url.searchParams);
  try { await require(file)(req, vercelRes(res)); }
  catch (e) { console.error(e); if (!res.headersSent) { res.statusCode = 500; res.end("error"); } }
}

function outboxIndex(res) {
  const files = fs.existsSync(OUTBOX) ? fs.readdirSync(OUTBOX).filter((f) => f.endsWith(".html")).sort().reverse() : [];
  const rows = files.map((f) => {
    const head = fs.readFileSync(path.join(OUTBOX, f), "utf8").slice(0, 600);
    const get = (k) => (head.match(new RegExp(k + ": (.*)")) || [])[1] || "";
    return `<tr><td>${new Date(+f.split("-")[0]).toLocaleTimeString()}</td><td>${f.split("-").slice(1).join("-").replace(".html", "")}</td><td>${get("to")}</td><td><a href="/__outbox/${f}">${get("subject")}</a></td></tr>`;
  }).join("");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(`<!doctype html><meta charset="utf-8"><title>Outbox (dry run)</title><body style="font-family:system-ui;padding:24px;color:#16204F">
<h1>Outbox · dry run</h1><p>Emails that would have been sent (no RESEND_API_KEY set). Newest first.</p>
<table cellpadding="8" style="border-collapse:collapse" border="1"><tr><th>Time</th><th>Type</th><th>To</th><th>Subject</th></tr>${rows || '<tr><td colspan="4">No emails yet</td></tr>'}</table></body>`);
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  res.setHeader("Cache-Control", "no-store, must-revalidate");
  console.log(`${req.method} ${url.pathname}`);
  if (url.pathname.startsWith("/api/")) return runApi(url.pathname.slice(5).replace(/\/$/, ""), req, res, url);
  if (url.pathname === "/__outbox") return outboxIndex(res);
  let file = url.pathname.startsWith("/__outbox/") ? path.join(OUTBOX, path.basename(url.pathname)) : path.join(ROOT, decodeURIComponent(url.pathname));
  if (!file.startsWith(ROOT)) { res.statusCode = 403; return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file) || file.includes(`${path.sep}.git`)) { res.statusCode = 404; return res.end("Not found"); }
  res.setHeader("Content-Type", TYPES[path.extname(file)] || "application/octet-stream");
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Stratum dev server: http://localhost:${PORT}  (outbox: /__outbox)`));
