/* GET /api/recalls?scope=pr|nat — food recalls for Alertas PR (alertas.html).
   Sources (public domain, no key needed):
   - openFDA food enforcement reports. One entry per recall event (the FDA lists each product of an
     event separately).
   - ?scope=ann: the FDA's food safety recall announcements (RSS of fda.gov/safety/recalls-market-
     withdrawals-safety-alerts): the companies' press releases, same day, before the enforcement
     report; nationwide, so they may not have reached Puerto Rico. Last 60 days, cached 1 h.
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
// FDA RSS feeds, tried in order: a food-only feed if it answers, else the all-products recalls feed
// (filtered to food by NON_FOOD). The translation job logs which one worked.
const ANN_RSS = [
  "https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/food-safety-recalls/rss.xml",
  "https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/recalls/rss.xml",
];
const NON_FOOD = /\b(?:tablets?|capsules?|injection|injectable|syringes?|vials?|devices?|catheters?|pumps?|implants?|surgical|ventilators?|monitors?|test kits?|ophthalmic|eye drops?|contact lens|inhalers?|pharmac\w*|prescription|drugs?|ointment|cream|lotion|sunscreen|cosmetics?|shampoo|toothpaste|hand sanitizer|tattoo|vaccines?|insulin|glucose meters?)\b/i;
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
    // "Great Value" on the 7th product is found); codes: its lot numbers and dates (code_info),
    // same order; txt: the distribution, searched only
    const p = clean(x.product_description).slice(0, 240);
    const c = clean(x.code_info).slice(0, 300);
    if (e) {
      e.n += 1;
      if (e.prods.length < PRODS_MAX && !e.prods.includes(p)) { e.prods.push(p); e.codes.push(c); }
      continue;
    }
    byEvent.set(x.event_id, {
      d: x.recall_initiation_date, cls: { "Class I": 1, "Class II": 2, "Class III": 3 }[x.classification] || 0,
      firm: String(x.recalling_firm || "").replace(/\s+/g, " ").trim(), state: x.state || "", status: x.status || "",
      product: String(x.product_description || "").replace(/\s+/g, " ").trim().slice(0, 240),
      reason: String(x.reason_for_recall || "").replace(/\s+/g, " ").trim().slice(0, 300),
      num: x.recall_number, ev: x.event_id, n: 1,
      prods: [p], codes: [c], txt: clean(x.distribution_pattern).slice(0, 400),
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
      status: { "Active Recall": "Ongoing", "Closed Recall": "Completed" }[clean(r.field_recall_type)] || "",
      firm: clean([].concat(r.field_establishment || []).join(", ")), product: title.slice(0, 240), es: esTitle.get(no.toLowerCase()) || "",
      reason: (r.field_recall_reason || []).map(clean).filter(Boolean).join(", "),
      num: no, ev: `fsis-${no}`, n: Math.max(1, items.length), prods: items.slice(0, 40),
      txt: states.join(", ").slice(0, 400),
      url: /^https?:\/\/www\.fsis\.usda\.gov\//.test(r.field_recall_url || "") ? r.field_recall_url.replace(/^http:/, "https:") : "",
    });
  }
  return out;
}

/* ---- FDA recall announcements (RSS) ---- */
let annCache = null;
const unescapeXml = (s) => s.replace(/&(quot|amp|apos|#39|lt|gt|nbsp);/g, (m, k) => ENT[k]);
// RSS text: CDATA or escaped HTML (sometimes escaped twice) → plain text
const xmlText = (s) => fsisText(unescapeXml(String(s || "").replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1")));
// FDA web pages that list recall announcements, read when no RSS feed answers. The first is food only
// ("Recalls (Foods & Dietary Supplements)"); the second lists every product, so NON_FOOD filters it.
const ANN_PAGES = [
  "https://www.fda.gov/food/recalls-outbreaks-emergencies/recalls-foods-dietary-supplements",
  "https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts",
];
const MONTHS = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };
/** The date written closest to an announcement link: <time datetime>, MM/DD/YYYY or "Month D, YYYY". */
function nearDate(html) {
  const found = [];
  for (const m of html.matchAll(/datetime="(\d{4})-(\d{2})-(\d{2})/g)) found.push([m.index, m[1] + m[2] + m[3]]);
  for (const m of html.matchAll(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g)) found.push([m.index, m[3] + m[1].padStart(2, "0") + m[2].padStart(2, "0")]);
  for (const m of html.matchAll(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})\b/gi))
    found.push([m.index, m[3] + String(MONTHS[m[1].toLowerCase()]).padStart(2, "0") + m[2].padStart(2, "0")]);
  return found;
}
/** Announcement links on an FDA HTML page, each with the nearest date in its row (or around it). */
function pageItems(html, base) {
  const out = new Map();
  const re = /<a\b[^>]*href="((?:https:\/\/www\.fda\.gov)?\/safety\/recalls-market-withdrawals-safety-alerts\/[a-z0-9-]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  for (const m of html.matchAll(re)) {
    const url = m[1].startsWith("http") ? m[1] : base + m[1];
    const title = xmlText(m[2]).slice(0, 240);
    if (!title || title.length < 12 || out.has(url)) continue;
    // the row this link sits in (a table row or list item), else a window around it
    const start = Math.max(html.lastIndexOf("<tr", m.index), html.lastIndexOf("<li", m.index), html.lastIndexOf("<article", m.index), m.index - 600);
    const endTr = html.indexOf("</tr>", m.index), endLi = html.indexOf("</li>", m.index);
    const end = Math.min(...[endTr, endLi, m.index + 600].filter((x) => x > m.index));
    const row = html.slice(start, end);
    const dates = nearDate(row);
    const near = dates.sort((x, y) => Math.abs(start + x[0] - m.index) - Math.abs(start + y[0] - m.index))[0];
    out.set(url, { src: "ann", d: near ? near[1] : "", product: title, desc: xmlText(row).replace(title, "").slice(0, 400), url, ev: `ann-${url}` });
  }
  return [...out.values()];
}

async function fetchAnnouncements(log) {
  if (annCache && Date.now() - annCache.at < 3600 * 1000) return annCache.items;
  const from = ymd(new Date(Date.now() - 60 * 864e5));
  const get = (url, accept) => fetch(url, { headers: { Accept: accept }, signal: AbortSignal.timeout(15000) })
    .catch((e) => ({ ok: false, status: e.message }));
  let items = [];
  // 1. RSS feeds
  for (const url of ANN_RSS) {
    const r = await get(url, "application/rss+xml, application/xml");
    if (log) log(`RSS ${r.status} ${url}`);
    if (!r.ok) continue;
    const xml = await r.text(), allProducts = url !== ANN_RSS[0];
    const tag = (block, name) => (block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`)) || [])[1] || "";
    for (const [, block] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
      const when = new Date(xmlText(tag(block, "pubDate")));
      const link = xmlText(tag(block, "link"));
      if (isNaN(when) || !/^https:\/\/www\.fda\.gov\//.test(link)) continue;
      const title = xmlText(tag(block, "title")).slice(0, 240), desc = xmlText(tag(block, "description")).slice(0, 400);
      if (allProducts && NON_FOOD.test(`${title} ${desc}`)) continue;
      items.push({ src: "ann", d: ymd(when), product: title, desc, url: link, ev: `ann-${link}` });
    }
    break;
  }
  // 2. FDA web pages
  if (!items.length) {
    for (const url of ANN_PAGES) {
      const r = await get(url, "text/html");
      if (log) log(`page ${r.status} ${url}`);
      if (!r.ok) continue;
      const html = await r.text();
      let found = pageItems(html, "https://www.fda.gov");
      if (url !== ANN_PAGES[0]) found = found.filter((x) => !NON_FOOD.test(`${x.product} ${x.desc}`));
      if (log) {
        log(`  announcement links: ${found.length}, with a date: ${found.filter((x) => x.d).length}`);
        for (const x of found.slice(0, 5)) log(`  ${x.d || "(no date)"} ${x.product.slice(0, 90)}`);
        const i = html.search(/\/safety\/recalls-market-withdrawals-safety-alerts\/[a-z0-9-]+"/i);
        if (!found.length) log(`  page sample: ${html.length} chars; first recall link at ${i}`);
      }
      if (found.length) { items = found; break; }
    }
  }
  if (!items.length) {
    // fda.gov refuses server requests (404 even for pages that exist in a browser): remember the
    // empty answer for an hour instead of asking again on every visit
    annCache = { at: Date.now(), items: [] };
    throw new Error("no FDA announcements source answered");
  }
  // keep the last 60 days; links without a date stay, after the dated ones (the page lists newest first)
  items = items.filter((x) => !x.d || x.d >= from);
  if (log) log(`announcements kept (last 60 days): ${items.length}`);
  annCache = { at: Date.now(), items: items.sort((a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : 0)).slice(0, 40) };
  return annCache.items;
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
  if (req.query?.scope === "ann") {
    try {
      const items = (await fetchAnnouncements().catch(() => [])).map((x) => ({ ...x, es: ES[x.product] || "" }));
      res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=21600");
      return res.status(200).json({ ok: true, scope: "ann", items });
    } catch (err) {
      console.error("[recalls] announcements", err);
      return res.status(502).json({ ok: false, error: "source" });
    }
  }
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
module.exports.fetchAnnouncements = fetchAnnouncements;
