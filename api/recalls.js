/* GET /api/recalls?scope=pr|nat — food recalls for Alertas PR (alertas.html).
   Sources (public domain, no key needed):
   - openFDA food enforcement reports. One entry per recall event (the FDA lists each product of an
     event separately).
   - USDA FSIS recalls and public health alerts (meat, poultry, egg products). FSIS's bot protection
     may refuse server requests (we never imitate a browser to get around it); then the copy saved by
     hand in data/fsis-recent.json is used (dev/fsis-snapshot.py), and usda says which one: "live",
     "saved" or false.
   Spanish names (FDA products and FSIS titles/products) come from data/names-es.json, kept up to date
   by the translate-names GitHub Action (scripts/translate/).
   "pr" = distribution names Puerto Rico; "nat" = nationwide. Last 12 months. Cached in memory and at
   Vercel's edge for 6 h. fetchScope/toEvents/fsisEvents are also used by scripts/translate/translate-names.mjs. */
const API = "https://api.fda.gov/food/enforcement.json";
const FSIS_API = "https://www.fsis.usda.gov/fsis/api/recall/v/1";
let ES = {};
try { ES = require("../data/names-es.json").names || {}; } catch (err) { /* no translations yet */ }
let FSIS_SAVED = { saved: null, records: [] };
try { FSIS_SAVED = require("../data/fsis-recent.json"); } catch (err) { /* no saved copy */ }
const TTL = 6 * 3600 * 1000;
const cache = new Map();

const ymd = (d) => d.toISOString().slice(0, 10).replace(/-/g, "");
const PR_RE = /puerto\s*rico|\bP\.?R\.?\b/i;

async function fetchScope(scope) {
  const now = new Date();
  const from = new Date(now); from.setFullYear(from.getFullYear() - 1);
  const where = scope === "nat" ? 'distribution_pattern:"nationwide"' : '(distribution_pattern:"puerto rico" distribution_pattern:PR)';
  const search = `${where} AND recall_initiation_date:[${ymd(from)} TO ${ymd(now)}]`;
  // openFDA returns at most 1000 rows per call; page with skip (nationwide can exceed one page).
  let updated = null, results = [];
  for (let skip = 0; skip < 5000; skip += 1000) {
    const url = `${API}?search=${encodeURIComponent(search)}&sort=recall_initiation_date:desc&limit=1000&skip=${skip}`;
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (r.status === 404) break; // openFDA answers 404 when nothing (more) matches
    if (!r.ok) throw new Error(`openFDA ${r.status}`);
    const d = await r.json();
    updated = d.meta?.last_updated || updated;
    results = results.concat(d.results || []);
    if (results.length >= (d.meta?.results?.total || 0) || !(d.results || []).length) break;
  }
  return { updated, results };
}

const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();
const PRODS_MAX = 40;

function toEvents(results, scope) {
  const byEvent = new Map();
  for (const x of results) {
    if (scope === "pr" && !PR_RE.test(x.distribution_pattern || "")) continue; // "PR" can match other abbreviations
    const e = byEvent.get(x.event_id);
    // prods: every product of the event (shown on the card and searched, so a brand such as
    // "Great Value" on the 7th product is found); txt: the distribution, searched only
    const p = clean(x.product_description).slice(0, 240);
    if (e) {
      e.n += 1;
      if (e.prods.length < PRODS_MAX && !e.prods.includes(p)) e.prods.push(p);
      continue;
    }
    byEvent.set(x.event_id, {
      d: x.recall_initiation_date, cls: { "Class I": 1, "Class II": 2, "Class III": 3 }[x.classification] || 0,
      firm: String(x.recalling_firm || "").replace(/\s+/g, " ").trim(), state: x.state || "", status: x.status || "",
      product: String(x.product_description || "").replace(/\s+/g, " ").trim().slice(0, 240),
      reason: String(x.reason_for_recall || "").replace(/\s+/g, " ").trim().slice(0, 300),
      num: x.recall_number, ev: x.event_id, n: 1,
      prods: [p], txt: clean(x.distribution_pattern).slice(0, 400),
    });
  }
  return [...byEvent.values()].sort((a, b) => (a.d < b.d ? 1 : -1));
}

