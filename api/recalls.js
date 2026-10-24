/* GET /api/recalls?scope=pr|nat — food recalls for Alertas PR (alertas.html).
   Source: openFDA food enforcement reports (public domain, no key needed). One entry per recall
   event (the FDA lists each product of an event separately). "pr" = distribution names Puerto Rico;
   "nat" = nationwide distribution. Last 12 months. Cached in memory and at Vercel's edge for 6 h. */
const API = "https://api.fda.gov/food/enforcement.json";
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

module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "method" });
  const scope = req.query?.scope === "nat" ? "nat" : "pr";
  try {
    let hit = cache.get(scope);
    if (!hit || Date.now() - hit.at > TTL) {
      const { updated, results } = await fetchScope(scope);
      hit = { at: Date.now(), body: { ok: true, scope, updated, items: toEvents(results, scope) } };
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
