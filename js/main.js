/* Stratum landing — progressive enhancements. The page reads fine without JS. */

// ---- Configuration ---------------------------------------------------------
const CONFIG = {
  // Where the "Hazte la autoevaluación" buttons go.
  assessmentUrl: "autoevaluacion.html",

  // Endpoints that receive JSON. Formspree ("https://formspree.io/f/xxxx"),
  // Basin, Getform, a Google Apps Script web app or your own API all work.
  signupEndpoint: "/api/signup",   // { name, email, business, phone, consent, source, lang }
  contactEndpoint: "/api/contact",  // { name, email, business, message, lang }
  guideEndpoint: "/api/guide",    // { name, business, email, phone, updates, source, lang } (unlocks the guide)
};

const LANG_KEY = "fsqms-lang"; // shared with the self-check; saved only with "preferences" consent

// Industry insights shown in the hero card (from Stratum's industry research).
const INSIGHTS = [
  { pct: 81, es: "No están preparados para una auditoría", en: "Aren't ready for an audit" },
  { pct: 73, es: "No pueden rastrear un lote rápidamente", en: "Can't trace a lot quickly" },
  { pct: 64, es: "Manejan operaciones en Excel o papel", en: "Run operations on Excel or paper" },
  { pct: 52, es: "No tienen operaciones estandarizadas", en: "Don't have standardized operations" },
  { pct: 37, es: "Sienten que no pueden escalar", en: "Feel they can't scale" },
];

