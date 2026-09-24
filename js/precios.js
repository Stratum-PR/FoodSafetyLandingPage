/* Pricing page (precios.html): billing toggle, "Solicitar acceso" requests, ROI calculator.
   Runs after js/main.js (language, nav, contact dialog, form helpers) and uses its globals:
   lang, I18N_EVENTS, msg, validate, statusSetter, postJSON.

   "Solicitar acceso" is a pilot request, not a purchase: the form goes to /api/pricing, which
   emails the lead (with plan and billing) to contact@. Anonymous events go through
   window.stratumTrack (js/analytics.js), only with analytics consent:
     pricing_billing   billing toggled            { billing }
     pricing_cta       a plan's button clicked    { tier, billing, source: card|roi }
     request_open      request dialog opened      { tier }
     request_submit    request sent               { tier, billing, suppliers }
     request_abandon   dialog closed unsent       { tier }
     request_error     request failed             { tier }
     roi_calc          calculator used            { tier, sup, hours, result }
   Comparing pricing_cta with request_submit per tier gives the drop-off. */
(function () {
  const PRICING_ENDPOINT = "/api/pricing";
  const TIERS = {
    esencial: { name: "Esencial", monthly: 179, annual: 1790, maxSup: 20 },
    profesional: { name: "Profesional", monthly: 429, annual: 4290, maxSup: 100 },
    plus: { name: "Planta Plus", monthly: 849, annual: 8490, maxSup: Infinity },
  };
  const TEXT = {
    es: {
      billedMonthly: "Facturado mensualmente",
      billedAnnual: (t) => `Facturado anualmente: $${t}`,
      pays: (m) => `El plan se paga solo y libera cerca de $${m} al mes.`,
      short: (h) => `Para pagarse solo necesita ahorrar unas ${h} horas más al mes, o evitar un problema de auditoría.`,
    },
    en: {
      billedMonthly: "Billed monthly",
      billedAnnual: (t) => `Billed annually: $${t}`,
      pays: (m) => `The plan pays for itself and frees about $${m} a month.`,
      short: (h) => `To pay for itself it needs to save about ${h} more hours a month, or avoid one audit problem.`,
    },
  };
  const tx = (k) => TEXT[lang === "en" ? "en" : "es"][k];
  const money = (n) => Math.round(n).toLocaleString("en-US");
  const track = (name, data) => window.stratumTrack && window.stratumTrack(name, data);

  let billing = "monthly";

  // ---- Prices and billing toggle -------------------------------------------
  function perMonth(tier) {
    const t = TIERS[tier];
    return billing === "annual" ? t.annual / 12 : t.monthly;
  }

  function renderPrices() {
    document.querySelectorAll(".pr-tier").forEach((card) => {
      const t = TIERS[card.dataset.tier];
      card.querySelector(".pr-amount").textContent = "$" + money(perMonth(card.dataset.tier));
      card.querySelector("[data-billed]").textContent =
        billing === "annual" ? tx("billedAnnual")(money(t.annual)) : tx("billedMonthly");
    });
    document.querySelectorAll(".pr-billing button").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.billing === billing)));
  }

  function initBilling() {
    document.querySelectorAll(".pr-billing button").forEach((b) => {
      b.addEventListener("click", () => {
        if (billing === b.dataset.billing) return;
        billing = b.dataset.billing;
        renderPrices();
        calc(false);
        track("pricing_billing", { billing });
      });
    });
  }

  // ---- Request access (fake door) ------------------------------------------
  const dialog = document.getElementById("solicitar");
  const form = document.getElementById("req-form");
  let openTier = null;
  let sent = false;
  let source = "card";
  let roiSnapshot = null;

  function openRequest(tier, from) {
    if (!dialog || !form) return;
    openTier = tier; sent = false; source = from;
    form.reset();
    form.elements.tier.value = tier;
    form.elements.billing.value = billing;
    document.getElementById("req-status").textContent = "";
    if (typeof dialog.showModal === "function") dialog.showModal(); else dialog.setAttribute("open", "");
    form.elements.name.focus();
    track("request_open", { tier });
  }

  function initRequest() {
    if (!dialog || !form) return;
    const show = statusSetter(document.getElementById("req-status"), "contact-status");
    const button = form.querySelector('button[type="submit"]');

    document.querySelectorAll("[data-request]").forEach((b) => {
      b.addEventListener("click", () => {
        track("pricing_cta", { tier: b.dataset.request, billing, source: "card" });
        roiSnapshot = null;
        openRequest(b.dataset.request, "card");
      });
    });

    dialog.querySelector("[data-close-request]").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener("close", () => { if (!sent && openTier) track("request_abandon", { tier: openTier }); });
    if (location.hash === "#solicitar") openRequest("profesional", "link");

    form.addEventListener("input", (e) => e.target.removeAttribute("aria-invalid"));
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (form.elements._gotcha.value) return; // bot
      const bad = validate(form);
      if (bad) { show(msg(bad.type === "email" && bad.value ? "emailBad" : "missing"), "error"); bad.focus(); return; }
      const f = form.elements;
      const body = {
        name: f.name.value.trim(), business: f.business.value.trim(), email: f.email.value.trim(),
        phone: f.phone.value.trim(), tier: f.tier.value, billing: f.billing.value,
        suppliers: f.suppliers.value, message: f.message.value.trim(), source, roi: roiSnapshot, lang,
      };
      const label = button.textContent;
      button.disabled = true; button.textContent = msg("sending");
      try {
        await postJSON(PRICING_ENDPOINT, body);
        sent = true;
        show(msg("reqOk"), "success");
        track("request_submit", { tier: body.tier, billing: body.billing, suppliers: body.suppliers });
        form.querySelectorAll("input, select, textarea").forEach((el) => { el.disabled = true; });
        button.hidden = true;
      } catch (err) {
        console.error("[Stratum] pricing request failed:", err);
        show(msg("reqFail"), "error");
        track("request_error", { tier: body.tier });
      } finally {
        button.disabled = false; button.textContent = label;
      }
    });

    // A fresh form each time the dialog opens after a successful request.
    dialog.addEventListener("close", () => {
      if (!sent) return;
      form.querySelectorAll("input, select, textarea").forEach((el) => { el.disabled = false; });
      button.hidden = false;
    });
  }

  // ---- ROI calculator ------------------------------------------------------
  const num = (id, min, max) => {
    const v = parseFloat(document.getElementById(id)?.value);
    return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min;
  };
  const bucket = (n, edges) => {
    for (let i = 0; i < edges.length; i++) if (n <= edges[i]) return (i ? edges[i - 1] + 1 : 0) + "-" + edges[i];
    return edges[edges.length - 1] + "+";
  };

  let lastResult = null;
  let trackTimer = null;

  function calc(fromUser) {
    if (!document.getElementById("roi-form")) return;
    const sup = num("r-sup", 1, 2000);
    const hours = num("r-doc", 0, 400) + num("r-aud", 0, 400);
    const rate = num("r-rate", 1, 500);
    const cons = num("r-cons", 0, 50000);
    const save = num("r-save", 20, 80) / 100;

    const tier = sup <= TIERS.esencial.maxSup ? "esencial" : sup <= TIERS.profesional.maxSup ? "profesional" : "plus";
    const cost = perMonth(tier);
    const saved = hours * save;
    const value = saved * rate + cons;
    const net = value - cost;

    document.getElementById("r-save-out").textContent = Math.round(save * 100) + "%";
    document.getElementById("r-plan").textContent = TIERS[tier].name;
    document.getElementById("r-hours").textContent = Math.round(saved);
    document.getElementById("r-value").textContent = "$" + money(value);
    document.getElementById("r-cost").textContent = "$" + money(cost);
    const netEl = document.getElementById("r-net");
    netEl.textContent = (net < 0 ? "−$" : "$") + money(Math.abs(net));
    netEl.classList.toggle("is-neg", net < 0);
    document.getElementById("r-verdict").textContent = net >= 0
      ? tx("pays")(money(net))
      : tx("short")(Math.ceil(-net / rate));

    lastResult = { tier, sup, hours, net };
    if (fromUser) {
      clearTimeout(trackTimer);
      trackTimer = setTimeout(() => track("roi_calc", {
        tier,
        sup: bucket(sup, [5, 20, 50, 100]),
        hours: bucket(hours, [5, 15, 30, 60]),
        result: net >= 0 ? "pays" : "short",
      }), 1500);
    }
  }

  function initRoi() {
    const form = document.getElementById("roi-form");
    if (!form) return;
    form.addEventListener("input", () => calc(true));
    form.addEventListener("submit", (e) => e.preventDefault());
    document.getElementById("roi-cta")?.addEventListener("click", () => {
      if (!lastResult) calc(false);
      const r = lastResult;
      track("pricing_cta", { tier: r.tier, billing, source: "roi" });
      // Sent with the request so the lead email shows what the prospect entered.
      roiSnapshot = {
        suppliers: r.sup, hoursPerMonth: r.hours, rate: num("r-rate", 1, 500),
        consulting: num("r-cons", 0, 50000), savePct: num("r-save", 20, 80), netPerMonth: Math.round(r.net),
      };
      openRequest(r.tier, "roi");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initBilling();
    initRequest();
    initRoi();
    renderPrices();
    calc(false);
    // main.js re-applies translations on every language change; refresh the dynamic text after it.
    I18N_EVENTS.push(() => { renderPrices(); calc(false); });
  });
})();
