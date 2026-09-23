/* Stratum landing — motion layer.
   Inspired by the Finpay landing shot: words rise in, headings "ink in" word by
   word as you scroll, cards stagger, numbers count, the gradient block expands.
   Loaded after main.js; everything is skipped for prefers-reduced-motion. */
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const root = document.documentElement;
  root.classList.add("motion-on");

  document.addEventListener("DOMContentLoaded", () => {
    splitAll();
    // main.js rewrites text on ES/EN switch; re-split afterwards so the effects survive.
    if (typeof I18N_EVENTS !== "undefined") I18N_EVENTS.push(() => { splitAll(); watchInk(); });

    markReveals();
    heroCount();
    watchInk();
    initScroll();
  });

  // ---- Word splitting -------------------------------------------------------
  const INK = ".section-head h2, .ai-copy h2, .showcase-copy h2, .guide-intro h2, .signup h2";
  function splitWords(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w, i) => `<span class="w" style="--wi:${i}">${w.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]))}</span>`).join(" ");
  }
  function splitAll() {
    const h1 = document.querySelector(".hero h1");
    if (h1) { splitWords(h1); h1.classList.remove("words-in"); void h1.offsetWidth; h1.classList.add("words-in"); }
    document.querySelectorAll(INK).forEach((el) => {
      splitWords(el);
      el.classList.add("ink");
      // after a language switch, headings already seen stay inked (no replay)
      if (el.dataset.inked) el.classList.add("lit", "lit-now");
    });
  }

  // ---- Scroll-in reveals with stagger --------------------------------------
  function markReveals() {
    const groups = [
      [".section-head .eyebrow", 0],
      [".grid-3 > .card", 1],
      [".grid-4 > .card", 1],
      [".showcase-copy > p, .showcase-copy > .btn", 1],
      [".checklist li", 1],
      [".audit", 0],
      [".ai-copy > p, .ai-asks li, .ai-copy > .btn", 1],
      [".chat", 0],
      [".guide-intro > p", 1],
      [".deck-card", 1],
      [".signup", 0],
      [".signup-lead, .signup-form", 1],
      [".footer-inner > *", 1],
    ];
    groups.forEach(([sel, stagger]) => {
      document.querySelectorAll(sel).forEach((el, i) => {
        el.classList.remove("reveal", "is-visible"); // hand over from main.js's simpler reveal
        el.setAttribute("data-m", "");
        if (stagger) el.style.setProperty("--d", i % 6);
      });
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("m-in");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.15 });
    document.querySelectorAll("[data-m], .checklist").forEach((el) => io.observe(el));
  }

  // ---- Hero score counts up with the ring -----------------------------------
  function heroCount() {
    const el = document.querySelector(".score-ring-inner strong");
    if (!el) return;
    const target = parseInt(el.textContent, 10) || 0;
    el.textContent = "0";
    setTimeout(() => countTo(el, 0, target, 1200, (v) => String(Math.round(v))), 700);
  }

  function countTo(el, from, to, ms, fmt) {
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // ---- Headings ink in word by word, triggered once by scroll ---------------
  // Scroll only *starts* it; the words then finish on their own timing, so a
  // heading is never left half-grey when someone stops scrolling mid-way.
  let inkIO = null;
  function watchInk() {
    inkIO?.disconnect();
    inkIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("lit");
        e.target.dataset.inked = "1";
        inkIO.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -18% 0px", threshold: 0.6 });
    document.querySelectorAll(".ink:not(.lit)").forEach((h) => inkIO.observe(h));
  }

  // ---- Light scroll-linked touches: header shadow + hero parallax -----------
  function initScroll() {
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      document.querySelector(".site-header")?.classList.toggle("is-scrolled", window.scrollY > 8);
      const hv = document.querySelector(".hero-visual");
      if (hv && window.scrollY < window.innerHeight * 1.2) hv.style.setProperty("--py", (window.scrollY * -0.06).toFixed(1) + "px");
    });
  }

})();