// ---- English copy. Spanish lives in the HTML and is captured on load. -------
const EN = {
  skip: "Skip to content", back: "← Back to home",
  navProduct: "Product", navHow: "How it works", navGuide: "Requirements guide",
  navCta: "Take the self-check", menuOpen: "Open menu", menuClose: "Close menu",
  heroTitle: "What are you missing to sell to Walmart?",
  heroLead: "A free self-check based on Walmart's and the FDA's official requirements. Get your score, your to-do list and a guide of official links to close every gap.",
  heroCta: "Take the free self-check", heroGuide: "Get the free requirements guide →",
  heroVisualLabel: "Sample self-check result",
  passport: "Walmart passport", pts: "/ 32 pts", tierClose: "Close", tierCloseDesc: "You're missing key requirements to qualify.",
  priority: "Priority", reqAudit: "Food safety audit", reqExp: "Expiration tracking", pending: "Pending",
  insChip: "Industry insights", insPause: "Pause", insPlay: "Play", insTabs: "Insights",
  probEyebrow: "The problem", probTitle: "One company with disconnected systems",
  probLead: "Today a food business runs its operation on disconnected systems: lots in Excel, receiving on paper, certificates of analysis by email, temperatures on one sheet and cleaning on another. Each has its own owner and format, and there's no single record of the operation.",
  hubLabel: "Today: separate tools. With Stratum: suppliers, receiving, lots, inventory, CAPAs, documents and audits connected in one record.",
  fsmaKicker: "FSMA 204 · FDA traceability rule",
  fsmaTitle: "The FDA requires compliance on July 20, 2028. Walmart, Sam's Club and Costco require it today.",
  fsmaBody: "If you want to sell to these chains, you need to trace your lots quickly starting now. Two years sounds like plenty of time; to roll out traceability across a whole operation, it isn't.",
  prob1T: "Manual supply chain management", prob1B: "Orders, certificates and supplier follow-ups live in emails, calls and Excel sheets, with no one place connecting it all.",
  prob2T: "Lost time and money", prob2B: "Hours reviewing reports, duplicated work across systems and little visibility into what's happening in the operation.",
  prob3T: "Slow recalls", prob3B: "During a recall, a lot's information is spread across several systems and pulling it together takes hours or days, when you need it in minutes.",
  prodEyebrow: "The product", prodTitle: "What Stratum solves for you",
  f1T: "Supplier registry", f1B: "Request and track every supplier's certificates from one place.",
  f2T: "Designed for FSMA from the start", f2B: "Preventive controls, supplier verification and FSMA 204 traceability records, built in by design.",
  f3T: "Immutable, auditable records", f3B: "Every document, signature and change keeps its date, author and history. Nothing is overwritten or deleted without a trace.",
  f4T: "Lot traceability", f4B: "Trace a lot one step back and forward in seconds, not days.",
  auditT: "Audit-ready, every day",
  auditB: "When your certification auditor, Walmart or the FDA shows up, the evidence is already organized, current and complete with its history.",
  audit1: "Countdown and gaps for your next audit", audit2: "Evidence per requirement, ready to show", audit3: "A history of who did what, and when",
  aiEyebrow: "<span class=\"keep-case\">StratAI</span> · Compliance assistant", aiTitle: "Ask your quality system",
  aiBody: "StratAI sees your documents, suppliers, findings, sensors and history, and cross-checks them. Ask in English or Spanish and get answers that link back to the records they came from.",
  aiAsksLabel: "Example questions",
  aiQ1: "What am I missing for the audit?", aiQ2: "Which documents are under review?", aiQ3: "Who changed the receiving SOP, and why?",
  aiChatLabel: "Sample conversation with StratAI",
  aiSub: "Quality assistant · live system data",
  aiUser: "How many findings were opened this month, and why?",
  aiAns1: "<span data-month></span> has <strong>6 findings</strong> so far: 4 open, 1 in verification and 1 closed.",
  aiAns2: "Three lots received without a COA attached", aiAns3: "Mozzarella received at 7.2 °C, above the limit", aiAns4: "Food-contact certificate expired for an active supplier",
  aiInput: "Ask about any module",
  howEyebrow: "The self-check", howTitle: "Get your score in 3 minutes",
  howBody: "11 questions cover supplier registration, food safety, traceability and insurance. At the end you get your Walmart passport with your score and your to-do list, each item with its official source.",
  howCta: "Start my self-check", howVisualLabel: "Sample to-do list",
  listHead: "Your to-do list", listCount: "16 requirements",
  reqFda: "FDA registration", reqGs1: "GS1 membership and UPC", reqGfsi: "GFSI audit", done: "Done", inProgress: "In progress",
  guideEyebrow: "Requirements guide", guideTitle: "Every official link, in one place",
  guideBody: "Each requirement for supplying Walmart with its official source: Walmart, the federal government and the FDA. It's free: leave your details and unlock it instantly.",
  guideUpdates: "I want to receive news from Stratum (optional).",
  guidePrivacy: "We use this to give you access to the guide and, if you check the box, send you news. See the <a href=\"privacidad.html\">Privacy Policy</a>.",
  guideBtn: "See the guide", guideDoneT: "Done! The guide is unlocked.", guideDoneB: "Open each group to see its official links.",
  guideNote: "Sources verified September 21, 2026.",
  signupTitle: "Join the early-access list",
  signupLead: "Be among the first to use Stratum. We'll let you know when access opens and invite you to a demo.",
  emailPh: "you@business.com", signupBtn: "Join the list",
  signupConsent: "I agree to receive communications from Stratum about early access. I can unsubscribe anytime. See the <a href=\"privacidad.html\">Privacy Policy</a>.",
  footDisc: "Stratum PR is not affiliated with Walmart. Requirements vary by product category; confirm them with your buyer.",
  footProduct: "Product", footSelf: "Self-check", footGuide: "Requirements guide", footDemo: "Demo ↗",
  footAbout: "About us", footContact: "Contact", footPlan: "MVP plan ↗",
  footPrivacy: "Privacy", footTerms: "Terms of use", footCookies: "Cookies", footCookiePrefs: "Cookie preferences",
  contactTitle: "Contact us", close: "Close",
  contactLead: "Tell us about your business and we'll get back to you within 1–2 business days.",
  cName: "Name", cEmail: "Email", cBizReq: "Business", cPhone: "Phone (optional)", cMsg: "Message", cSend: "Send message",
  contactPrivacy: "We'll only use this to reply to you. See the <a href=\"privacidad.html\">Privacy Policy</a>.",
};

