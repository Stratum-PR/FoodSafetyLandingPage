/* Legal pages: show the Spanish or English block to match the page language.
   main.js owns the ES/EN toggle; this runs after it. */
(function () {
  const apply = (l) => {
    document.querySelectorAll("[data-lang-block]").forEach((b) => { b.hidden = b.dataset.langBlock !== l; });
  };
  document.addEventListener("DOMContentLoaded", () => {
    apply(document.documentElement.lang === "en" ? "en" : "es");
    if (typeof I18N_EVENTS !== "undefined") I18N_EVENTS.push(apply);
  });
})();
