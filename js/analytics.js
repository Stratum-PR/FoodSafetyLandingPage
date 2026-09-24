/* Anonymous site analytics (Vercel Web Analytics: cookieless, no personal data).
   Loaded only when the visitor allows the "analytics" category in the consent banner
   (js/consent.js), and dropped again if they withdraw it.

   Pages call window.stratumTrack(name, data) for key actions (e.g. clicks on a pricing
   tier). Before consent, or with it refused, calls are simply ignored.
   Rules for data: short enum-like values only (tier, billing, a bucket). Never names,
   emails, businesses or free text.

   Page views are counted automatically once the script loads. Custom events need Web
   Analytics enabled on the Vercel project; on plans without custom events they're
   ignored by Vercel and the page keeps working. */
(function () {
  // The script Vercel serves on the site's own domain once Web Analytics is enabled.
  const SCRIPT = "/_vercel/insights/script.js";
  let loaded = false;

  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };

  function load() {
    if (loaded || location.hostname === "localhost") return;
    loaded = true;
    const s = document.createElement("script");
    s.defer = true;
    s.src = SCRIPT;
    document.head.appendChild(s);
  }

  const allowed = () => !!window.StratumConsent?.allows("analytics");

  window.stratumTrack = function (name, data) {
    if (!allowed()) return;
    const clean = {};
    Object.entries(data || {}).forEach(([k, v]) => {
      if (v == null) return;
      clean[k] = typeof v === "number" ? v : String(v).slice(0, 40);
    });
    if (location.hostname === "localhost") { console.info("[analytics]", name, clean); return; }
    window.va("event", { name, data: clean });
  };

  if (allowed()) load();
  window.StratumConsent?.onChange((state) => { if (state.analytics) load(); });
})();