const MSG = {
  es: {
    missing: "Completa los campos obligatorios.",
    emailBad: "Escribe un correo electrónico válido.",
    consentNeeded: "Marca la casilla para aceptar recibir comunicaciones.",
    notReady: "El registro aún no está disponible. Vuelve pronto.",
    sending: "Enviando…",
    signupOk: "¡Listo! Te avisaremos cuando abramos acceso.",
    signupFail: "No pudimos registrarte. Inténtalo otra vez en unos minutos.",
    contactNotReady: "El formulario aún no está conectado. Escríbenos a través de stratumpr.com.",
    contactOk: "¡Gracias! Te responderemos pronto.",
    contactFail: "No pudimos enviar tu mensaje. Inténtalo otra vez.",
    title: "Stratum · ¿Qué te falta para vender en Walmart?",
    links: (n) => `${n} enlaces`,
    locked: "Completa el formulario para desbloquear los enlaces",
  },
  en: {
    missing: "Please fill in the required fields.",
    emailBad: "Enter a valid email address.",
    consentNeeded: "Check the box to agree to receive communications.",
    notReady: "Sign-up isn't available yet. Check back soon.",
    sending: "Sending…",
    signupOk: "You're in! We'll let you know when access opens.",
    signupFail: "We couldn't sign you up. Try again in a few minutes.",
    contactNotReady: "This form isn't connected yet. Reach us through stratumpr.com.",
    contactOk: "Thanks! We'll get back to you soon.",
    contactFail: "We couldn't send your message. Please try again.",
    title: "Stratum · What are you missing to sell to Walmart?",
    links: (n) => `${n} links`,
    locked: "Fill in the form to unlock the links",
  },
};

let lang = "es";
const ES = {};
const I18N_EVENTS = [];
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
  captureSpanish();
  initNav();
  initAssessmentLinks();
  initSignup();
  initContact();
  initGuide();
  initInsights();
  initHub();
  initMonth();
  initReveal();
  initScoreRing();
  initLang();
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
});

// ---- Language --------------------------------------------------------------
function captureSpanish() {
  document.querySelectorAll("[data-i18n]").forEach((el) => { ES[el.dataset.i18n] ??= el.innerHTML; });
  document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    el.dataset.i18nAttr.split(",").forEach((pair) => {
      const [attr, key] = pair.split(":");
      ES[key] ??= el.getAttribute(attr);
    });
  });
  ES.menuClose = "Cerrar menú";
  ES.insPlay = "Reproducir";
  ES.insPause = "Pausar";
}

function readStoredLang() {
  const q = new URLSearchParams(location.search).get("lang");
  if (q === "es" || q === "en") return q;
  try { const s = localStorage.getItem(LANG_KEY); if (s === "es" || s === "en") return s; } catch (e) { /* storage blocked */ }
  return "es";
}

function initLang() {
  document.querySelectorAll(".lang-toggle button").forEach((b) => {
    b.addEventListener("click", () => setLang(b.dataset.lang, true));
  });
  setLang(readStoredLang(), false);
}

function setLang(next, remember) {
  lang = next;
  const dict = next === "en" ? EN : ES;
  document.documentElement.lang = next;
  // pages can override their title per language with data-title-es / data-title-en on <body>
  document.title = document.body.dataset[next === "en" ? "titleEn" : "titleEs"] || MSG[next].title;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const v = dict[el.dataset.i18n];
    if (v != null) el.innerHTML = v;
  });
  document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    el.dataset.i18nAttr.split(",").forEach((pair) => {
      const [attr, key] = pair.split(":");
      if (dict[key] != null) el.setAttribute(attr, dict[key]);
    });
  });
  document.querySelectorAll(".lang-toggle button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === next)));
  // Remembering the language is a "preferences" use of storage: only with consent.
  if (remember && window.StratumConsent?.allows("preferences")) {
    try { localStorage.setItem(LANG_KEY, next); } catch (e) { /* ignore */ }
  }
  I18N_EVENTS.forEach((fn) => fn(next));
}

const msg = (k) => MSG[lang][k];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---- Mobile nav ------------------------------------------------------------
function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.getElementById("nav-menu");
  if (!toggle || !menu) return;

  const label = toggle.querySelector(".sr-only");
  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    label.textContent = (lang === "en" ? EN : ES)[open ? "menuClose" : "menuOpen"];
    menu.classList.toggle("is-open", open);
  };

  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("is-open")) { setOpen(false); toggle.focus(); }
  });
  window.matchMedia("(min-width: 1101px)").addEventListener("change", (e) => { if (e.matches) setOpen(false); });
}

// ---- Assessment CTAs (carry the chosen language across) --------------------
function initAssessmentLinks() {
  I18N_EVENTS.push(() => {
    document.querySelectorAll("[data-assessment-link]").forEach((a) => {
      a.href = CONFIG.assessmentUrl + (CONFIG.assessmentUrl.includes("?") ? "&" : "?") + "lang=" + lang;
    });
  });
}