/* ---- USDA FSIS ---- */
let fsisCache = null; // { at, recs } shared by both scopes
async function fetchFsis() {
  if (fsisCache && Date.now() - fsisCache.at < TTL) return fsisCache.recs;
  const r = await fetch(FSIS_API, {
    headers: { Accept: "application/json", "User-Agent": "AlertasPR/1.0 (+https://mvp.stratumpr.com; contact@stratumpr.com)" },
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw new Error(`FSIS ${r.status}`);
  const recs = await r.json();
  if (!Array.isArray(recs)) throw new Error("FSIS answer is not a list");
  fsisCache = { at: Date.now(), recs };
  return recs;
}

const FSIS_CLS = { "Class I": 1, "Class II": 2, "Class III": 3 };
const ENT = { quot: '"', amp: "&", apos: "'", "#39": "'", lt: "<", gt: ">", nbsp: " " };
const fsisText = (s) => clean(String(s || "").replace(/<[^>]+>/g, " ").replace(/&(quot|amp|apos|#39|lt|gt|nbsp);/g, (m, k) => ENT[k]));
/** FSIS notices of the last 12 months that name Puerto Rico ("pr") or are nationwide ("nat"), in the
    same shape as the FDA events; the Spanish record of each notice gives es (its title). */
function fsisEvents(recs, scope) {
  const from = ymd(new Date(Date.now() - 365 * 864e5));
  const isEs = (r) => /^span/i.test(r.langcode || "");
  const esTitle = new Map(recs.filter(isEs).map((r) => [clean(r.field_recall_number).toLowerCase(), fsisText(r.field_title)]));
  const out = [];
  for (const r of recs) {
    if (isEs(r)) continue;
    const d = String(r.field_recall_date || "").slice(0, 10).replace(/-/g, "");
    if (!/^\d{8}$/.test(d) || d < from) continue;
    const title = fsisText(r.field_title);
    if (/^fsis retracts\b/i.test(title)) continue;
    const states = (r.field_states || []).map(clean);
    const pr = states.some((x) => /puerto\s*rico/i.test(x));
    const nat = states.some((x) => /nationwide/i.test(x));
    if (scope === "pr" ? !pr : !nat) continue;
    const no = clean(r.field_recall_number);
    const items = (r.field_product_items || []).map((x) => fsisText(x).slice(0, 240)).filter(Boolean);
    out.push({
      src: "usda", d, cls: FSIS_CLS[clean(r.field_recall_classification)] || 0,
      pha: clean(r.field_recall_type) === "Public Health Alert",
      firm: clean([].concat(r.field_establishment || []).join(", ")), product: title.slice(0, 240), es: esTitle.get(no.toLowerCase()) || "",
      reason: (r.field_recall_reason || []).map(clean).filter(Boolean).join(", "),
      num: no, ev: `fsis-${no}`, n: Math.max(1, items.length), prods: items.slice(0, 40),
      txt: states.join(", ").slice(0, 400),
      url: /^https?:\/\/www\.fsis\.usda\.gov\//.test(r.field_recall_url || "") ? r.field_recall_url.replace(/^http:/, "https:") : "",
    });
  }
  return out;
}

/** Spanish names (data/names-es.json): es = the event's main product or title, prods_es = per product. */
function addSpanish(items) {
  for (const x of items) {
    x.src = x.src || "fda";
    x.es = x.es || ES[x.product] || "";
    if (x.prods.some((p) => ES[p])) x.prods_es = x.prods.map((p) => ES[p] || "");
  }
  return items;
}

module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "method" });
  const scope = req.query?.scope === "nat" ? "nat" : "pr";
  try {
    let hit = cache.get(scope);
    if (!hit || Date.now() - hit.at > TTL) {
      const [fda, fsis] = await Promise.allSettled([fetchScope(scope), fetchFsis()]);
      if (fda.status === "rejected") throw fda.reason; // the FDA is required; FSIS is a bonus
      if (fsis.status === "rejected") console.warn("[recalls] FSIS unavailable:", fsis.reason?.message);
      const live = fsis.status === "fulfilled";
      const usda = fsisEvents(live ? fsis.value : FSIS_SAVED.records || [], scope);
      const items = addSpanish(toEvents(fda.value.results, scope).concat(usda)).sort((a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : 0));
      hit = { at: Date.now(), body: { ok: true, scope, updated: fda.value.updated,
        usda: live ? "live" : usda.length || (FSIS_SAVED.records || []).length ? "saved" : false, usdaSaved: live ? null : FSIS_SAVED.saved, items } };
      cache.set(scope, hit);
    }
    res.setHeader("Cache-Control", "public, s-maxage=21600, stale-while-revalidate=86400");
    return res.status(200).json(hit.body);
  } catch (err) {
    console.error("[recalls]", err);
    const stale = cache.get(scope);
    if (stale) return res.status(200).json(stale.body);
    return res.status(502).json({ ok: false, error: "source" });
  }
};
module.exports.fetchScope = fetchScope;
module.exports.toEvents = toEvents;
module.exports.fsisEvents = fsisEvents;
