/* Stratum cookie / storage consent (GDPR + ePrivacy style).
   - Only strictly necessary storage is used before a choice is made.
   - "Reject all" is as easy and as prominent as "Accept all".
   - Choices can be changed any time (footer link → StratumConsent.open()).
   - Consent expires after 12 months or when POLICY_VERSION changes.
   Categories: necessary (the consent record itself), preferences (remembering
   ES/EN) and analytics (anonymous, cookieless visit counts from Vercel Web
   Analytics, loaded by js/analytics.js only after consent). */
(function () {
  const KEY = "stratum-consent";
  const POLICY_VERSION = 2; // 2: added the analytics category
  const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
  const PREF_KEYS = ["fsqms-lang", "stratum-guide"]; // storage cleared when preferences are refused

  const TEXT = {
    es: {
      title: "Tu privacidad",
      body: "Usamos almacenamiento estrictamente necesario para que el sitio funcione. Con tu permiso, también recordamos tu idioma y contamos visitas de forma anónima para mejorar el sitio. No usamos cookies de publicidad ni de rastreo.",
      policy: "Política de cookies", privacy: "Privacidad",
      accept: "Aceptar todo", reject: "Rechazar todo", customize: "Personalizar", save: "Guardar mis opciones",
      necessary: "Necesarias", necessaryD: "Guardan tu elección de privacidad. Siempre activas.",
      prefs: "Preferencias", prefsD: "Recuerdan tu idioma (español o inglés) y que ya pediste la guía, entre visitas.",
      analytics: "Analítica", analyticsD: "Cuenta visitas y clics de forma anónima y sin cookies (por ejemplo, qué plan interesa más). No te identifica.",
      always: "Siempre activas", dialog: "Preferencias de privacidad",
    },
    en: {
      title: "Your privacy",
      body: "We use strictly necessary storage to make the site work. With your permission, we also remember your language and count visits anonymously to improve the site. We don't use advertising or tracking cookies.",
      policy: "Cookie policy", privacy: "Privacy",
      accept: "Accept all", reject: "Reject all", customize: "Customize", save: "Save my choices",
      necessary: "Necessary", necessaryD: "Store your privacy choice. Always on.",
      prefs: "Preferences", prefsD: "Remember your language (Spanish or English) and that you already requested the guide, between visits.",
      analytics: "Analytics", analyticsD: "Counts visits and clicks anonymously, without cookies (for example, which plan gets the most interest). It doesn't identify you.",
      always: "Always on", dialog: "Privacy preferences",
    },
  };

  const listeners = [];
  let state = read();

  function read() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!s || s.v !== POLICY_VERSION || Date.now() - s.ts > MAX_AGE_MS) return null;
      return s;
    } catch (e) { return null; }
  }

  function write(prefs) {
    state = { v: POLICY_VERSION, ts: Date.now(), necessary: true, preferences: !!prefs.preferences, analytics: !!prefs.analytics };
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage blocked: choice lasts this page view */ }
    if (!state.preferences) PREF_KEYS.forEach((k) => { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } });
    listeners.forEach((fn) => { try { fn(state); } catch (e) { /* ignore */ } });
    close();
  }

  const lang = () => (document.documentElement.lang === "en" ? "en" : "es");
  const t = (k) => TEXT[lang()][k];
  const base = () => (document.querySelector('link[rel="stylesheet"][href*="css/"]')?.getAttribute("href") || "").startsWith("../") ? "../" : "";

  let el = null;
  function render(expanded) {
    if (!el) {
      el = document.createElement("section");
      el.className = "consent";
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    const prefsOn = state ? state.preferences : false;
    const analyticsOn = state ? !!state.analytics : false;
    el.setAttribute("aria-label", t("dialog"));
    el.innerHTML = `
      <div class="consent-in">
        <p class="consent-title">${t("title")}</p>
        <p class="consent-body">${t("body")} <a href="${base()}cookies.html">${t("policy")}</a> · <a href="${base()}privacidad.html">${t("privacy")}</a></p>
        ${expanded ? `
        <div class="consent-cats">
          <div class="consent-cat">
            <div><b>${t("necessary")}</b><small>${t("necessaryD")}</small></div>
            <span class="consent-always">${t("always")}</span>
          </div>
          <label class="consent-cat">
            <div><b>${t("prefs")}</b><small>${t("prefsD")}</small></div>
            <input type="checkbox" class="consent-switch" data-cat="preferences" ${prefsOn ? "checked" : ""}>
          </label>
          <label class="consent-cat">
            <div><b>${t("analytics")}</b><small>${t("analyticsD")}</small></div>
            <input type="checkbox" class="consent-switch" data-cat="analytics" ${analyticsOn ? "checked" : ""}>
          </label>
        </div>` : ""}
        <div class="consent-actions">
          <button type="button" class="consent-btn" data-c="reject">${t("reject")}</button>
          ${expanded
            ? `<button type="button" class="consent-btn" data-c="save">${t("save")}</button>`
            : `<button type="button" class="consent-btn" data-c="customize">${t("customize")}</button>`}
          <button type="button" class="consent-btn" data-c="accept">${t("accept")}</button>
        </div>
      </div>`;
    el.hidden = false;
    el.dataset.expanded = expanded ? "1" : "";
  }
  function close() { if (el) el.hidden = true; }

  document.addEventListener("click", (e) => {
    const b = e.target.closest(".consent [data-c]");
    if (b) {
      const c = b.dataset.c;
      if (c === "accept") write({ preferences: true, analytics: true });
      if (c === "reject") write({ preferences: false, analytics: false });
      if (c === "customize") { render(true); el.querySelector(".consent-switch")?.focus(); }
      if (c === "save") write({
        preferences: el.querySelector('[data-cat="preferences"]').checked,
        analytics: el.querySelector('[data-cat="analytics"]').checked,
      });
      return;
    }
    const open = e.target.closest("[data-consent-open]");
    if (open) { e.preventDefault(); render(true); el.querySelector(".consent-switch")?.focus(); }
  });

  // Follow the page language while the banner is visible.
  new MutationObserver(() => { if (el && !el.hidden) render(!!el.dataset.expanded); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  const start = () => { if (!state) render(false); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();

  window.StratumConsent = {
    allows: (cat) => cat === "necessary" || !!(state && state[cat]),
    onChange: (fn) => listeners.push(fn),
    open: () => render(true),
  };
})();