// ---- Shared form helpers ---------------------------------------------------
async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
}

function statusSetter(el, base) {
  return (text, kind) => { el.textContent = text || ""; el.className = base + (kind ? " is-" + kind : ""); };
}

// Marks empty/invalid required fields; returns the first bad one (or null).
function validate(form) {
  const req = [...form.querySelectorAll("[required]")];
  const bad = req.filter((el) => (el.type === "checkbox" ? !el.checked : !el.value.trim() || !el.checkValidity()));
  req.forEach((el) => el.toggleAttribute("aria-invalid", bad.includes(el)));
  return bad[0] || null;
}

async function submitForm({ form, button, show, endpoint, body, ok, fail, notReady }) {
  if (form.elements._gotcha.value) return; // bot
  if (!endpoint) {
    console.warn("[Stratum] Form endpoint is empty — set it in CONFIG in js/main.js.");
    show(msg(notReady), "error");
    return;
  }
  const label = button.textContent;
  button.disabled = true; button.textContent = msg("sending");
  try {
    await postJSON(endpoint, body);
    form.reset();
    show(msg(ok), "success");
  } catch (err) {
    console.error("[Stratum] form failed:", err);
    show(msg(fail), "error");
  } finally {
    button.disabled = false; button.textContent = label;
  }
}

// ---- Early-access signup ---------------------------------------------------
function initSignup() {
  const form = document.getElementById("signup-form");
  if (!form) return;
  const button = form.querySelector('button[type="submit"]');
  const show = statusSetter(document.getElementById("signup-status"), "signup-status");

  form.addEventListener("input", (e) => { e.target.removeAttribute("aria-invalid"); });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const bad = validate(form);
    if (bad) {
      show(msg(bad.type === "email" && bad.value ? "emailBad" : bad.type === "checkbox" ? "consentNeeded" : "missing"), "error");
      bad.focus();
      return;
    }
    const f = form.elements;
    submitForm({
      form, button, show, endpoint: CONFIG.signupEndpoint,
      body: {
        name: f.name.value.trim(), email: f.email.value.trim(), business: f.business.value.trim(),
        phone: f.phone.value.trim(), consent: true, consentAt: new Date().toISOString(), source: "landing", lang,
      },
      ok: "signupOk", fail: "signupFail", notReady: "notReady",
    });
  });
}

// ---- Contact dialog --------------------------------------------------------
function initContact() {
  const dialog = document.getElementById("contacto");
  const form = document.getElementById("contact-form");
  if (!dialog || !form) return;
  const show = statusSetter(document.getElementById("contact-status"), "contact-status");
  const button = form.querySelector('button[type="submit"]');

  const open = () => {
    show("");
    if (typeof dialog.showModal === "function") dialog.showModal(); else dialog.setAttribute("open", "");
    form.elements.name.focus();
  };
  document.querySelectorAll("[data-open-contact]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); open(); }));
  dialog.querySelector("[data-close-contact]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); }); // backdrop
  if (location.hash === "#contacto") open();

  form.addEventListener("input", (e) => { e.target.removeAttribute("aria-invalid"); });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const bad = validate(form);
    if (bad) { show(msg(bad.type === "email" && bad.value ? "emailBad" : "missing"), "error"); bad.focus(); return; }
    const f = form.elements;
    submitForm({
      form, button, show, endpoint: CONFIG.contactEndpoint,
      body: { name: f.name.value.trim(), email: f.email.value.trim(), business: f.business.value.trim(), message: f.message.value.trim(), lang },
      ok: "contactOk", fail: "contactFail", notReady: "contactNotReady",
    });
  });
}

// ---- Requirements guide: free, unlocked with a short form ------------------
// The links stay hidden until someone sends name, business and email.
// Remembered for the session (or across visits with "preferences" consent).
const GUIDE_KEY = "stratum-guide";
function guideUnlocked() {
  try { return sessionStorage.getItem(GUIDE_KEY) === "1" || localStorage.getItem(GUIDE_KEY) === "1"; } catch (e) { return false; }
}
function rememberGuide() {
  try {
    sessionStorage.setItem(GUIDE_KEY, "1");
    if (window.StratumConsent?.allows("preferences")) localStorage.setItem(GUIDE_KEY, "1");
  } catch (e) { /* storage blocked: unlocked for this page view only */ }
}

