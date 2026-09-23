/* Stratum self-check — motion layer.
   Same language as the landing page motion: words rise out of a blur, content
   staggers in, headings ink in on scroll, numbers count.
   autoevaluacion.js re-renders #app on every change; its screens carry
   .enter only when they are new (next/back/results), so we animate those and
   leave re-renders from a tap static. Skipped entirely for reduced motion. */
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.documentElement.classList.add("motion-on");

  const app = document.getElementById("app");
  let dir = "fwd";        // which way the last navigation went
  let tapped = null;      // selector of the option row just tapped

  document.getElementById("back").addEventListener("click", () => { dir = "back"; }, true);
  document.getElementById("primary").addEventListener("click", () => { dir = "fwd"; }, true);
  app.addEventListener("click", (e) => {
    const r = e.target.closest(".row");
    if (!r) return;
    tapped = r.dataset.m ? `[data-m="${r.dataset.m}"]` : `[data-q="${r.dataset.q}"][data-i="${r.dataset.i}"]`;
  }, true);
  app.addEventListener("click", (e) => { if (e.target.closest("[data-act='restart']")) dir = "back"; }, true);

  const onRender = () => {
    const s = app.querySelector(".screen");
    if (!s || s.dataset.mo) return;
    s.dataset.mo = "1";
    if (s.classList.contains("enter")) enter(s);
    else settle(s);
  };
  new MutationObserver(onRender).observe(app, { childList: true });
  // the first screen was drawn before this script loaded (both are deferred)
  const first = app.querySelector(".screen");
  if (first) { first.classList.add("enter"); onRender(); }

  // ---------------------------------------------------------------------------
  function enter(s) {
    s.classList.add("mo-enter", dir === "back" ? "mo-back" : "mo-fwd");
    const isResults = !!s.querySelector(".pass");

    // headline words
    s.querySelectorAll(".cover h1, h2.step, .pass-holder b").forEach(splitWords);

    if (!isResults) {
      stagger(s, ".chips > *, .cover p, .group .field, .fine, .qtitle, .qhelp, .group .row", 55, 160);
      const segs = s.querySelectorAll(".progress i.on");
      if (dir === "fwd" && segs.length) segs[segs.length - 1].classList.add("mo-fill");
      return;
    }

    // ---- results ----
    countUp(s.querySelectorAll(".pass-fields div:not(:last-child) dd"), 1200); // not the date
    const meter = s.querySelector(".meter i");
    if (meter) { const w = meter.style.width; meter.style.width = "0"; setTimeout(() => { meter.style.width = w; }, 600); }
    countUp(s.querySelectorAll(".todo-meter b"), 600, true);

    s.querySelectorAll(".todo-h, .guide-head h3").forEach((h) => { splitWords(h); h.classList.add("ink"); });

    revealOnScroll(s, [
      [".todo-sub, .filters, .todo-meter", 1],
      [".tcard", 1],
      [".done-row .done-h", 0],
      [".done-chips li", 1, 40],
      [".calc", 0],
      [".guide-ico, .guide-eyebrow, .guide-sub", 1],
      [".deck-card", 1, 110],
      [".review", 0],
      [".res-main > .link, .res-main > .disc", 1],
    ]);
    watchInk();
    tweenCalc(s);
  }

  // A tap re-render: nothing replays, but the chosen option gets a little pop.
  function settle(s) {
    if (tapped) {
      const r = s.querySelector(tapped);
      if (r) r.classList.add("mo-tap");
      tapped = null;
    }
    if (s.querySelector(".pass")) { s.querySelectorAll(".todo-h, .guide-head h3").forEach((h) => { splitWords(h); h.classList.add("ink", "lit-all"); }); tweenCalc(s); }
  }

  // ---- helpers ---------------------------------------------------------------
  function splitWords(el) {
    // wraps words in direct text nodes only, so nested badges/spans survive
    let wi = 0;
    [...el.childNodes].forEach((n) => {
      if (n.nodeType !== 3 || !n.textContent.trim()) return;
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        const w = document.createElement("span");
        w.className = "w"; w.style.setProperty("--wi", wi++); w.textContent = part;
        frag.appendChild(w);
      });
      n.replaceWith(frag);
    });
    el.classList.add("words");
  }

  function stagger(scope, sel, step, base) {
    scope.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add("mo-item");
      el.style.setProperty("--delay", base + Math.min(i, 14) * step + "ms");
    });
  }

  function revealOnScroll(scope, groups) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("m-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    groups.forEach(([sel, stag, step = 80]) => {
      scope.querySelectorAll(sel).forEach((el, i) => {
        el.setAttribute("data-reveal", "");
        el.style.setProperty("--delay", (stag ? Math.min(i, 10) * step : 0) + "ms");
        io.observe(el);
      });
    });
  }

  function countUp(els, delay, keepSmall) {
    els.forEach((el) => {
      // only animate the leading number; keep any "/16"-style suffix element
      const small = keepSmall ? el.querySelector("small") : null;
      const txt = small ? el.firstChild.textContent : el.textContent;
      const m = /^(\d+)/.exec(txt.trim());
      if (!m) return;
      const target = +m[1], rest = txt.trim().slice(m[1].length);
      const write = (v) => { if (small) el.firstChild.textContent = v + rest; else el.textContent = v + rest; };
      write(0);
      setTimeout(() => {
        const t0 = performance.now();
        const step = (now) => {
          const p = Math.min(1, (now - t0) / 900), e = 1 - Math.pow(1 - p, 3);
          write(Math.round(target * e));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, delay);
    });
  }

  // headings ink in word by word, triggered once by scroll; the words finish on
  // their own timing, so a heading never freezes half-grey mid-scroll
  function watchInk() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("lit-all"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -15% 0px", threshold: 0.6 });
    app.querySelectorAll(".ink:not(.lit-all)").forEach((h) => io.observe(h));
  }

  // calculator outputs glide to their new values
  function tweenCalc(s) {
    ["o-cost", "o-price"].forEach((id) => {
      const el = s.querySelector("#" + id);
      if (!el) return;
      let shown = parseFloat(el.textContent.replace(/[^0-9.]/g, "")) || 0, last = null;
      new MutationObserver(() => {
        if (el.textContent === last) return;
        const target = parseFloat(el.textContent.replace(/[^0-9.]/g, "")) || 0, from = shown;
        shown = target;
        const box = el.parentElement;
        box.classList.remove("bump"); void box.offsetWidth; box.classList.add("bump");
        const t0 = performance.now();
        const step = (now) => {
          const p = Math.min(1, (now - t0) / 450), e = 1 - Math.pow(1 - p, 3);
          last = "$" + (from + (target - from) * e).toFixed(2);
          el.textContent = last;
          if (p < 1 && shown === target) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }).observe(el, { childList: true, characterData: true, subtree: true });
    });
  }
})();
