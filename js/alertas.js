/* Alertas PR — FDA food recalls from /api/recalls, plus three things that make it personal:
   "Revisa tu lista" (the visitor's own products checked against the recalls), a pulse of the
   year in numbers, and plain-language "what it means / what to do" on every card.
   The FDA's own text is in English, so the most common reasons get a short Spanish/English
   summary and the original stays below. The visitor's list never leaves the browser; it is
   remembered across visits only with "preferences" consent (keys listed on cookies.html). */
(() => {
  const PAGE = 15;
  const LIST_KEY = "alertas-list";
  const SEEN_KEY = "alertas-seen";
  const T = {
    es: {
      tagPR: "Menciona a Puerto Rico", tagNat: "Distribución nacional",
      loading: "Cargando retiros de la FDA…", fail: "No pudimos cargar los retiros. Inténtalo otra vez en unos minutos.",
      none: "No hay retiros que coincidan con tu búsqueda.",
      shown: (a, b, d) => `Mostrando ${a} de ${b}${d ? ` · Datos de la FDA al ${d}` : ""}`,
      onlyMine: "Mostrando solo los retiros que coinciden con tu lista.", seeAll: "Ver todos",
      sev: { 1: "Grave · Clase I", 2: "Moderado · Clase II", 3: "Leve · Clase III", 0: "Sin clasificar" }, pha: "Alerta de salud pública",
      more: "Ver más", orig: "Texto original de la FDA:", origUsda: "Texto original del USDA:", products: (n) => `y ${n} ${n === 1 ? "producto más" : "productos más"}`, allProds: (n) => `Ver los ${n} productos de este retiro`, sevHelp: "Qué significa", upc: "UPC", hitTag: "En tu lista",
      notice: (num) => `Buscar el aviso en la FDA (${num})`, usdaNotice: "Ver el aviso del USDA", share: "Compartir", copied: "Enlace copiado",
      shareText: (x) => `Retiro de alimentos: ${x}. Revisa si te afecta en Alertas PR por StratumScan:`,
      allergen: "Alérgeno no declarado", micro: { listeria: "Posible Listeria", salmonella: "Posible Salmonella", ecoli: "Posible E. coli", botulism: "Riesgo de botulismo", mold: "Moho", cronobacter: "Posible Cronobacter" },
      foreign: "Objeto extraño", glass: "vidrio", plastic: "plástico", metal: "metal", stones: "piedras",
      cgmp: "Fallas en buenas prácticas de manufactura", colors: "Colorantes no declarados", drug: "Contiene medicamentos no declarados", leadMetal: "Plomo",
      allergens: { milk: "leche", soy: "soya", wheat: "trigo", egg: "huevo", peanut: "maní", "tree nut": "nueces", walnut: "nueces", almond: "almendra", cashew: "cajuil", hazelnut: "avellana", pistachio: "pistacho", pecan: "pecana", sesame: "ajonjolí", fish: "pescado", shellfish: "mariscos", shrimp: "camarón", coconut: "coco" },
      // Check your list
      suggest: ["Leche", "Queso", "Maní", "Huevo", "Pollo", "Camarones", "Arándanos", "Harina", "Chocolate", "Especias"],
      remove: (x) => `Quitar ${x}`, emptyList: "Añade al menos un producto para revisar.",
      scanning: "Revisando tu lista…",
      clearT: "¡Todo bien!", clearB: (n, area) => `Ninguno de tus ${n} ${n === 1 ? "producto aparece" : "productos aparece"} en los retiros ${area} de los últimos 12 meses.`,
      areaAll: "que llegan a Puerto Rico (incluye los de distribución nacional)",
      hitT: (h, n) => `${h} de tus ${n} ${n === 1 ? "producto aparece" : "productos aparecen"} en retiros`,
      hitB: (e) => `Encontramos ${e} ${e === 1 ? "retiro relacionado" : "retiros relacionados"}. Revisa cada aviso: la coincidencia es por palabras y puede no ser tu mismo producto.`,
      seeMine: "Ver solo mis coincidencias", keep: "Guardamos tu lista en este navegador para tu próxima visita.",
      keepOff: "Para recordar tu lista en tu próxima visita, acepta las cookies de preferencias.",
      newSince: (n) => `${n} ${n === 1 ? "aviso nuevo" : "avisos nuevos"} desde tu última visita`,
      isNew: "Nuevo", inList: "En tu lista:",
      // Pulse
      pTotal: "retiros en el último año", pSerious: "graves (Clase I)", pSince: "días desde el último Clase I", pNone: "sin Clase I este año",
      pMonths: "Retiros por mes", pCauses: "Por qué se retiraron", pMonthTip: (m, n) => `${m}: ${n} ${n === 1 ? "retiro" : "retiros"}`,
      cause: { micro: "Bacterias u hongos", allergen: "Alérgenos", foreign: "Objetos extraños", other: "Otras causas" },
      // Guidance
      guideSum: "Qué significa y qué hacer", gYou: "Si lo tienes en casa", gBiz: "Si tienes un negocio",
      cls: { 1: "Clase I: la FDA considera que puede causar problemas serios de salud o la muerte.", 2: "Clase II: puede causar problemas de salud temporales o reversibles.", 3: "Clase III: es poco probable que cause problemas de salud.", 0: "La FDA aún no lo ha clasificado." },
      g: {
        micro: ["El producto podría tener bacterias u hongos que causan enfermedad.", "No lo consumas. Devuélvelo a la tienda o deséchalo, y limpia las superficies que tocó. Si tienes síntomas, consulta a tu médico.", "Verifica si recibiste ese lote, sepáralo en retención y documenta la acción y su disposición."],
        allergen: ["La etiqueta no declara un alérgeno que el producto contiene.", "Si tú o alguien en tu casa es alérgico a ese ingrediente, no lo consumas. Si no hay alergia, el riesgo es bajo.", "Revisa si lo usas como ingrediente y si la etiqueta de tus productos debe declararlo."],
        foreign: ["Podría tener pedazos de un material que no debe estar en el alimento.", "No lo consumas. Devuélvelo a la tienda o deséchalo.", "Revisa el lote recibido y si tu proceso tiene controles para detectarlo, como un detector de metales."],
        other: ["La FDA lo retiró por otra causa. Lee el texto original del aviso.", "Sigue las instrucciones de la empresa o de la FDA en el aviso.", "Verifica si lo recibiste y documenta tu revisión."],
      },
    },
    en: {
      tagPR: "Names Puerto Rico", tagNat: "Nationwide distribution",
      loading: "Loading FDA recalls…", fail: "We couldn't load the recalls. Try again in a few minutes.",
      none: "No recalls match your search.",
      shown: (a, b, d) => `Showing ${a} of ${b}${d ? ` · FDA data as of ${d}` : ""}`,
      onlyMine: "Showing only the recalls that match your list.", seeAll: "Show all",
      sev: { 1: "Serious · Class I", 2: "Moderate · Class II", 3: "Minor · Class III", 0: "Unclassified" }, pha: "Public health alert",
      more: "Show more", orig: "Original FDA text:", origUsda: "Original USDA text:", products: (n) => `and ${n} more ${n === 1 ? "product" : "products"}`, allProds: (n) => `See all ${n} products in this recall`, sevHelp: "What it means", upc: "UPC", hitTag: "On your list",
      notice: (num) => `Look up the notice at the FDA (${num})`, usdaNotice: "See the USDA notice", share: "Share", copied: "Link copied",
      shareText: (x) => `Food recall: ${x}. Check whether it affects you on Alertas PR by StratumScan:`,
      allergen: "Undeclared allergen", micro: { listeria: "Possible Listeria", salmonella: "Possible Salmonella", ecoli: "Possible E. coli", botulism: "Botulism risk", mold: "Mold", cronobacter: "Possible Cronobacter" },
      foreign: "Foreign object", glass: "glass", plastic: "plastic", metal: "metal", stones: "stones",
      cgmp: "Good manufacturing practice failures", colors: "Undeclared colors", drug: "Contains undeclared drugs", leadMetal: "Lead",
      allergens: null,
      suggest: ["Milk", "Cheese", "Peanuts", "Eggs", "Chicken", "Shrimp", "Blueberries", "Flour", "Chocolate", "Spices"],
      remove: (x) => `Remove ${x}`, emptyList: "Add at least one product to check.",
      scanning: "Checking your list…",
      clearT: "All clear!", clearB: (n, area) => `None of your ${n} ${n === 1 ? "product shows" : "products show"} up in the last 12 months of ${area} recalls.`,
      areaAll: "Puerto Rico (nationwide ones included)",
      hitT: (h, n) => `${h} of your ${n} ${n === 1 ? "product shows" : "products show"} up in recalls`,
      hitB: (e) => `We found ${e} related ${e === 1 ? "recall" : "recalls"}. Check each notice: matching is by words and may not be your exact product.`,
      seeMine: "Show only my matches", keep: "We saved your list in this browser for your next visit.",
      keepOff: "To remember your list on your next visit, allow preference cookies.",
      newSince: (n) => `${n} new ${n === 1 ? "alert" : "alerts"} since your last visit`,
      isNew: "New", inList: "On your list:",
      pTotal: "recalls in the last year", pSerious: "serious (Class I)", pSince: "days since the last Class I", pNone: "no Class I this year",
      pMonths: "Recalls per month", pCauses: "Why they were recalled", pMonthTip: (m, n) => `${m}: ${n} ${n === 1 ? "recall" : "recalls"}`,
      cause: { micro: "Bacteria or mold", allergen: "Allergens", foreign: "Foreign objects", other: "Other causes" },
      guideSum: "What it means and what to do", gYou: "If you have it at home", gBiz: "If you run a business",
      cls: { 1: "Class I: the FDA considers it could cause serious health problems or death.", 2: "Class II: it may cause temporary or reversible health problems.", 3: "Class III: it is unlikely to cause health problems.", 0: "The FDA hasn't classified it yet." },
      g: {
        micro: ["The product may carry bacteria or mold that cause illness.", "Don't eat it. Return it to the store or throw it away, and clean surfaces it touched. If you have symptoms, see your doctor.", "Check whether you received that lot, put it on hold and document the action and its disposition."],
        allergen: ["The label doesn't declare an allergen the product contains.", "If you or someone at home is allergic to that ingredient, don't eat it. Without an allergy, the risk is low.", "Check whether you use it as an ingredient and whether your own labels must declare it."],
        foreign: ["It may contain pieces of a material that shouldn't be in food.", "Don't eat it. Return it to the store or throw it away.", "Check the lot you received and whether your process has controls to catch it, such as a metal detector."],
        other: ["The FDA recalled it for another reason. Read the original notice text.", "Follow the company's or the FDA's instructions in the notice.", "Check whether you received it and document your review."],
      },
    },
  };
  const FDA_SEARCH = "https://www.accessdata.fda.gov/scripts/ires/index.cfm";
  const MICRO = [["listeria", /listeria/i], ["salmonella", /salmonella/i], ["ecoli", /e\.?\s?coli|stec/i], ["botulism", /botulin|clostridium/i], ["cronobacter", /cronobacter/i], ["mold", /\bmou?ld/i]];
  const ALLERGENS = ["milk", "soy", "wheat", "egg", "peanut", "tree nut", "walnut", "almond", "cashew", "hazelnut", "pistachio", "pecan", "sesame", "shellfish", "shrimp", "fish", "coconut"];

  // Spanish (and English) words → stems found in the FDA's English text. Keys are accent-free,
  // singular. Anything not listed is matched as typed (brands, firms, products).
  const SYN = {
    leche: "milk|dairy", queso: "cheese", mantequilla: "butter", yogur: "yogurt|yoghurt", yogurt: "yogurt|yoghurt", helado: "ice cream",
    huevo: "egg", mani: "peanut", cacahuate: "peanut", nuez: "tree nut|walnut|pecan|almond|cashew|hazelnut|pistachio", nuece: "tree nut|walnut|pecan|almond|cashew|hazelnut|pistachio",
    almendra: "almond", ajonjoli: "sesame", sesamo: "sesame", soya: "soy", trigo: "wheat", harina: "flour", pan: "bread|bun\\b|rolls?\\b",
    galleta: "cookie|cracker|biscuit", arroz: "rice", pasta: "pasta|noodle", chocolate: "chocolate|cocoa", cafe: "coffee", jugo: "juice",
    pollo: "chicken|poultry", res: "beef", carne: "meat|beef|pork", cerdo: "pork", jamon: "ham\\b", salchicha: "sausage|hot dog|frank",
    pescado: "fish", atun: "tuna", salmon: "salmon", camaron: "shrimp|prawn", marisco: "shellfish|seafood",
    arandano: "blueberr", fresa: "strawberr", mango: "mango", pina: "pineapple", melon: "melon|cantaloupe", lechuga: "lettuce",
    espinaca: "spinach", tomate: "tomato", cebolla: "onion", pepino: "cucumber", aguacate: "avocado", especia: "spice|seasoning",
    canela: "cinnamon", pimienta: "pepper", ajo: "garlic", coco: "coconut", azucar: "sugar", miel: "honey", avena: "oat",
    maiz: "corn\\b|maize", habichuela: "bean", frijol: "bean", brocoli: "broccoli", zanahoria: "carrot", uva: "grape", manzana: "apple",
    naranja: "orange", limon: "lemon|lime\\b", refresco: "soda|soft drink", bebida: "beverage|drink", suplemento: "supplement",
    papa: "potato", aceite: "\\boil\\b", dulce: "candy|confection", cereal: "cereal|granola", ensalada: "salad", sopa: "soup",
    peanut: "peanut", milk: "milk|dairy", egg: "egg", shrimp: "shrimp|prawn", blueberrie: "blueberr", spice: "spice|seasoning",
  };

  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const L = () => (document.documentElement.lang === "en" ? "en" : "es");
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const canKeep = () => !!window.StratumConsent?.allows("preferences");

  const state = { scope: "all", filter: "all", shown: PAGE, data: {}, error: false, list: [], checked: false, seenAtLoad: {}, counted: {} };

  // ---- storage (only with "preferences" consent) ---------------------------
  function readJSON(k, fallback) {
    try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v ?? fallback; } catch (e) { return fallback; }
  }
  function saveList() {
    if (!canKeep()) return;
    try { localStorage.setItem(LIST_KEY, JSON.stringify(state.list)); } catch (e) { /* storage blocked */ }
  }
  function markSeen(scope, items) {
    if (!canKeep() || !items.length) return;
    const seen = readJSON(SEEN_KEY, {});
    seen[scope] = items[0].d; // items are newest first
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch (e) { /* ignore */ }
  }
  const isNew = (x) => { const s = state.seenAtLoad[state.scope]; return !!s && x.d > s; };

  // ---- classification ------------------------------------------------------
  function kinds(x) {
    const r = x.src === "usda" ? `${x.reason} ${x.product}` : x.reason; // FSIS names the hazard in the title
    return {
      allergen: /undeclared|allergen|not declare/i.test(r) && !/sildenafil|tadalafil|drug|color|red\s?\d|yellow\s?\d|sulfite/i.test(r),
      micro: MICRO.some(([, re]) => re.test(r)) || /pathogen|bacteri/i.test(r),
      foreign: /foreign|glass|plastic|metal|stone|rubber/i.test(r),
    };
  }
  /** One main type per recall, for its icon, guidance and the causes chart. */
  function mainType(x) {
    const k = kinds(x);
    return k.micro ? "micro" : k.allergen ? "allergen" : k.foreign ? "foreign" : "other";
  }

  /** Short summary of the FDA reason in the page language, or "" when no rule fits. */
  function summary(x, t) {
    const r = x.src === "usda" ? `${x.reason} ${x.product}` : x.reason; // FSIS names the hazard in the title
    const bugs = MICRO.filter(([, re]) => re.test(r)).map(([k]) => t.micro[k]);
    if (bugs.length) return bugs.join(" · ");
    if (/sildenafil|tadalafil|undeclared drug/i.test(r)) return t.drug;
    const k = kinds(x);
    if (k.allergen) {
      const found = ALLERGENS.filter((a) => new RegExp(`\\b${a}s?\\b`, "i").test(r));
      const names = [...new Set(found.map((a) => (t.allergens ? t.allergens[a] : a)))];
      return names.length ? `${t.allergen}: ${names.join(", ")}` : t.allergen;
    }
    if (k.foreign) {
      const what = ["glass", "plastic", "metal", "stones"].filter((w) => new RegExp(w.replace(/s$/, ""), "i").test(r)).map((w) => t[w]);
      return what.length ? `${t.foreign}: ${what.join(", ")}` : t.foreign;
    }
    if (/cgmp|good manufacturing/i.test(r)) return t.cgmp;
    if (/undeclared\s+(?:fd&c\s+)?colou?rs?|fd&c\s+(?:yellow|red|blue)/i.test(r)) return t.colors;
    if (/\blead\b/i.test(r)) return t.leadMetal;
    return "";
  }

  // ---- the visitor's list --------------------------------------------------
  const reCache = new Map();
  function termRe(term) {
    if (reCache.has(term)) return reCache.get(term);
    const n = norm(term);
    const stem = [n, n.replace(/es$/, ""), n.replace(/s$/, "")].map((k) => SYN[k]).find(Boolean);
    const literal = n.replace(/ies$/, "y").replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+")
      .replace(/([^aeiou])y$/, "$1(?:y|ies)"); // blueberry ↔ blueberries
    // short words ("res", "pan") must match whole words, or they'd hit "residue", "panel"…
    const re = new RegExp(`\\b(?:${stem ? stem + "|" : ""}${literal}${n.length < 4 ? "\\b" : ""})`, "i");
    reCache.set(term, re);
    return re;
  }
  const haystack = (x) => norm(`${x.product} ${x.es || ""} ${x.firm} ${x.reason} ${x.txt || ""} ${(x.prods || []).join(" ")} ${(x.prods_es || []).join(" ")}`);
  const hitsFor = (x) => state.list.filter((term) => termRe(term).test(haystack(x)));

  function addTerm(raw) {
    const term = raw.replace(/\s+/g, " ").trim().slice(0, 40);
    if (!term || state.list.some((x) => norm(x) === norm(term)) || state.list.length >= 20) return false;
    state.list.push(term);
    state.checked = false;
    saveList();
    return true;
  }

  function renderMine() {
    const t = T[L()], d = state.data[state.scope];
    const mine = $("#a-mine");
    mine.innerHTML = state.list.map((term, i) => {
      const n = state.checked && d ? d.items.filter((x) => termRe(term).test(haystack(x))).length : null;
      const cls = n === null ? "" : n ? " is-hit" : " is-clear";
      return `<li class="a-chip${cls}" style="--i:${i}"><span>${esc(term)}</span>${n ? `<b>${n}</b>` : n === 0 ? '<i aria-hidden="true"></i>' : ""}<button type="button" data-remove="${i}" aria-label="${esc(t.remove(term))}">×</button></li>`;
    }).join("");
    const lower = state.list.map(norm);
    $("#a-suggest").innerHTML = t.suggest.filter((s) => !lower.includes(norm(s))).slice(0, 8)
      .map((s) => `<button type="button" data-suggest="${esc(s)}">+ ${esc(s)}</button>`).join("");
    if (!state.list.length) state.filter = "all";
  }

  function renderResult() {
    const l = L(), t = T[l], d = state.data[state.scope], box = $("#a-result");
    if (!state.checked || !d) { box.innerHTML = ""; box.className = "a-result"; return; }
    const hitTerms = state.list.filter((term) => d.items.some((x) => termRe(term).test(haystack(x))));
    const events = d.items.filter((x) => hitsFor(x).length).length;
    const keep = `<p class="a-keep">${esc(canKeep() ? t.keep : t.keepOff)}</p>`;
    if (!hitTerms.length) {
      box.className = "a-result is-clear";
      box.innerHTML = `<span class="a-badge" aria-hidden="true"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="23"/><path d="M15 27l7 7 15-16"/></svg></span>
        <div><p class="a-result-t">${esc(t.clearT)}</p><p>${esc(t.clearB(state.list.length, t.areaAll))}</p>${keep}</div>`;
    } else {
      box.className = "a-result is-hit";
      box.innerHTML = `<span class="a-badge" aria-hidden="true"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="23"/><path d="M26 14v15M26 37h.01"/></svg></span>
        <div><p class="a-result-t">${esc(t.hitT(hitTerms.length, state.list.length))}</p><p>${esc(t.hitB(events))}</p>
        <button type="button" class="btn btn-yellow" data-see-mine>${esc(t.seeMine)}</button>${keep}</div>`;
    }
  }

  async function runCheck() {
    const t = T[L()], box = $("#a-check");
    if (!state.list.length) { $("#a-result").className = "a-result"; $("#a-result").innerHTML = `<p>${esc(t.emptyList)}</p>`; $("#a-term").focus(); return; }
    state.checked = false; renderMine(); renderResult();
    if (!REDUCED) {
      $("#a-result").innerHTML = `<p class="a-scanning">${esc(t.scanning)}</p>`;
      box.classList.remove("is-scanning"); void box.offsetWidth; box.classList.add("is-scanning");
      await new Promise((r) => setTimeout(r, 1300 + state.list.length * 90));
      box.classList.remove("is-scanning");
    }
    state.checked = true;
    render(); // redraws the chips, the result and the cards' "En tu lista" tags
  }

  // ---- pulse ---------------------------------------------------------------
  const ymdDate = (s) => new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T12:00:00`);
  function renderPulse() {
    const l = L(), t = T[l], d = state.data[state.scope], el = $("#a-pulse");
    if (!d || state.error) { el.innerHTML = ""; return; }
    const items = d.items;
    const serious = items.filter((x) => x.cls === 1);
    const lastI = serious[0] ? Math.max(0, Math.floor((Date.now() - ymdDate(serious[0].d)) / 864e5)) : null;
    // last 12 months, oldest first
    const now = new Date(), months = [];
    for (let i = 11; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${m.getFullYear()}${String(m.getMonth() + 1).padStart(2, "0")}`, date: m, n: 0 });
    }
    items.forEach((x) => { const b = months.find((m) => m.key === x.d.slice(0, 6)); if (b) b.n += 1; });
    const max = Math.max(1, ...months.map((m) => m.n));
    const loc = l === "en" ? "en-US" : "es-PR";
    const causes = { micro: 0, allergen: 0, foreign: 0, other: 0 };
    items.forEach((x) => { causes[mainType(x)] += 1; });
    const total = Math.max(1, items.length);

    el.innerHTML = `
      <div class="a-stats">
        <div class="a-stat"><b data-count="${items.length}">${items.length}</b><span>${esc(t.pTotal)}</span></div>
        <div class="a-stat a-stat-bad"><b data-count="${serious.length}">${serious.length}</b><span>${esc(t.pSerious)}</span></div>
        <div class="a-stat">${lastI === null ? `<b>—</b><span>${esc(t.pNone)}</span>` : `<b data-count="${lastI}">${lastI}</b><span>${esc(t.pSince)}</span>`}</div>
      </div>
      <figure class="a-chart">
        <figcaption>${esc(t.pMonths)}</figcaption>
        <div class="a-bars">${months.map((m, i) => {
          const name = m.date.toLocaleDateString(loc, { month: "short", year: "numeric" });
          return `<span class="a-bar${i === 11 ? " is-now" : ""}" tabindex="0" style="--h:${(m.n / max) * 100}%;--i:${i}" data-tip="${esc(t.pMonthTip(name, m.n))}" aria-label="${esc(t.pMonthTip(name, m.n))}"><i></i><small>${esc(m.date.toLocaleDateString(loc, { month: "narrow" }))}</small></span>`;
        }).join("")}</div>
      </figure>
      <figure class="a-chart">
        <figcaption>${esc(t.pCauses)}</figcaption>
        <ul class="a-causes">${Object.entries(causes).sort((a, b) => b[1] - a[1]).map(([k, n], i) => `
          <li style="--w:${(n / total) * 100}%;--i:${i}" tabindex="0" data-tip="${esc(`${t.cause[k]}: ${n}`)}"><span>${esc(t.cause[k])}</span><b>${Math.round((n / total) * 100)}%</b><i></i></li>`).join("")}
        </ul>
      </figure>`;
    el.classList.remove("is-in"); void el.offsetWidth; el.classList.add("is-in");
    // numbers count up the first time each area is shown
    if (!REDUCED && !state.counted[state.scope]) {
      state.counted[state.scope] = true;
      el.querySelectorAll("[data-count]").forEach((b) => {
        const to = +b.dataset.count, t0 = performance.now();
        const step = (now) => { const p = Math.min(1, (now - t0) / 1100); b.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      });
    }
  }

  // ---- list ----------------------------------------------------------------
  const ICONS = {
    micro: '<circle cx="12" cy="12" r="5"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
    allergen: '<path d="M12 3c3 3 5 6 5 9a5 5 0 0 1-10 0c0-3 2-6 5-9z"/><path d="M12 21v-6"/>',
    foreign: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
    other: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>',
  };
  const title = (p) => (p.length > 110 ? p.slice(0, 110).replace(/[\s,;.:]+\S*$/, "") + "…" : p);
  const fmtDate = (s, l) => {
    if (!s) return "";
    const d = /^\d{8}$/.test(s) ? ymdDate(s) : new Date(`${s}T12:00:00`);
    return d.toLocaleDateString(l === "en" ? "en-US" : "es-PR", { day: "numeric", month: "short", year: "numeric" });
  };

  async function fetchScope(scope) {
    const r = await fetch(`/api/recalls?scope=${scope}`, { headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const d = await r.json();
    if (!d.ok) throw new Error(d.error || "error");
    return d;
  }
  /** "pr" = recalls whose distribution names Puerto Rico. "all" = those plus nationwide recalls,
      which reach Puerto Rico too; each item keeps pr: true when it names PR. */
  async function load(scope) {
    if (state.data[scope]) return state.data[scope];
    if (scope === "pr") return (state.data.pr = await fetchScope("pr"));
    const [pr, nat] = await Promise.all([load("pr"), fetchScope("nat")]);
    // an event can be in both lists; keep the nationwide copy (it has every product) and flag it
    const key = (x) => x.ev || `${x.num}`;
    const named = new Set(pr.items.map(key));
    const fromNat = new Set(nat.items.map(key));
    const items = nat.items.map((x) => (named.has(key(x)) ? { ...x, pr: true } : x))
      .concat(pr.items.filter((x) => !fromNat.has(key(x))).map((x) => ({ ...x, pr: true })))
      .sort((a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : 0));
    return (state.data.all = { ok: true, updated: pr.updated || nat.updated, items });
  }

  function render() {
    const l = L(), t = T[l];
    const list = $("#a-list"), status = $("#a-status");
    const d = state.data[state.scope];
    renderMine(); renderResult();
    if (state.error) { status.textContent = t.fail; list.innerHTML = ""; renderPulse(); return; }
    if (!d) { status.textContent = t.loading; return; }

    const fresh = d.items.filter(isNew).length;
    const nb = $("#a-new");
    nb.hidden = !fresh; nb.textContent = fresh ? t.newSince(fresh) : "";

    // the whole year: recalls that name Puerto Rico plus nationwide ones ("Ver solo mis coincidencias" narrows it)
    const mine = state.filter === "mine";
    const items = mine ? d.items.filter((x) => hitsFor(x).length) : d.items;
    const shown = items.slice(0, state.shown);
    status.textContent = items.length ? t.shown(shown.length, items.length, fmtDate(d.updated, l)) : t.none;

    list.innerHTML = (mine ? `<p class="a-only-mine">${esc(t.onlyMine)} <button type="button" data-all>${esc(t.seeAll)}</button></p>` : "") + shown.map((x, i) => {
      const s = summary(x, t), type = mainType(x), hits = hitsFor(x), g = t.g[type];
      return `<article class="a-item a-cls-${x.cls}${hits.length ? " is-mine" : ""}">
        <span class="a-ico a-ico-${type}" aria-hidden="true"><svg viewBox="0 0 24 24">${ICONS[type]}</svg></span>
        <div class="a-body">
          <div class="a-meta"><button type="button" class="a-sev a-sev-${x.cls} a-sev-btn" data-explain title="${esc(t.sevHelp)}">${esc(x.pha ? t.pha : t.sev[x.cls])}<i aria-hidden="true">?</i></button><span class="a-src">${x.src === "usda" ? "USDA" : "FDA"}</span>${isNew(x) ? `<span class="a-flag">${esc(t.isNew)}</span>` : ""}<span class="a-where${x.pr ? " is-pr" : ""}">${esc(x.pr ? t.tagPR : t.tagNat)}</span><span>${esc(fmtDate(x.d, l))} · ${esc(x.firm)}</span></div>
          <h2>${esc(L() === "es" && x.es ? x.es : x.src === "usda" ? x.product : parseProd(x.product).name)}${x.n > 1 && !(x.prods && x.prods.length > 1) ? ` <span class="a-orig">${esc(t.products(x.n - 1))}</span>` : ""}</h2>
          ${x.prods && x.prods.length > 1 ? prodList(x) : prodDetail(parseProd(x.product), false)}
          ${hits.length ? `<p class="a-hits">${esc(t.inList)} <b>${esc(hits.join(", "))}</b></p>` : ""}
          ${s ? `<p class="a-reason">${esc(s)}</p><p class="a-orig">${esc(x.src === "usda" ? t.origUsda : t.orig)} ${esc(x.reason)}</p>` : `<p class="a-reason">${esc(x.reason)}</p>`}
          <details class="a-guide"><summary>${esc(t.guideSum)}</summary>
            <p>${esc(g[0])} ${esc(t.cls[x.cls])}</p>
            <div class="a-guide-cols"><div><b>${esc(t.gYou)}</b><p>${esc(g[1])}</p></div><div><b>${esc(t.gBiz)}</b><p>${esc(g[2])}</p></div></div>
          </details>
          <div class="a-links"><a href="${esc(x.url || FDA_SEARCH)}" target="_blank" rel="noopener">${esc(x.url ? t.usdaNotice : t.notice(x.num))}</a><button type="button" data-share="${i}">${esc(t.share)}</button></div>
        </div>
      </article>`;
    }).join("") + (items.length > shown.length ? `<button type="button" class="btn btn-soft a-more" data-more>${esc(t.more)}</button>` : "");

    list.onclick = async (e) => {
      if (e.target.closest("[data-more]")) { state.shown += PAGE; render(); return; }
      if (e.target.closest("[data-all]")) { setFilter("all"); render(); return; }
      const ex = e.target.closest("[data-explain]");
      if (ex) { // the severity pill opens this card's "what it means and what to do"
        const g = ex.closest(".a-item").querySelector(".a-guide");
        g.open = true; g.querySelector("summary").focus();
        g.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "nearest" });
        return;
      }
      const b = e.target.closest("[data-share]");
      if (!b) return;
      const x = shown[+b.dataset.share];
      const text = t.shareText(title(x.product)), url = location.origin + location.pathname;
      try {
        if (navigator.share) await navigator.share({ title: "Alertas PR", text, url });
        else { await navigator.clipboard.writeText(`${text} ${url}`); b.textContent = t.copied; }
      } catch (err) { /* share sheet closed */ }
    };
  }

  /** Every product of a multi-product recall; the ones that match the visitor's list are marked,
      and the list opens by itself when a match is hidden past the first product. */
  function prodList(x) {
    if (!x.prods || x.prods.length < 2) return "";
    const es = L() === "es" ? x.prods_es || [] : [];
    const marks = x.prods.map((p, i) => state.list.some((term) => termRe(term).test(norm(`${p} ${es[i] || ""}`))));
    return `<details class="a-prods"${marks.slice(1).some(Boolean) ? " open" : ""}><summary>${esc(T[L()].allProds(Math.max(x.n, x.prods.length)))}</summary>
      <ol>${x.prods.map((p, i) => {
        const pp = parseProd(p);
        return `<li${marks[i] ? ' class="is-hit"' : ""}><b>${esc(es[i] || pp.name)}</b>${prodDetail(pp, marks[i])}</li>`;
      }).join("")}</ol></details>`;
  }

  /** FDA product text → { name, size, upcs, rest }: "Vanilla Econo, Galletas de Vainilla, 8 paquets per
      Net Wt. 9.6 oz box (272 g), 6 box per case. UPC 072981005022" → name "Vanilla Econo, Galletas de
      Vainilla", size "9.6 oz", upcs ["072981005022"], rest = the packaging text in between. */
  function parseProd(p) {
    const upcs = [...p.matchAll(/UPC\s*(?:code|#|:|no\.?)?\s*:?\s*((?:\d[\s-]?){8,14})/gi)].map((m) => m[1].replace(/\D/g, ""));
    const sz = p.match(/Net\s*Wt\.?\s*:?\s*(\d[\d.,\/]*\s*(?:fl\.?\s*)?(?:oz|lbs?|g|kg|ml|l)\b)/i);
    const noUpc = p.replace(/UPC\s*(?:code|#|:|no\.?)?\s*:?\s*(?:\d[\s-]?){8,14}\.?/gi, "").replace(/\s{2,}/g, " ").trim();
    const parts = noUpc.split(/,\s*/);
    let k = 1; // keep leading segments that read like a name (no quantities yet)
    while (k < parts.length && k < 3 && !/\d|net\s*wt|per case|pack|count/i.test(parts[k])) k++;
    let name = parts.slice(0, k).join(", ");
    if (name.length > 90) name = name.slice(0, 90).replace(/[\s,;.:(]+\S*$/, "") + "…";
    const rest = parts.slice(k).join(", ").replace(/[\s,.;]+$/, "");
    return { name: name || p.slice(0, 90), size: sz ? sz[1].replace(/\s+/g, " ") : "", upcs: [...new Set(upcs)], rest };
  }
  function prodDetail(pp, hit) {
    const t = T[L()];
    const tags = (pp.size ? `<span class="a-tag">${esc(pp.size)}</span>` : "")
      + pp.upcs.slice(0, 3).map((u) => `<span class="a-tag a-upc">${esc(t.upc)} ${esc(u)}</span>`).join("")
      + (hit ? `<span class="a-tag a-tag-hit">${esc(t.hitTag)}</span>` : "");
    return (tags ? `<span class="a-tags">${tags}</span>` : "") + (pp.rest ? `<span class="a-rest">${esc(pp.rest)}</span>` : "");
  }

  function setFilter(f) { state.filter = f; state.shown = PAGE; }

  async function show(scope) {
    state.scope = scope; state.shown = PAGE; state.error = false;
    render();
    try { await load(scope); } catch (err) { console.error("[alertas]", err); state.error = true; }
    if (state.scope !== scope) return;
    render(); renderPulse();
    if (state.data[scope]) markSeen(scope, state.data[scope].items);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const saved = canKeep() ? readJSON(LIST_KEY, []) : [];
    state.list = Array.isArray(saved) ? saved.filter((x) => typeof x === "string").slice(0, 20) : [];
    state.seenAtLoad = canKeep() ? readJSON(SEEN_KEY, {}) : {};

    $("#a-add").addEventListener("submit", (e) => {
      e.preventDefault();
      const input = $("#a-term");
      input.value.split(",").forEach(addTerm);
      input.value = "";
      renderMine(); renderResult();
    });
    $("#a-check").addEventListener("click", (e) => {
      const s = e.target.closest("[data-suggest]");
      if (s) { addTerm(s.dataset.suggest); renderMine(); renderResult(); return; }
      const r = e.target.closest("[data-remove]");
      if (r) {
        state.list.splice(+r.dataset.remove, 1); saveList();
        if (!state.list.length) state.checked = false;
        renderMine(); renderResult(); if (state.filter === "mine") render();
        return;
      }
      if (e.target.closest("#a-run")) { runCheck(); return; }
      if (e.target.closest("[data-see-mine]")) {
        setFilter("mine"); render();
        $("#a-browse-title").scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
      }
    });

    // main.js switches <html lang>; redraw everything in the new language
    new MutationObserver(() => { render(); renderPulse(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    show("all").then(() => { if (state.list.length && state.data.all) runCheck(); });
  });
})();