function initGuide() {
  const deck = document.getElementById("guide-deck");
  const shell = document.getElementById("deck-shell");
  const form = document.getElementById("guide-form");
  const done = document.getElementById("guide-done");
  const G = window.FSQMSGuide;
  if (!deck || !G) return;
  let unlocked = guideUnlocked();
  const chev = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
  const lock = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';

  const render = (l) => {
    shell.classList.toggle("is-locked", !unlocked);
    form.hidden = unlocked;
    done.hidden = !unlocked;
    const open = deck.querySelector("details[open]")?.dataset.tone;
    deck.innerHTML = G.GUIDE_GROUPS.map((g, i) => {
      const links = g.idx.map((j) => G.GUIDE[j]);
      const title = `<span class="deck-title"><b>${esc(g[l])}</b><small>${esc(MSG[l].links(links.length))}</small></span>`;
      if (!unlocked) {
        // preview only: group names and counts, no links in the page
        return `<div class="deck-card deck-${g.tone} is-locked" style="--z:${i}">
          <div class="deck-sum">${title}<span class="deck-chev" aria-hidden="true">${lock}</span></div>
        </div>`;
      }
      return `<details class="deck-card deck-${g.tone}" name="stratum-guide" data-tone="${g.tone}" style="--z:${i}" ${open === g.tone ? "open" : ""}>
        <summary>${title}<span class="deck-chev" aria-hidden="true">${chev}</span></summary>
        <ul class="deck-links">${links.map((x) => `
          <li><a href="${x[0]}" target="_blank" rel="noopener">
            <span class="dl-text"><b>${esc(x[1][l])}</b><small>${esc(x[2])}</small></span>
            <span class="dl-go" aria-hidden="true">↗</span>
          </a></li>`).join("")}</ul>
      </details>`;
    }).join("") + (unlocked ? "" : `<p class="deck-lock-note">${lock}${esc(MSG[l].locked)}</p>`);
  };

  if (form) {
    const button = form.querySelector('button[type="submit"]');
    const show = statusSetter(document.getElementById("guide-status"), "guide-status");
    form.addEventListener("input", (e) => { e.target.removeAttribute("aria-invalid"); });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const bad = validate(form);
      if (bad) { show(msg(bad.type === "email" && bad.value ? "emailBad" : "missing"), "error"); bad.focus(); return; }
      if (form.elements._gotcha.value) return; // bot
      const f = form.elements;
      const body = {
        name: f.name.value.trim(), business: f.business.value.trim(), email: f.email.value.trim(),
        phone: f.phone.value.trim(), updates: f.updates.checked, source: "guide", lang,
      };
      if (!CONFIG.guideEndpoint) {
        // Still unlock so the page is usable in development, but make the gap obvious.
        console.warn("[Stratum] CONFIG.guideEndpoint is empty — guide leads are NOT being saved.", body);
      } else {
        const label = button.textContent;
        button.disabled = true; button.textContent = msg("sending");
        try { await postJSON(CONFIG.guideEndpoint, body); }
        catch (err) { console.error("[Stratum] guide lead failed to send:", err); } // don't block the visitor
        finally { button.disabled = false; button.textContent = label; }
      }
      unlocked = true;
      rememberGuide();
      render(lang);
      deck.querySelector("summary")?.focus();
    });
  }
  I18N_EVENTS.push(render);
}

// ---- Industry insights carousel -------------------------------------------
function initInsights() {
  const box = document.querySelector(".insights");
  if (!box) return;
  const stage = box.querySelector(".ins-stage");
  const tabs = box.querySelector(".ins-tabs");
  const DWELL = 5000;
  let i = 0, timer = null;

  const slide = (d, l) => `
    <div class="ins-slide" data-i="${d}">
      <div class="ins-num"><b>${INSIGHTS[d].pct}</b><span>%</span></div>
      <p class="ins-text">${esc(INSIGHTS[d][l])}</p>
    </div>`;

  const render = (l) => {
    stage.innerHTML = INSIGHTS.map((_, d) => slide(d, l)).join("");
    tabs.innerHTML = INSIGHTS.map((x, d) => `<button type="button" role="tab" aria-label="${x.pct}% · ${esc(x[l])}" data-go="${d}"><i></i></button>`).join("");
    show(i, true);
  };

  function show(n, instant) {
    i = (n + INSIGHTS.length) % INSIGHTS.length;
    stage.querySelectorAll(".ins-slide").forEach((s, d) => s.classList.toggle("is-active", d === i));
    tabs.querySelectorAll("button").forEach((b, d) => {
      b.setAttribute("aria-selected", String(d === i));
      b.classList.toggle("done", d < i);
      // restart the progress bar on the active tab
      const bar = b.querySelector("i");
      bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = "";
    });
    clearTimeout(timer);
    timer = setTimeout(() => show(i + 1), DWELL);
  }

  tabs.addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b) show(+b.dataset.go); });
  I18N_EVENTS.push(render);
}

