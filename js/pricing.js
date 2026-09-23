/* Shared pricing math + sample catalog, used by the landing calculator and the
   self-check results. Exposed as window.FSQMSPricing (no build step). */
(function () {
  // Sample shelf prices — NOT real Walmart data. Swap for the catalog API later.
  const CATALOG = [
    { k: ["galleta", "galletas", "cookie", "biscuit", "wafer"], es: "Galletas", en: "Cookies", items: [["Galletas surtidas 12oz", 3.24], ["Galletas de mantequilla 14oz", 4.48], ["Wafer de vainilla 10oz", 2.97]] },
    { k: ["salsa", "hot sauce", "picante", "ketchup", "condimento", "adobo", "sazon", "sazón"], es: "Salsas y condimentos", en: "Sauces & condiments", items: [["Salsa picante 5oz", 2.48], ["Adobo 8oz", 3.12], ["Sazón en polvo 6oz", 2.76]] },
    { k: ["jugo", "juice", "bebida", "refresco", "nectar", "néctar"], es: "Jugos y bebidas", en: "Juices & drinks", items: [["Jugo de fruta 64oz", 3.68], ["Néctar tropical 46oz", 2.94], ["Bebida de frutas 1L", 2.12]] },
    { k: ["cafe", "café", "coffee"], es: "Café", en: "Coffee", items: [["Café molido 14oz", 6.98], ["Café en grano 12oz", 8.47], ["Café instantáneo 8oz", 5.36]] },
    { k: ["dulce", "dulces", "candy", "caramelo", "confite"], es: "Dulces", en: "Candy", items: [["Dulces surtidos 8oz", 3.47], ["Caramelos de menta 6oz", 2.24], ["Confite de frutas 10oz", 2.88]] },
    { k: ["snack", "picadera", "chip", "tostada", "platano", "plátano", "chicharron", "chicharrón"], es: "Snacks", en: "Snacks", items: [["Mariquitas 5oz", 3.12], ["Chips de plátano 6oz", 3.68], ["Chicharrones 4oz", 2.94]] },
    { k: ["pan", "bread", "panaderia", "panadería", "bizcocho", "cake", "postre"], es: "Panadería", en: "Bakery", items: [["Pan artesanal 16oz", 4.24], ["Bizcocho individual 4oz", 2.98], ["Pan dulce 12oz", 3.76]] },
    { k: ["salsa de tomate", "pasta", "fideos", "pasta alimenticia", "spaghetti", "macarron", "macarrón"], es: "Pastas", en: "Pasta", items: [["Pasta 16oz", 1.68], ["Salsa para pasta 24oz", 2.98], ["Fideos 12oz", 1.94]] },
    { k: ["miel", "honey", "mermelada", "jam", "guayaba", "jalea"], es: "Mermeladas y conservas", en: "Jams & preserves", items: [["Mermelada de guayaba 12oz", 3.98], ["Miel pura 12oz", 6.24], ["Jalea de frutas 10oz", 3.42]] },
    { k: ["te", "té", "tea", "infusion", "infusión"], es: "Tés e infusiones", en: "Teas", items: [["Té en bolsitas 20ct", 3.48], ["Infusión de hierbas 16ct", 4.12], ["Té helado 12oz", 2.68]] },
    { k: ["aceite", "oil", "vinagre", "vinagreta"], es: "Aceites y vinagres", en: "Oils & vinegars", items: [["Aceite de oliva 16oz", 7.94], ["Vinagre 12oz", 2.34], ["Aceite vegetal 24oz", 4.68]] },
    { k: ["cereal", "granola", "avena", "oatmeal"], es: "Cereales", en: "Cereals", items: [["Cereal 14oz", 3.98], ["Granola 12oz", 4.86], ["Avena 18oz", 3.24]] },
  ];

  function matchCatalog(q) {
    q = (q || "").toLowerCase().trim();
    if (q.length < 3) return null;
    let best = null, bestLen = 0;
    CATALOG.forEach((c) => c.k.forEach((k) => {
      if ((q.includes(k) || k.includes(q)) && k.length > bestLen) { best = c; bestLen = k.length; }
    }));
    return best;
  }

  const num = (v) => { const n = parseFloat(String(v).replace(",", ".")); return isFinite(n) && n > 0 ? n : 0; };

  // values: [ingredients, labor, overhead, freight, marginPct]
  function compute(values) {
    const cost = num(values[0]) + num(values[1]) + num(values[2]) + num(values[3]);
    const margin = Math.min(num(values[4]), 95);
    return { cost, price: cost / (1 - margin / 100) };
  }

  // 0 = below shelf range, 1 = inside it, 2 = above it
  function fit(price, cat) {
    const prices = cat.items.map((i) => i[1]);
    const lo = Math.min(...prices), hi = Math.max(...prices);
    return { lo, hi, zone: price < lo ? 0 : price > hi ? 2 : 1 };
  }

  const TEXT = {
    es: {
      cf: ["Ingredientes y empaque", "Mano de obra", "Gastos generales", "Transporte al centro de distribución", "Margen que quieres ganar"],
      cost: "Costo por unidad", minPrice: "Precio mínimo a Walmart",
      note: "Deja espacio para descuentos, promociones y cargos por incumplimiento. Todo por unidad.",
      simLabel: "Nombre de tu producto", simPh: "Ej. galletas de coco, salsa picante...", simCta: "Ver productos similares",
      simTitle: (n) => `Productos similares a "${n}"`, simRange: "Rango de precio en tienda",
      simNoMatch: "No encontramos una categoría parecida todavía. Prueba con otra palabra, como el tipo de producto (galleta, salsa, jugo...).",
      simMock: "Datos de ejemplo, no precios reales de Walmart",
      simHint: "Compara tu precio con lo que se vende hoy en Walmart. Cuando conectemos el catálogo de Walmart, esto se actualizará con productos reales.",
      simFit: ["Tu precio está por debajo del rango: hay espacio para el margen del minorista.", "Tu precio está dentro del rango de venta al público, así que puede que no quede margen para Walmart.", "Tu precio está por encima de lo que se vende hoy: revisa tu costo o tu posicionamiento."],
    },
    en: {
      cf: ["Ingredients and packaging", "Labor", "Overhead", "Freight to the distribution center", "Margin you want"],
      cost: "Cost per unit", minPrice: "Minimum price to Walmart",
      note: "Leave room for allowances, promotions and compliance chargebacks. All per unit.",
      simLabel: "Your product's name", simPh: "E.g. coconut cookies, hot sauce...", simCta: "See similar products",
      simTitle: (n) => `Products similar to "${n}"`, simRange: "In-store price range",
      simNoMatch: "We couldn't find a close category yet. Try another word, like the product type (cookie, sauce, juice...).",
      simMock: "Sample data, not real Walmart prices",
      simHint: "Compare your price with what's selling today at Walmart. Once we connect Walmart's catalog, this will update with real products.",
      simFit: ["Your price is below the range: there's room for the retailer's margin.", "Your price sits inside the retail range, so there may be no margin left for Walmart.", "Your price is above what sells today: check your cost or your positioning."],
    },
  };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Markup for the "similar products" card; shared so both pages render it identically.
  function similarHTML(query, price, lang) {
    const t = TEXT[lang];
    const cat = matchCatalog(query);
    if (!cat) return `<p class="simempty">${esc(t.simNoMatch)}</p>`;
    const f = fit(price, cat);
    const cls = ["lo", "mid", "hi"][f.zone];
    return `<div class="simcard">
      <span class="simmock">${esc(t.simMock)}</span>
      <h4>${esc(t.simTitle(query))} · ${esc(cat[lang])}</h4>
      <p class="simempty" style="margin:2px 0 0">${esc(t.simRange)}: <b>$${f.lo.toFixed(2)} – $${f.hi.toFixed(2)}</b></p>
      <ul class="simlist">${cat.items.map((i) => `<li><span>${esc(i[0])}</span><b>$${i[1].toFixed(2)}</b></li>`).join("")}</ul>
      ${price > 0 ? `<p class="simfit ${cls}">${esc(t.simFit[f.zone])}</p>` : ""}
      <p class="simempty" style="margin-top:8px">${esc(t.simHint)}</p>
    </div>`;
  }

  window.FSQMSPricing = { CATALOG, matchCatalog, compute, fit, TEXT, similarHTML, esc };
})();
