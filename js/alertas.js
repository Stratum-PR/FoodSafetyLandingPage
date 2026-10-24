/* Alertas PR — list of FDA food recalls from /api/recalls. The FDA's own text is in English,
   so the most common reasons get a short Spanish/English summary and the original stays below. */
(() => {
  const PAGE = 15;
  const T = {
    es: {
      lead: (n) => `Gratis, de la FDA. ${n} ${n === 1 ? "retiro mencionó" : "retiros mencionaron"} a Puerto Rico en el último año.`,
      leadNat: (n) => `Gratis, de la FDA. ${n} ${n === 1 ? "retiro" : "retiros"} con distribución nacional en el último año.`,
      loading: "Cargando retiros de la FDA…", fail: "No pudimos cargar los retiros. Inténtalo otra vez en unos minutos.",
      none: "No hay retiros que coincidan con tu búsqueda.",
      shown: (a, b, d) => `Mostrando ${a} de ${b}${d ? ` · Datos de la FDA al ${d}` : ""}`,
      sev: { 1: "Grave · Clase I", 2: "Moderado · Clase II", 3: "Leve · Clase III", 0: "Sin clasificar" },
      more: "Ver más", orig: "Texto original de la FDA:", products: (n) => `y ${n} ${n === 1 ? "producto más" : "productos más"}`,
      notice: (num) => `Buscar el aviso en la FDA (${num})`, share: "Compartir", copied: "Enlace copiado",
      shareText: (x) => `Retiro de alimentos: ${x}. Más en Alertas PR por Stratum:`,
      allergen: "Alérgeno no declarado", micro: { listeria: "Posible Listeria", salmonella: "Posible Salmonella", ecoli: "Posible E. coli", botulism: "Riesgo de botulismo", mold: "Moho", cronobacter: "Posible Cronobacter" },
      foreign: "Objeto extraño", glass: "vidrio", plastic: "plástico", metal: "metal", stones: "piedras",
      cgmp: "Fallas en buenas prácticas de manufactura", drug: "Contiene medicamentos no declarados", leadMetal: "Plomo",
      allergens: { milk: "leche", soy: "soya", wheat: "trigo", egg: "huevo", peanut: "maní", "tree nut": "nueces", walnut: "nueces", almond: "almendra", cashew: "cajuil", hazelnut: "avellana", pistachio: "pistacho", pecan: "pecana", sesame: "ajonjolí", fish: "pescado", shellfish: "mariscos", shrimp: "camarón", coconut: "coco" },
    },
    en: {
      lead: (n) => `Free, from the FDA. ${n} ${n === 1 ? "recall" : "recalls"} named Puerto Rico in the last year.`,
      leadNat: (n) => `Free, from the FDA. ${n} ${n === 1 ? "recall" : "recalls"} with nationwide distribution in the last year.`,
      loading: "Loading FDA recalls…", fail: "We couldn't load the recalls. Try again in a few minutes.",
      none: "No recalls match your search.",
      shown: (a, b, d) => `Showing ${a} of ${b}${d ? ` · FDA data as of ${d}` : ""}`,
      sev: { 1: "Serious · Class I", 2: "Moderate · Class II", 3: "Minor · Class III", 0: "Unclassified" },
      more: "Show more", orig: "Original FDA text:", products: (n) => `and ${n} more ${n === 1 ? "product" : "products"}`,
      notice: (num) => `Look up the notice at the FDA (${num})`, share: "Share", copied: "Link copied",
      shareText: (x) => `Food recall: ${x}. More on Alertas PR by Stratum:`,
      allergen: "Undeclared allergen", micro: { listeria: "Possible Listeria", salmonella: "Possible Salmonella", ecoli: "Possible E. coli", botulism: "Botulism risk", mold: "Mold", cronobacter: "Possible Cronobacter" },
      foreign: "Foreign object", glass: "glass", plastic: "plastic", metal: "metal", stones: "stones",
      cgmp: "Good manufacturing practice failures", drug: "Contains undeclared drugs", leadMetal: "Lead",
      allergens: null,
    },
  };
  const FDA_SEARCH = "https://www.accessdata.fda.gov/scripts/ires/index.cfm";
  const MICRO = [["listeria", /listeria/i], ["salmonella", /salmonella/i], ["ecoli", /e\.?\s?coli|stec/i], ["botulism", /botulin|clostridium/i], ["cronobacter", /cronobacter/i], ["mold", /\bmou?ld/i]];
  const ALLERGENS = ["milk", "soy", "wheat", "egg", "peanut", "tree nut", "walnut", "almond", "cashew", "hazelnut", "pistachio", "pecan", "sesame", "shellfish", "shrimp", "fish", "coconut"];

  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const L = () => (document.documentElement.lang === "en" ? "en" : "es");

  const state = { scope: "pr", filter: "all", q: "", shown: PAGE, data: {}, error: false };

  function kinds(x) {
    const r = x.reason;
    return {
      allergen: /undeclared|allergen|not declare/i.test(r) && !/sildenafil|tadalafil|drug|color|red\s?\d|yellow\s?\d|sulfite/i.test(r),
      micro: MICRO.some(([, re]) => re.test(r)) || /pathogen|bacteri/i.test(r),
      foreign: /foreign|glass|plastic|metal|stone|rubber/i.test(r),
    };
  }

  /** Short summary of the FDA reason in the page language, or "" when no rule fits. */
  function summary(x, t) {
    const r = x.reason;
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
    if (/\blead\b/i.test(r)) return t.leadMetal;
    return "";
  }

  const title = (p) => {
    const cut = p.length > 110 ? p.slice(0, 110).replace(/[\s,;.:]+\S*$/, "") + "…" : p;
    return cut;
  };
  const fmtDate = (s, l) => {
    if (!s) return "";
    const d = /^\d{8}$/.test(s) ? new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T12:00:00`) : new Date(`${s}T12:00:00`);
    return d.toLocaleDateString(l === "en" ? "en-US" : "es-PR", { day: "numeric", month: "short", year: "numeric" });
  };

  async function load(scope) {
    if (state.data[scope]) return state.data[scope];
    const r = await fetch(`/api/recalls?scope=${scope}`, { headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const d = await r.json();
    if (!d.ok) throw new Error(d.error || "error");
    return (state.data[scope] = d);
  }

  function render() {
    const l = L(), t = T[l];
    const list = $("#a-list"), status = $("#a-status"), lead = $("#a-lead");
    const d = state.data[state.scope];
    if (state.error) { lead.textContent = ""; status.textContent = t.fail; list.innerHTML = ""; return; }
    if (!d) { status.textContent = t.loading; return; }

    lead.textContent = (state.scope === "pr" ? t.lead : t.leadNat)(d.items.length);
    const q = state.q.trim().toLowerCase();
    const items = d.items.filter((x) => {
      if (state.filter === "serious" && x.cls !== 1) return false;
      if (["allergen", "micro", "foreign"].includes(state.filter) && !kinds(x)[state.filter]) return false;
      return !q || `${x.product} ${x.firm} ${x.reason}`.toLowerCase().includes(q);
    });
    const shown = items.slice(0, state.shown);
    status.textContent = items.length ? t.shown(shown.length, items.length, fmtDate(d.updated, l)) : t.none;

    list.innerHTML = shown.map((x, i) => {
      const s = summary(x, t);
      return `<article class="a-item">
        <div class="a-meta"><span class="a-sev a-sev-${x.cls}">${esc(t.sev[x.cls])}</span><span>${esc(fmtDate(x.d, l))} · ${esc(x.firm)}</span></div>
        <h2>${esc(title(x.product))}${x.n > 1 ? ` <span class="a-orig">${esc(t.products(x.n - 1))}</span>` : ""}</h2>
        ${s ? `<p class="a-reason">${esc(s)}</p><p class="a-orig">${esc(t.orig)} ${esc(x.reason)}</p>` : `<p class="a-reason">${esc(x.reason)}</p>`}
        <div class="a-links"><a href="${FDA_SEARCH}" target="_blank" rel="noopener">${esc(t.notice(x.num))}</a><button type="button" data-share="${i}">${esc(t.share)}</button></div>
      </article>`;
    }).join("") + (items.length > shown.length ? `<button type="button" class="btn btn-soft a-more" data-more>${esc(t.more)}</button>` : "");

    list.onclick = async (e) => {
      if (e.target.closest("[data-more]")) { state.shown += PAGE; render(); return; }
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

  async function show(scope) {
    state.scope = scope; state.shown = PAGE; state.error = false;
    document.querySelectorAll("[data-scope]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.scope === scope)));
    render();
    try { await load(scope); } catch (err) { console.error("[alertas]", err); state.error = true; }
    if (state.scope === scope) render();
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-scope]").forEach((b) => b.addEventListener("click", () => show(b.dataset.scope)));
    document.querySelectorAll("[data-filter]").forEach((b) => b.addEventListener("click", () => {
      state.filter = b.dataset.filter; state.shown = PAGE;
      document.querySelectorAll("[data-filter]").forEach((c) => c.setAttribute("aria-pressed", String(c === b)));
      render();
    }));
    $("#a-q").addEventListener("input", (e) => { state.q = e.target.value; state.shown = PAGE; render(); });
    // main.js switches <html lang>; redraw the list in the new language
    new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    show("pr");
  });
})();