// ---- Problem diagram: ten tools → one Stratum hub ---------------------------
// Each node starts grey, scattered, labelled with the tool it replaces
// ("before"), then settles into the ring, connects to the hub and shows its
// module name ("after"). CSS drives the timing; default styles = final state,
// so reduced-motion visitors just see the connected diagram.
const HUB_ICONS = {
  users: '<path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1"/><path d="M16 4.5a3 3 0 0 1 0 5.8M21 20v-1a4 4 0 0 0-3-3.9"/>',
  truck: '<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  box: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
  stack: '<rect x="4" y="4" width="16" height="5" rx="1"/><rect x="4" y="11" width="16" height="5" rx="1"/><path d="M8 20h8"/>',
  thermo: '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/><path d="M12 11v6"/>',
  spray: '<path d="M8 10h6v11H8z"/><path d="M9 10V7h4v3M13 7h3l2-2M18 9h2M18 12h2M17 6l1.5-1.5"/>',
  file: '<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/><path d="M9 13h6M9 17h6"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5"/>',
  check: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 12l2.5 2.5L16 9.5"/>',
  shield: '<path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
  capa: '<path d="M9 3h6v3H9z"/><path d="M9 4.5H7a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6.5a2 2 0 0 0-2-2h-2"/><path d="M12 10v4M12 17.5h.01"/>',
};
const HUB_NODES = [
  { icon: "users",  es: "Suplidores", en: "Suppliers", oldEs: "COAs por correo",      oldEn: "COAs by email" },
  { icon: "truck",  es: "Recibo",     en: "Receiving", oldEs: "Recibo en papel",      oldEn: "Paper receiving" },
  { icon: "box",    es: "Lotes",      en: "Lots",      oldEs: "Excel de lotes",       oldEn: "Lots in Excel" },
  { icon: "stack",  es: "Inventario", en: "Inventory", oldEs: "Inventario aparte",    oldEn: "Separate inventory" },
  { icon: "capa",   es: "CAPAs",      en: "CAPAs",     oldEs: "Hallazgos en Excel",   oldEn: "Findings in Excel" },
  { icon: "file",   es: "Documentos", en: "Documents", oldEs: "Documentos en Drive",  oldEn: "Documents in Drive" },
  { icon: "shield", es: "Auditorías", en: "Audits",    oldEs: "Carpeta de auditoría", oldEn: "Audit binder" },
];
const HUB_TONES = ["#1E2B7E", "#266AB2", "#5FA3DA", "#D9CF6E"]; // navy, blue, sky, sand

function initHub() {
  const box = document.getElementById("hub-diagram");
  if (!box) return;
  const R = 40; // ring radius, % of the square stage
  const n = HUB_NODES.length;
  const pos = HUB_NODES.map((_, i) => {
    const a = (-90 + (360 / n) * i) * Math.PI / 180;
    return { x: 50 + Math.cos(a) * R, y: 50 + Math.sin(a) * R };
  });
  // "Before" state: each tool has a cable stub that stops short of the center, ending in a red ✕.
  const CUT = 0.42; // how far along node→center the broken stub reaches
  const cut = pos.map((p) => ({ x: p.x + (50 - p.x) * CUT, y: p.y + (50 - p.y) * CUT }));

  const render = (l) => {
    const T = l === "en"
      ? { before: "Today: disconnected systems that don't talk to each other", after: "With Stratum: everything connected in one record" }
      : { before: "Hoy: sistemas desconectados que no se hablan entre sí", after: "Con Stratum: todo conectado en un solo expediente" };
    box.innerHTML = `
      <div class="hub-stage">
        <svg class="hub-lines" viewBox="0 0 100 100" aria-hidden="true">
          <circle class="hub-orbit" cx="50" cy="50" r="${R}"/>
          ${pos.map((p, i) => `
            <line class="stub" style="--i:${i}" x1="${p.x.toFixed(2)}" y1="${p.y.toFixed(2)}" x2="${cut[i].x.toFixed(2)}" y2="${cut[i].y.toFixed(2)}"/>
            <g class="cut" style="--i:${i}" transform="translate(${cut[i].x.toFixed(2)} ${cut[i].y.toFixed(2)})">
              <circle r="2.1"/><path d="M-.9 -.9 L.9 .9 M.9 -.9 L-.9 .9"/>
            </g>
            <line class="spoke" style="--i:${i}" pathLength="1" x1="50" y1="50" x2="${p.x.toFixed(2)}" y2="${p.y.toFixed(2)}"/>
            <line class="flow" style="--i:${i}" x1="${p.x.toFixed(2)}" y1="${p.y.toFixed(2)}" x2="50" y2="50"/>`).join("")}
          <circle class="gear" cx="50" cy="50" r="14.5"/>
        </svg>
        <div class="hub-core" aria-hidden="true"><img src="assets/stratum-logo-2.png" alt="" width="3834" height="720"></div>
        ${HUB_NODES.map((nd, i) => {
          // Scattered before-state: offsets follow each node's own direction (in/out along its
          // spoke + a small sideways nudge) so tiles look messy without overlapping.
          const ang = (-90 + (360 / n) * i) * Math.PI / 180;
          const radial = [-24, 20, -16, -20, -20, 18, -16][i % 7];
          const side = [10, -12, 12, -10, 10, -12, 10][i % 7];
          const dx = Math.round(Math.cos(ang) * radial - Math.sin(ang) * side);
          const dy = Math.round(Math.sin(ang) * radial + Math.cos(ang) * side);
          const rot = [-8, 7, -6, 9, -7, 6, -9][i % 7];
          return `<div class="hub-node" aria-hidden="true" style="left:${pos[i].x.toFixed(2)}%;top:${pos[i].y.toFixed(2)}%;--i:${i};--c:${HUB_TONES[i % 4]};--ic:${i % 4 === 3 ? "#1E2B7E" : "#fff"};--dx:${dx}px;--dy:${dy}px;--rot:${rot}deg">
            <span class="n-tile"><svg viewBox="0 0 24 24">${HUB_ICONS[nd.icon]}</svg></span>
            <span class="n-label"><b class="n-new">${esc(nd[l])}</b><span class="n-old">${esc(l === "en" ? nd.oldEn : nd.oldEs)}</span></span>
          </div>`;
        }).join("")}
      </div>
      <p class="hub-caption"><span class="cap-before">${esc(T.before)}</span><span class="cap-after">${esc(T.after)}</span></p>`;
  };
  I18N_EVENTS.push(render);

  // Loop: play the before → after story, hold the connected state, fade, replay.
  // Only while the diagram is on screen; no loop for reduced motion (CSS shows the final state).
  if (REDUCED || !("IntersectionObserver" in window)) return;
  const CYCLE = 11000, FADE = 450;
  let timer = null, fadeTimer = null;
  const play = () => {
    box.classList.remove("hub-fade", "play");
    void box.offsetWidth; // restart CSS animations
    box.classList.add("play");
    fadeTimer = setTimeout(() => box.classList.add("hub-fade"), CYCLE - FADE);
    timer = setTimeout(play, CYCLE);
  };
  const stop = () => { clearTimeout(timer); clearTimeout(fadeTimer); timer = null; };
  new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { if (!timer) play(); } else { stop(); box.classList.remove("hub-fade"); } });
  }, { threshold: 0.35 }).observe(box);
}

// ---- Current month in the StratAI sample answer ---------------------------
function initMonth() {
  I18N_EVENTS.push((l) => {
    const m = new Date().toLocaleString(l === "en" ? "en-US" : "es-PR", { month: "long" });
    document.querySelectorAll("[data-month]").forEach((el) => { el.textContent = l === "en" ? m : m.toLowerCase(); });
  });
}

// ---- Scroll reveal ---------------------------------------------------------
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      io.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });
  items.forEach((el) => io.observe(el));
}

// ---- Hero score ring -------------------------------------------------------
function initScoreRing() {
  const ring = document.querySelector(".score-ring");
  if (ring) requestAnimationFrame(() => requestAnimationFrame(() => ring.classList.add("is-filled")));
}
