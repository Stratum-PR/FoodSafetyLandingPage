/* Stratum self-check — ported from the "Autoevaluación Walmart (prueba)" artifact. */
(function(){
const TEST_MODE = true;      // nothing is stored while true
const REQUIRE   = false;     // answers optional while validating the flow
const SUBMIT_URL = "";       // Vercel endpoint later

const CHECK = '<svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const TICK  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

/* ---------------- copy ---------------- */
const T={
 es:{
  back:"‹ Atrás", test:"Versión de prueba · no se guardan respuestas",
  brand:"Stratum PR",
  h1:"¿Qué te falta para vender en Walmart?",
  lede:"En unos 3 minutos recibes tu puntuación y tu lista de pendientes, basadas en los requisitos oficiales de Walmart y la FDA.",
  otherLabel:"Cuéntanos qué tipo de negocio tienes",
  introSteps:["Contesta 5 pasos cortos sobre tu negocio","Al final, dinos a nombre de quién emitimos tu pasaporte","Recibe tu puntuación, pendientes y guía oficial"],
  contactKicker:"Último paso", contactTitle:"¿A nombre de quién emitimos tu pasaporte?",
  contactLead:"Lo usamos para personalizar tu pasaporte y enviarte tus resultados.",
  seePassport:"Ver mi pasaporte", contactMissing:"Completa tu nombre, negocio y correo electrónico.", contactEmailBad:"Escribe un correo electrónico válido.",
  name:"Nombre", biz:"Negocio", email:"Correo electrónico", phone:"Teléfono (opcional)",
  privacy:"Solo usamos tus datos para enviarte tus resultados y darte seguimiento.", privacyLink:"Política de privacidad",
  start:"Comenzar", next:"Continuar", finish:"Ver mis resultados",
  steps:["Tu negocio","Para ser suplidor","Inocuidad","Suplidores y trazabilidad","Seguro y seguimiento"],
  results:"Tu pasaporte Walmart", pts:"puntos",
  tiers:{ready:["Listo","Estás bien posicionado. Mantén todo al día."],
         close:["Cerca","Te faltan requisitos clave. Empieza por los marcados como prioridad."],
         gaps:["Brechas importantes","Tienes trabajo por delante, pero es alcanzable. Empieza por la lista de abajo."]},
  pend:"Pendientes", haveH:"Ya tienes", nothing:"No tienes pendientes. Revisa que todo siga vigente cada año.",
  prio:"Prioridad", source:"Fuente oficial",
  labBtn:"Conéctenme con un laboratorio", labDone:"Te conectaremos con un laboratorio acreditado.",
  dpH:"Revisión gratis", dpAsk:"Revisamos tus pendientes contigo en 20 minutos y te invitamos a probar Stratum como socio de diseño.",
  dpBtn:"Quiero la revisión", dpDone:"Listo. Te escribiremos pronto para coordinar la revisión.",
  restart:"Empezar de nuevo", free:"Gratis", mins:"3 minutos", official:"Basado en requisitos oficiales",
  stepOf:(a,b)=>`Paso ${a} de ${b}`,
  giftH:"Tu regalo", giftT:"Guía de enlaces oficiales para suplir a Walmart: cada requisito con su fuente oficial.", giftBtn:"Ver la guía", giftHide:"Ocultar la guía",
  calcH:"Calculadora de precios", calcTag:"Gratis para ti", calcT:"Calcula tu costo por unidad y el precio mínimo que puedes ofrecerle a Walmart.",
  cf:["Ingredientes y empaque","Mano de obra","Gastos generales","Transporte al centro de distribución","Margen que quieres ganar"],
  cost:"Costo por unidad", minPrice:"Precio mínimo a Walmart", calcNote:"Deja espacio para descuentos, promociones y cargos por incumplimiento. Todo por unidad.",
  simLabel:"Nombre de tu producto", simPh:"Ej. galletas de coco, salsa picante...", simCta:"Ver productos similares",
  simTitle:n=>`Productos similares a "${n}"`, simRange:"Rango de precio en tienda", simNoMatch:"No encontramos una categoría parecida todavía. Prueba con otra palabra, como el tipo de producto (galleta, salsa, jugo...).",
  simMock:"Datos de ejemplo, no precios reales de Walmart", simHint:"Compara tu precio con lo que se vende hoy en Walmart. Cuando conectemos el catálogo de Walmart, esto se actualizará con productos reales.",
  simFit:["Tu precio está por debajo del rango: hay espacio para el margen del detallista.","Tu precio está dentro del rango de venta al público, así que puede que no quede margen para Walmart.","Tu precio está por encima de lo que se vende hoy: revisa tu costo o tu posicionamiento."],
  disc:"Stratum PR no está afiliado con Walmart. Los requisitos varían por categoría de producto; confírmalos con tu comprador. Fuentes verificadas el 21 de septiembre de 2026.",
  bizFallback:"tu negocio"
 },
 en:{
  back:"‹ Back", test:"Test version · answers aren't saved",
  brand:"Stratum PR",
  h1:"What are you missing to sell to Walmart?",
  lede:"In about 3 minutes, get your score and gap list, based on Walmart's and the FDA's official requirements.",
  otherLabel:"Tell us what kind of business you have",
  introSteps:["Answer 5 short steps about your business","At the end, tell us who the passport is issued to","Get your score, to-do list and official guide"],
  contactKicker:"Last step", contactTitle:"Who should we issue your passport to?",
  contactLead:"We use this to personalize your passport and send you your results.",
  seePassport:"See my passport", contactMissing:"Please fill in your name, business and email.", contactEmailBad:"Enter a valid email address.",
  name:"Name", biz:"Business", email:"Email", phone:"Phone (optional)",
  privacy:"We only use your details to send your results and follow up.", privacyLink:"Privacy Policy",
  start:"Start", next:"Continue", finish:"See my results",
  steps:["Your business","Becoming a supplier","Food safety","Suppliers and traceability","Insurance and follow-up"],
  results:"Your Walmart passport", pts:"points",
  tiers:{ready:["Ready","You're well positioned. Keep everything current."],
         close:["Close","You're missing key requirements. Start with the ones marked priority."],
         gaps:["Significant gaps","You have work ahead, but it's doable. Start with the list below."]},
  pend:"To do", haveH:"Already done", nothing:"Nothing pending. Check that everything stays current each year.",
  prio:"Priority", source:"Official source",
  labBtn:"Connect me with a lab", labDone:"We'll connect you with an accredited lab.",
  dpH:"Free review", dpAsk:"We'll go over your gaps with you in 20 minutes and invite you to try Stratum as a design partner.",
  dpBtn:"I want the review", dpDone:"Done. We'll be in touch soon to schedule it.",
  restart:"Start over", free:"Free", mins:"3 minutes", official:"Based on official requirements",
  stepOf:(a,b)=>`Step ${a} of ${b}`,
  giftH:"Your gift", giftT:"Official link pack for selling to Walmart: every requirement with its official source.", giftBtn:"View the guide", giftHide:"Hide the guide",
  calcH:"Pricing calculator", calcTag:"Free for you", calcT:"Work out your cost per unit and the minimum price you can offer Walmart.",
  cf:["Ingredients and packaging","Labor","Overhead","Freight to the distribution center","Margin you want"],
  simLabel:"Your product's name", simPh:"E.g. coconut cookies, hot sauce...", simCta:"See similar products",
  simTitle:n=>`Products similar to "${n}"`, simRange:"In-store price range", simNoMatch:"We couldn't find a close category yet. Try another word, like the product type (cookie, sauce, juice...).",
  simMock:"Sample data, not real Walmart prices", simHint:"Compare your price with what's selling today at Walmart. Once we connect Walmart's catalog, this will update with real products.",
  simFit:["Your price is below the range: there's room for the retailer's margin.","Your price sits inside the retail range, so there may be no margin left for Walmart.","Your price is above what sells today: check your cost or your positioning."],
  cost:"Cost per unit", minPrice:"Minimum price to Walmart", calcNote:"Leave room for allowances, promotions and compliance chargebacks. All per unit.",
  disc:"Stratum PR is not affiliated with Walmart. Requirements vary by product category; confirm them with your buyer. Sources verified September 21, 2026.",
  bizFallback:"your business"
 }
};

/* ---------------- passport copy ---------------- */
Object.assign(T.es,{
  passTitle:"Pasaporte Walmart", passNo:"Nº", holder:"Titular", issued:"Emitido", origin:"Tu negocio", dest:"Walmart",
  routeLabel:p=>`Ruta a Walmart: ${p}% completada`, priorities:"Prioridades", stampsH:"Sellos", stampOk:"Aprobado",
  secNames:{1:"Registro",2:"Inocuidad",3:"Trazabilidad",4:"Seguro"},
  save:"Guardar mi pasaporte (PDF)", listH:"Tu lista de pendientes", listSub:n=>`${n} por completar · empieza por las prioridades`,
  doneTag:"Listo", filterLabel:"Filtrar por sección", all:"Todos", toCalc:"Usar la calculadora",
  guideTitle:"Guía de enlaces oficiales", guideSub:n=>`${n} fuentes oficiales para suplir a Walmart · verificadas el 21 sep 2026`,
  linksN:n=>`${n} enlaces`, forYouN:n=>`${n} para tus pendientes`, forYou:"Para ti"
});
Object.assign(T.en,{
  passTitle:"Walmart Passport", passNo:"No.", holder:"Holder", issued:"Issued", origin:"Your business", dest:"Walmart",
  routeLabel:p=>`Route to Walmart: ${p}% complete`, priorities:"Priorities", stampsH:"Stamps", stampOk:"Approved",
  secNames:{1:"Registration",2:"Food safety",3:"Traceability",4:"Insurance"},
  save:"Save my passport (PDF)", listH:"Your to-do list", listSub:n=>`${n} to go · start with the priorities`,
  doneTag:"Done", filterLabel:"Filter by section", all:"All", toCalc:"Use the calculator",
  guideTitle:"Official links guide", guideSub:n=>`${n} official sources for supplying Walmart · verified Sep 21, 2026`,
  linksN:n=>`${n} links`, forYouN:n=>`${n} for your to-dos`, forYou:"For you"
});

/* ---------------- scored items (the 16 requirements) ---------------- */
const ITEMS={
 ein:{block:1,sec:1,es:["EIN","Solicítalo gratis en IRS.gov; se emite al instante."],en:["EIN","Apply free at IRS.gov; it's issued instantly."],url:"https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online"},
 duns:{block:1,sec:1,es:["Número D-U-N-S","Gratis, pero puede tardar hasta 30 días laborables. Solicítalo ya."],en:["D-U-N-S number","Free, but can take up to 30 business days. Request it now."],url:"https://www.dnb.com/duns/get-a-duns.html"},
 gs1:{block:1,sec:1,es:["Membresía GS1 y códigos UPC","Afíliate a GS1 US. No uses códigos comprados a terceros."],en:["GS1 membership and UPCs","Join GS1 US. Don't use barcodes bought from resellers."],url:"https://www.gs1us.org"},
 edi:{sec:1,es:["EDI","Contrata un proveedor de EDI; muchos ofrecen Web EDI para negocios pequeños."],en:["EDI","Hire an EDI provider; many offer Web EDI for small businesses."],url:"https://corporate.walmart.com/suppliers"},
 origin:{sec:1,es:["Hecho en PR/EE.UU.","Revisa la guía Made in USA de la FTC: el producto debe ser hecho todo o casi todo en EE.UU."],en:["Made in PR/USA","Review the FTC's Made in USA guidance: the product must be all or virtually all made in the US."],url:"https://www.ftc.gov/business-guidance/resources/complying-made-usa-standard"},
 price:{sec:1,es:["Costo, margen y precio","Calcula tu costo total por unidad, tu margen de ganancia y tu precio a Walmart, incluyendo el transporte al centro de distribución."],en:["Cost, margin and price","Work out your full cost per unit, your profit margin and your price to Walmart, including freight to the distribution center."]},
 gfsi:{block:1,sec:2,es:["Auditoría de inocuidad","Walmart no acepta inspecciones de FDA, USDA o agencias locales en su lugar. Pregunta qué auditoría aplica a tu categoría."],en:["Food safety audit","Walmart doesn't accept FDA, USDA or local inspections instead. Ask which audit applies to your category."],url:"https://enablement.walmart.com/content/food-safety/en_us/food-safety-requirements/national-branded-products/all-other-commodities.html"},
 fda:{sec:2,es:["Registro FDA","Regístrate o renueva en el portal de la FDA. La renovación es del 1 de octubre al 31 de diciembre de 2026."],en:["FDA registration","Register or renew on the FDA portal. Renewal runs October 1 to December 31, 2026."],url:"https://www.fda.gov/food/online-registration-food-facilities/food-facility-registration-user-guide-biennial-registration-renewal"},
 pcqi:{sec:2,es:["Plan de inocuidad (PCQI)","Toma el curso de Controles Preventivos de la FSPCA para preparar tu plan."],en:["Food safety plan (PCQI)","Take the FSPCA Preventive Controls course to prepare your plan."],url:"https://www.fspca.net"},
 lab:{sec:2,lab:1,es:["Laboratorio independiente","Busca un laboratorio acreditado ISO/IEC 17025. Walmart puede pedir pruebas de terceros."],en:["Independent lab","Find an ISO/IEC 17025 accredited lab. Walmart may ask for third-party testing."],url:"https://www.a2la.org"},
 recall:{sec:2,es:["Plan de recall","Escribe tu plan y haz un simulacro rastreando un lote real de principio a fin."],en:["Recall plan","Write your plan and run a mock recall on a real lot, end to end."]},
 sup:{sec:3,es:["Certificados de suplidores","Pide certificados, COA y cartas de garantía a cada suplidor, y anota cuándo vencen."],en:["Supplier certificates","Ask each supplier for certificates, COAs and letters of guarantee, and note when they expire."]},
 trace:{sec:3,es:["Rastreo en 24 horas","Registra qué lote recibiste de quién y a quién enviaste cada lote."],en:["24-hour traceability","Record which lot came from whom, and where each lot went."],url:"https://www.fda.gov/food/food-safety-modernization-act-fsma/fsma-final-rule-requirements-additional-traceability-records-certain-foods"},
 labels:{sec:3,es:["Etiquetas y avisos de envío","Walmart ya lo exige a todos sus suplidores de alimentos. Coordínalo con tu proveedor de EDI."],en:["Labels and shipping notices","Walmart already requires this of all food suppliers. Set it up with your EDI provider."],url:"https://enablement.walmart.com/content/food-safety/en_us/food-safety-requirements/food-traceability.html"},
 ins:{block:1,sec:4,es:["Seguro","Pide a tu corredor el endoso que nombra a Walmart como asegurado adicional y confirma los límites."],en:["Insurance","Ask your broker for the endorsement naming Walmart as additional insured and confirm your limits."],url:"https://corporate.walmart.com/content/dam/corporate/documents/suppliers/requirements/insurance-requirements.pdf"},
 exp:{sec:4,es:["Control de vencimientos","Haz una lista de cada documento con su fecha de vencimiento. Esto es lo que Stratum automatiza."],en:["Expiration tracking","List every document with its expiration date. This is what Stratum automates."]}
};

const {GUIDE,GUIDE_GROUPS}=window.FSQMSGuide;
const P=window.FSQMSPricing;

/* ---------------- questions per step ----------------
   single: options carry [label, score] and feed one item
   multi : each option is an item, checked = 2 points         */
const STEPS=[
 [ // 0 prequal
  {id:"p1",type:"pick",es:"¿Vendes actualmente a Walmart o Sam's Club?",en:"Do you currently sell to Walmart or Sam's Club?",
   opts:{es:["Sí","No, pero quiero","No por ahora"],en:["Yes","No, but I want to","Not right now"]}},
  {id:"p2",type:"pick",showIf:()=>S.v.p1===1,es:"¿En qué etapa estás?",en:"What stage are you at?",
   opts:{es:["Me registré en Open Call 2026","Me invitaron a las reuniones","Pienso aplicar más adelante","Solo estoy explorando"],en:["Registered for Open Call 2026","Invited to the buyer meetings","Plan to apply later","Just exploring"]}},
  {id:"p3",type:"pick",es:"¿Qué tipo de negocio tienes?",en:"What kind of business do you have?",
   other:5,
   opts:{es:["Manufactura o procesamiento de alimentos","Agricultura, finca o pesca","Distribución o importación","Co-packer: manufacturo para otras marcas","Marca: otra empresa manufactura mi producto","Otro"],en:["Food manufacturing or processing","Farming, agriculture or fishing","Distribution or import","Co-packer: I manufacture for other brands","Brand: another company makes my product","Other"]}}
 ],
 [ // 1 becoming a supplier (skipped for current suppliers)
  {id:"reg",type:"multi",es:"¿Cuáles de estos ya tienes?",en:"Which of these do you already have?",
   help:{es:"Marca todos los que apliquen.",en:"Select all that apply."},
   items:[["ein",{es:"Número patronal federal (EIN)",en:"Federal tax ID (EIN)"}],
          ["duns",{es:"Número D-U-N-S",en:"D-U-N-S number"}],
          ["gs1",{es:"Membresía GS1 y códigos UPC",en:"GS1 membership and UPC barcodes"}],
          ["edi",{es:"EDI, propio o con un proveedor",en:"EDI, in-house or through a provider",sub:{es:"Así Walmart envía órdenes y recibe facturas y avisos de envío, de computadora a computadora.",en:"How Walmart sends orders and receives invoices and shipping notices, computer to computer."}}],
          ["origin",{es:"Producto hecho en PR/EE.UU. según la FTC",en:"Product made in PR/USA under FTC rules"}]]},
  {id:"price",type:"single",item:"price",es:"¿Conoces tu costo por unidad, tu margen de ganancia y el precio que le ofrecerías a Walmart?",en:"Do you know your cost per unit, your profit margin and the price you'd offer Walmart?",
   opts:{es:[["Sí, tengo claro mi costo, mi margen y mi precio",2],["Conozco mi costo, pero no mi margen",1],["Tengo un estimado",1],["Todavía no",0]],en:[["Yes, I know my cost, margin and price",2],["I know my cost, but not my margin",1],["I have an estimate",1],["Not yet",0]]}}
 ],
 [ // 2 food safety
  {id:"audit",type:"single",item:"gfsi",es:"¿Qué auditoría de inocuidad tienen las plantas que hacen tu producto?",en:"Which food safety audit do the sites that make your product have?",
   help:{es:"Incluye a los co-packers que manufacturan para ti. Se renueva cada año.",en:"Include co-packers. It renews every year."},
   opts:{es:[["Certificación GFSI (SQF, BRCGS o FSSC 22000)",2],["Auditoría aprobada por Walmart",2],["Está en proceso",1],["Ninguna o no sé",0]],en:[["GFSI certification (SQF, BRCGS or FSSC 22000)",2],["Walmart-approved audit",2],["In progress",1],["None or not sure",0]]}},
  {id:"safety",type:"multi",es:"¿Cuáles de estos tienes?",en:"Which of these do you have?",
   help:{es:"Marca todos los que apliquen.",en:"Select all that apply."},
   items:[["fda",{es:"Registro de planta con la FDA, al día",en:"FDA facility registration, current"}],
          ["pcqi",{es:"Plan de inocuidad escrito por un PCQI",en:"Food safety plan written by a PCQI",sub:{es:"Individuo Calificado en Controles Preventivos: completó el curso de la FSPCA o tiene experiencia equivalente.",en:"Preventive Controls Qualified Individual: completed the FSPCA course or has equivalent experience."}}],
          ["lab",{es:"Un laboratorio independiente para pruebas",en:"An independent lab for testing"}]]},
  {id:"recall",type:"single",item:"recall",es:"¿Cómo está tu plan de recall?",en:"Where is your recall plan?",
   opts:{es:[["Tengo plan e hice un simulacro este año",2],["Tengo plan, sin simulacro reciente",1],["No tengo plan",0]],en:[["I have a plan and ran a mock recall this year",2],["I have a plan, no recent mock recall",1],["No plan",0]]}}
 ],
 [ // 3 suppliers & traceability
  {id:"sup",type:"single",item:"sup",es:"¿Cuántos de tus suplidores de ingredientes y empaque te han dado certificados vigentes?",en:"How many of your ingredient and packaging suppliers have given you current certificates?",
   opts:{es:[["Todos",2],["La mayoría",1],["Pocos o ninguno",0],["No sé",0]],en:[["All of them",2],["Most",1],["Few or none",0],["Not sure",0]]}},
  {id:"trace",type:"single",item:"trace",es:"Si Walmart te pide rastrear un lote, ¿cuánto te tomaría saber de dónde vino y a quién lo enviaste?",en:"If Walmart asked you to trace a lot, how long would it take to know where it came from and where it went?",
   opts:{es:[["Menos de 24 horas",2],["De 1 a 3 días",1],["Más tiempo o no sé",0]],en:[["Under 24 hours",2],["1 to 3 days",1],["Longer or not sure",0]]}},
  {id:"labels",type:"single",item:"labels",es:"¿Tus paletas y cajas llevan lote y código GS1, y envías avisos de envío con datos de trazabilidad?",en:"Do your pallets and cases carry lot codes and GS1 barcodes, and do you send shipping notices with traceability data?",
   opts:{es:[["Sí",2],["En parte",1],["No o no sé",0]],en:[["Yes",2],["Partly",1],["No or not sure",0]]}}
 ],
 [ // 4 insurance & follow-up
  {id:"ins",type:"single",item:"ins",es:"¿Tu seguro de responsabilidad cumple los mínimos de Walmart y la nombra como asegurado adicional?",en:"Does your liability insurance meet Walmart's minimums and name it as additional insured?",
   opts:{es:[["Sí, cumple y nombra a Walmart",2],["Tengo seguro, no sé si cumple",1],["No tengo seguro",0]],en:[["Yes, it meets them and names Walmart",2],["I have insurance, not sure it qualifies",1],["No insurance",0]]}},
  {id:"exp",type:"single",item:"exp",es:"¿Cómo controlas cuándo vencen tus certificados y documentos?",en:"How do you track when your certificates and documents expire?",
   opts:{es:[["Sistema o calendario con alertas",2],["Excel o papel",1],["No lo controlo",0]],en:[["A system or calendar with alerts",2],["Spreadsheet or paper",1],["I don't track it",0]]}},
  {id:"dp",type:"pick",es:"¿Quieres ser socio de diseño de Stratum?",en:"Want to be a Stratum design partner?",
   help:{es:"Incluye una revisión gratis de 20 minutos de tus pendientes y acceso temprano.",en:"Includes a free 20-minute review of your gaps and early access."},
   opts:{es:["Sí, me interesa","No por ahora"],en:["Yes, I'm interested","Not right now"]}}
 ]
];

/* ---------------- state ---------------- */
const S={lang:"es",screen:"intro",step:0,c:{},v:{},m:{},lab:false,anim:true,gift:false,calc:["","","","","30"],simQ:"",simOpen:false};
const app=document.getElementById("app"), primary=document.getElementById("primary"), backBtn=document.getElementById("back");
const t=k=>T[S.lang][k];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const supplier=()=>S.v.p1===0;
const stepList=()=>supplier()?[0,2,3,4]:[0,1,2,3,4];

/* item score from answers */
function itemScore(key){
  if(key in S.m) return S.m[key]?2:0;
  for(const st of STEPS) for(const q of st){
    if(q.type==="single" && q.item===key && S.v[q.id]!=null) return q.opts.es[S.v[q.id]][1];
  }
  return 0;
}
function activeItems(){ return Object.keys(ITEMS).filter(k=>!(supplier() && ITEMS[k].sec===1)); }
function score(){
  const ks=activeItems(); let pts=0,blk=0;
  ks.forEach(k=>{const s=itemScore(k); pts+=s; if(ITEMS[k].block && s<2) blk++;});
  const max=ks.length*2, pct=max?pts*100/max:0;
  const tier=pct<50?"gaps":(pct>=80&&blk===0)?"ready":"close";
  return {pts,max,pct,blk,tier};
}

/* ---------------- render ---------------- */
function progress(all){
  if(all) return `<div class="progress" aria-label="5/5">${[0,1,2,3,4].map(()=>'<i class="on"></i>').join("")}</div>`;
  const list=stepList(), pos=list.indexOf(S.step);
  // always 5 segments; a skipped step counts as done
  const done = supplier() ? (S.step===0?0:pos+1) : pos;
  return `<div class="progress" aria-label="${pos+1}/${list.length}">${[0,1,2,3,4].map(i=>`<i class="${i<=done?'on':''}"></i>`).join("")}</div>`;
}
function rowPick(q,i,label,sub){
  const on=S.v[q.id]===i;
  return `<button type="button" class="row" role="radio" aria-checked="${on}" data-q="${q.id}" data-i="${i}">
    <span class="t">${esc(label)}${sub?`<small>${esc(sub)}</small>`:""}</span>${CHECK}</button>`;
}
function renderIntro(){
  const c=S.c;
  app.innerHTML=`<div class="screen ${S.anim?'enter':''}">
   <div class="cover">
    <div class="chips"><span class="chip">${esc(t("free"))}</span><span class="chip ghost">${esc(t("mins"))}</span><span class="chip ghost">${esc(t("official"))}</span></div>
    <h1>${esc(t("h1"))}</h1>
    <p>${esc(t("lede"))}</p>
   </div>
   <ol class="intro-steps">
    ${t("introSteps").map((s,i)=>`<li><b>${i+1}</b><span>${esc(s)}</span></li>`).join("")}
   </ol>
   <p class="fine"><span class="testpill">${esc(t("test"))}</span></p></div>`;
  primary.textContent=t("start");
  backBtn.classList.remove("show");
}
/* Last step before the passport: who it's issued to. */
function renderContact(){
  const c=S.c;
  app.innerHTML=`<div class="screen ${S.anim?'enter':''}">${progress(true)}
   <div class="step-head"><p class="step-kicker">${esc(t("contactKicker"))}</p><h2 class="step">${esc(t("contactTitle"))}</h2></div>
   <p class="qhelp contact-lead">${esc(t("contactLead"))}</p>
   <div class="group">
    <label class="field"><span>${esc(t("name"))}</span><input id="f-name" autocomplete="name" required value="${esc(c.name||"")}"></label>
    <label class="field"><span>${esc(t("biz"))}</span><input id="f-biz" autocomplete="organization" required value="${esc(c.biz||"")}"></label>
    <label class="field"><span>${esc(t("email"))}</span><input id="f-email" type="email" inputmode="email" autocomplete="email" required value="${esc(c.email||"")}"></label>
    <label class="field"><span>${esc(t("phone"))}</span><input id="f-phone" type="tel" inputmode="tel" autocomplete="tel" value="${esc(c.phone||"")}"></label>
   </div>
   <p class="form-error" id="contact-error" role="alert"></p>
   <p class="fine">${esc(t("privacy"))} <a href="privacidad.html" target="_blank" rel="noopener">${esc(t("privacyLink"))}</a></p></div>`;
  primary.textContent=t("seePassport");
  backBtn.classList.add("show");
}
function renderStep(){
  const L=S.lang, qs=STEPS[S.step].filter(q=>!q.showIf||q.showIf());
  const last=S.step===4;
  const _l=stepList(); app.innerHTML=`<div class="screen ${S.anim?'enter':''}">${progress()}<div class="step-head"><p class="step-kicker">${esc(t("stepOf")(_l.indexOf(S.step)+1,_l.length))}</p><h2 class="step">${esc(t("steps")[S.step])}</h2></div>
   ${qs.map(q=>{
     let rows="";
     if(q.type==="pick") rows=q.opts[L].map((l,i)=>rowPick(q,i,l)).join("")
       +(q.other!=null&&S.v[q.id]===q.other?`<label class="field other-field"><span>${esc(t("otherLabel"))}</span><input data-other="${q.id}" value="${esc(S.v[q.id+"Other"]||"")}" maxlength="120"></label>`:"");
     if(q.type==="single") rows=q.opts[L].map((o,i)=>rowPick(q,i,o[0])).join("");
     if(q.type==="multi") rows=q.items.map(([k,lab])=>{
        const on=!!S.m[k];
        return `<button type="button" class="row multi" role="checkbox" aria-checked="${on}" data-m="${k}">
          <span class="box">${TICK}</span><span class="t">${esc(lab[L])}${lab.sub?`<small>${esc(lab.sub[L])}</small>`:""}</span></button>`;}).join("");
     return `<p class="qtitle">${esc(q[L])}</p>${q.help?`<p class="qhelp">${esc(q.help[L])}</p>`:""}
       <div class="group" role="${q.type==="multi"?"group":"radiogroup"}" aria-label="${esc(q[L])}">${rows}</div>`;
   }).join("")}</div>`;
  primary.textContent=last?t("finish"):t("next");
  backBtn.classList.add("show");
}
function renderResults(){
  const L=S.lang, r=score(), ks=activeItems();
  const pend=ks.filter(k=>itemScore(k)<2).sort((a,b)=>(ITEMS[b].block||0)-(ITEMS[a].block||0));
  const tier=t("tiers")[r.tier];
  const C=2*Math.PI*52, off=C*(1-r.pts/r.max);
  const biz=S.c.biz||t("bizFallback");
  const pct=Math.round(r.pct);
  const play=S.anim && !REDUCED();
  // one stamp per section the user was asked about
  const secs=[...new Set(ks.map(k=>ITEMS[k].sec))].sort();
  const stamps=secs.map((s,i)=>{
    const its=ks.filter(k=>ITEMS[k].sec===s), ok=its.filter(k=>itemScore(k)===2).length;
    return {s,ok,n:its.length,done:ok===its.length,rot:[-8,6,-4,9][i%4]};
  });
  const blockers=pend.filter(k=>ITEMS[k].block).length;
  const issued=new Date().toLocaleDateString(L==="es"?"es-PR":"en-US",{day:"numeric",month:"short",year:"numeric"});

  const showCalc=S.v.price===3;   // only for "Todavía no" on the price question
  const done=ks.filter(k=>itemScore(k)===2);
  const pendSecs=secs.filter(s=>pend.some(k=>ITEMS[k].sec===s));
  const pendUrls=new Set(pend.map(k=>ITEMS[k].url).filter(Boolean));
  const deck=GUIDE_GROUPS.map(g=>{
    const links=g.idx.map(i=>GUIDE[i]);
    return {...g,links,forYou:links.filter(l=>pendUrls.has(l[0])).length};
  });

  app.innerHTML=`<div class="screen ${S.anim?'enter':''}">
   <h2 class="sr-only">${esc(t("results"))}</h2>
   <div class="res">
   <aside class="res-side">
   <article class="pass ${play?'play':''}" style="--pct:${pct}">
    <header class="pass-top">
     <div class="pass-row">
      <img class="pass-logo" src="assets/stratum-logo-2.png" alt="Stratum" width="3834" height="720">
      <div class="pass-id"><span class="pass-title">${esc(t("passTitle"))}</span><span class="pass-no">${esc(t("passNo"))} ${passNumber()}</span></div>
     </div>
     <div class="pass-holder"><small>${esc(t("holder"))}</small><b>${esc(biz)}</b></div>
     <div class="route" role="img" aria-label="${esc(t("routeLabel")(pct))}">
      <div class="route-end"><b>PR</b><small>${esc(t("origin"))}</small></div>
      <div class="route-track"><i class="route-fill"></i><span class="route-mark" aria-hidden="true"><b id="route-pct">${play?0:pct}</b>%</span></div>
      <div class="route-end end"><b>WMT</b><small>${esc(t("dest"))}</small></div>
     </div>
    </header>

    <div class="pass-body">
     <div class="pass-score">
      <div class="ring" role="img" aria-label="${r.pts} / ${r.max} ${esc(t("pts"))}">
       <svg viewBox="0 0 120 120"><defs><linearGradient id="ringg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#266AB2"/><stop offset="1" stop-color="#1E2B7E"/></linearGradient></defs>
        <circle cx="60" cy="60" r="52" fill="none" stroke="#E2E5EC" stroke-width="11"/>
        <circle class="arc" cx="60" cy="60" r="52" fill="none" stroke="url(#ringg)" stroke-width="11" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${play?C:off}" data-off="${off}"/></svg>
       <div class="num"><div><b id="count">${play?0:r.pts}</b><small>/ ${r.max}</small></div></div>
      </div>
      <div class="tier">
       <span class="tier-pill tier-${r.tier}">${esc(tier[0])}</span>
       <p>${esc(tier[1])}</p>
      </div>
     </div>
     <dl class="pass-fields">
      <div><dt>${esc(t("pend"))}</dt><dd>${pend.length}</dd></div>
      <div><dt>${esc(t("priorities"))}</dt><dd>${blockers}</dd></div>
      <div><dt>${esc(t("issued"))}</dt><dd>${esc(issued)}</dd></div>
     </dl>
    </div>

    <div class="perf" aria-hidden="true"></div>

    <div class="pass-stamps">
     <p class="stamps-h">${esc(t("stampsH"))}</p>
     <ul class="stamps" style="--n:${stamps.length}">${stamps.map((st,i)=>`
      <li class="stamp ${st.done?'is-done':''}" style="--r:${st.rot}deg;--i:${i}">
       <span class="stamp-seal">${st.done?`${CHECK_SEAL}<em>${esc(t("stampOk"))}</em>`:`<b>${st.ok}/${st.n}</b>`}</span>
       <span class="stamp-name">${esc(t("secNames")[st.s])}</span>
      </li>`).join("")}</ul>
    </div>
   </article>
   <button type="button" class="save" data-act="print">${SAVE_ICON}${esc(t("save"))}</button>
   </aside>

   <div class="res-main">
   <section class="todo" aria-labelledby="todo-h">
    <div class="todo-top">
     <div>
      <h3 class="todo-h" id="todo-h">${esc(t("listH"))}</h3>
      <p class="todo-sub">${pend.length?esc(t("listSub")(pend.length)):esc(t("nothing"))}</p>
     </div>
     <div class="todo-meter" role="img" aria-label="${done.length} / ${ks.length}">
      <b>${done.length}<small>/${ks.length}</small></b>
      <span class="meter"><i style="width:${done.length/ks.length*100}%"></i></span>
     </div>
    </div>

    ${pendSecs.length>1?`<div class="filters" role="group" aria-label="${esc(t("filterLabel"))}">
     <button type="button" data-filter="all" aria-pressed="true">${esc(t("all"))} <span>${pend.length}</span></button>
     ${pendSecs.map(s=>`<button type="button" data-filter="${s}" aria-pressed="false">${esc(t("secNames")[s])} <span>${pend.filter(k=>ITEMS[k].sec===s).length}</span></button>`).join("")}
    </div>`:""}

    ${pend.length?`<ul class="tcards">${pend.map((k,i)=>{const it=ITEMS[k];return `
     <li class="tcard ${it.block?'is-prio':''}" data-sec="${it.sec}" style="--i:${i}">
      <div class="tcard-top"><span class="tcard-sec">${esc(t("secNames")[it.sec])}</span>${it.block?`<span class="badge">${esc(t("prio"))}</span>`:""}</div>
      <h4>${esc(it[L][0])}</h4>
      <p>${esc(it[L][1])}</p>
      <div class="tcard-foot">
       ${it.url?`<a href="${it.url}" target="_blank" rel="noopener">${esc(t("source"))} ↗</a>`:""}
       ${k==="price"&&showCalc?`<a href="#calc">${esc(t("toCalc"))} ↓</a>`:""}
       ${it.lab?(S.lab?`<span class="ok">${esc(t("labDone"))}</span>`:`<button type="button" class="mini" data-act="lab">${esc(t("labBtn"))}</button>`):""}
      </div>
     </li>`;}).join("")}</ul>`:""}

    ${done.length?`<div class="done-row">
     <p class="done-h">${esc(t("haveH"))} · ${done.length}</p>
     <ul class="done-chips">${done.map(k=>`<li data-sec="${ITEMS[k].sec}">${TICK}${esc(ITEMS[k][L][0])}</li>`).join("")}</ul>
    </div>`:""}
   </section>

   ${showCalc?`<div class="calc" id="calc">
     <h3>${esc(t("calcH"))}<span class="tag">${esc(t("calcTag"))}</span></h3>
     <p>${esc(t("calcT"))}</p>
     ${t("cf").map((l,i)=>`<div class="cf"><label for="c${i}">${esc(l)}</label><div class="in">${i<4?'<span class="u">$</span>':''}<input id="c${i}" data-c="${i}" inputmode="decimal" placeholder="0" value="${esc(S.calc[i])}">${i===4?'<span class="u">%</span>':''}</div></div>`).join("")}
     <div class="out"><div><small>${esc(t("cost"))}</small><b id="o-cost">$0.00</b></div><div class="main"><small>${esc(t("minPrice"))}</small><b id="o-price">$0.00</b></div></div>
     <p class="fine">${esc(t("calcNote"))}</p>
     <div class="simbox">
       <label class="simlabel" for="simq">${esc(t("simLabel"))}</label>
       <div class="simrow"><input id="simq" placeholder="${esc(t("simPh"))}" value="${esc(S.simQ)}"><button type="button" class="mini" id="simbtn">${esc(t("simCta"))}</button></div>
       <div id="simout"></div>
     </div>
   </div>`:""}

   <section class="guide" aria-labelledby="guide-h">
    <div class="guide-head">
     <span class="guide-ico" aria-hidden="true">${GIFT_ICON}</span>
     <div>
      <p class="guide-eyebrow">${esc(t("giftH"))}</p>
      <h3 id="guide-h">${esc(t("guideTitle"))}</h3>
      <p class="guide-sub">${esc(t("guideSub")(GUIDE.length))}</p>
     </div>
    </div>
    <div class="deck">${deck.map((g,i)=>`
     <details class="deck-card deck-${g.tone}" name="fsqms-guide" style="--z:${i}">
      <summary>
       <span class="deck-title"><b>${esc(g[L])}</b><small>${esc(t("linksN")(g.links.length))}</small></span>
       ${g.forYou?`<span class="deck-pill">${esc(t("forYouN")(g.forYou))}</span>`:""}
       <span class="deck-chev" aria-hidden="true">${CHEV}</span>
      </summary>
      <ul class="deck-links">${g.links.map(l=>`
       <li><a href="${l[0]}" target="_blank" rel="noopener">
        <span class="dl-text"><b>${esc(l[1][L])}</b><small>${esc(l[2])}</small></span>
        ${pendUrls.has(l[0])?`<span class="dl-for">${esc(t("forYou"))}</span>`:""}
        <span class="dl-go" aria-hidden="true">↗</span>
       </a></li>`).join("")}</ul>
     </details>`).join("")}
    </div>
   </section>

   <section class="review">
    <div>
     <h3>${esc(t("dpH"))}</h3>
     <p>${S.v.dp===0?esc(t("dpDone")):esc(t("dpAsk"))}</p>
    </div>
    ${S.v.dp===0?"":`<button type="button" class="btn-review" data-act="dp">${esc(t("dpBtn"))}</button>`}
   </section>

   <button type="button" class="link" data-act="restart">${esc(t("restart"))}</button>
   <p class="disc">${esc(t("disc"))}</p>
   </div>
   </div></div>`;
  document.getElementById("dock").hidden=true;
  backBtn.classList.add("show");
  if(play){
    // ring + route + count-up start together; stamps follow via CSS delays
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const a=app.querySelector(".arc"); if(a) a.style.strokeDashoffset=a.dataset.off;
      const rp=document.getElementById("route-pct"), el=document.getElementById("count"), t0=performance.now(), D=1100;
      const tick=now=>{const p=Math.min(1,(now-t0)/D), e=1-Math.pow(1-p,3); el.textContent=Math.round(r.pts*e); rp.textContent=Math.round(pct*e); if(p<1) requestAnimationFrame(tick);};
      requestAnimationFrame(tick);
    }));
  }
  calc();
}
const REDUCED=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const CHEV='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
const GIFT_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C9.5 3 12 5.5 12 8c0-2.5 2.5-5 4.5-5a2.5 2.5 0 0 1 0 5"/></svg>';

const CHECK_SEAL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const SAVE_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11"/><path d="M7 10l5 5 5-5"/><path d="M5 20h14"/></svg>';
/* Stable, friendly document number derived from the contact info (not an ID). */
function passNumber(){
  const src=(S.c.email||"")+(S.c.biz||"")+(S.c.name||"")||"fsqms";
  let h=2166136261; for(const ch of src){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); }
  return "PR-"+String(new Date().getFullYear()).slice(2)+"-"+(h>>>0).toString(36).toUpperCase().slice(0,4).padStart(4,"0");
}
function render(){
  document.getElementById("dock").hidden=false;
  document.querySelector(".wrap").classList.toggle("wide",S.screen==="results");
  setTimeout(()=>{S.anim=false;},0);
  if(S.screen==="intro") renderIntro();
  else if(S.screen==="step") renderStep();
  else if(S.screen==="contact") renderContact();
  else renderResults();
  backBtn.textContent=t("back");
}

/* ---------------- events ---------------- */
function contactProblem(){
  const els=["f-name","f-biz","f-email"].map(id=>document.getElementById(id));
  const empty=els.filter(el=>!el.value.trim());
  if(empty.length) return {msg:"contactMissing",els:empty};
  const email=els[2];
  if(!email.checkValidity()) return {msg:"contactEmailBad",els:[email]};
  return null;
}
function saveContact(){
  const g=id=>{const el=document.getElementById(id);return el?el.value.trim():"";};
  if(S.screen==="contact") S.c={name:g("f-name"),biz:g("f-biz"),email:g("f-email"),phone:g("f-phone")};
}
function to(screen,step){
  saveContact(); S.screen=screen; if(step!=null) S.step=step; S.anim=true; render(); window.scrollTo(0,0);
  const h=app.querySelector("h1,h2"); if(h){h.tabIndex=-1;h.focus({preventScroll:true});}
}
primary.addEventListener("click",()=>{
  if(S.screen==="intro"){ send("started"); to("step",0); return; }
  if(S.screen==="contact"){
    saveContact();
    const bad=contactProblem();
    if(bad){
      document.getElementById("contact-error").textContent=t(bad.msg);
      app.querySelectorAll(".group input").forEach(el=>el.toggleAttribute("aria-invalid",bad.els.includes(el)));
      bad.els[0].focus();
      return;
    }
    send("completed"); to("results"); return;
  }
  const list=stepList(), i=list.indexOf(S.step);
  if(i<list.length-1) to("step",list[i+1]);
  else to("contact");
});
backBtn.addEventListener("click",()=>{
  if(S.screen==="results") return to("contact");
  if(S.screen==="contact") return to("step",4);
  const list=stepList(), i=list.indexOf(S.step);
  if(i<=0) to("intro"); else to("step",list[i-1]);
});
app.addEventListener("click",e=>{
  const r=e.target.closest(".row");
  if(r){
    const y=window.scrollY;
    if(r.dataset.m){ S.m[r.dataset.m]=!S.m[r.dataset.m]; }
    else { const q=r.dataset.q, i=+r.dataset.i; S.v[q]=(S.v[q]===i && q!=="p1")?null:i; if(q==="p1"&&i!==1) S.v.p2=null; }
    const key=r.dataset.m?`[data-m="${r.dataset.m}"]`:`[data-q="${r.dataset.q}"][data-i="${r.dataset.i}"]`;
    render(); window.scrollTo(0,y); const again=app.querySelector(key); if(again) again.focus({preventScroll:true});
    const other=r.dataset.q&&app.querySelector(`[data-other="${r.dataset.q}"]`); if(other) other.focus({preventScroll:true});
    return;
  }
  if(e.target.closest("#simbtn")){ S.simOpen=true; send("similar_search"); renderSim(); return; }
  const f=e.target.closest("[data-filter]");
  if(f){
    const v=f.dataset.filter;
    app.querySelectorAll("[data-filter]").forEach(b=>b.setAttribute("aria-pressed",String(b===f)));
    app.querySelectorAll(".tcard").forEach(c=>{c.hidden=v!=="all"&&c.dataset.sec!==v;});
    return;
  }
  const a=e.target.closest("[data-act]"); if(!a) return;
  if(a.dataset.act==="gift"){ S.gift=!S.gift; if(S.gift) send("gift_opened"); const y=window.scrollY; render(); window.scrollTo(0,y); return; }
  if(a.dataset.act==="print"){ send("passport_saved"); window.print(); return; }
  if(a.dataset.act==="lab"){ S.lab=true; send("lab_connect"); render(); }
  if(a.dataset.act==="dp"){ S.v.dp=0; send("design_partner"); render(); }
  if(a.dataset.act==="restart"){ S.v={}; S.m={}; S.lab=false; to("intro"); }
});
/* Language is shared with the landing page: ?lang= wins, then the saved choice. */
const LANG_KEY="fsqms-lang";
function setLang(l,remember){
  S.lang=l; document.documentElement.lang=l;
  document.querySelectorAll(".seg button").forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.lang===l)));
  document.title="Stratum · "+t("h1");
  document.getElementById("home").href="index.html?lang="+l;
  backBtn.setAttribute("aria-label",l==="en"?"Back":"Atrás");
  // remembering the language needs "preferences" consent (see js/consent.js)
  if(remember && window.StratumConsent?.allows("preferences")){ try{localStorage.setItem(LANG_KEY,l);}catch(e){} }
}
document.querySelectorAll(".seg button").forEach(b=>b.addEventListener("click",()=>{
  saveContact(); setLang(b.dataset.lang,true); render();
}));
(function(){
  let l=new URLSearchParams(location.search).get("lang");
  if(l!=="es"&&l!=="en"){ try{l=localStorage.getItem(LANG_KEY);}catch(e){l=null;} }
  setLang(l==="en"?"en":"es",false);
})();

function renderSim(){
  const out=document.getElementById("simout"); if(!out) return;
  out.innerHTML=S.simOpen?P.similarHTML(S.simQ,P.compute(S.calc).price,S.lang):"";
}
function calc(){
  const r=P.compute(S.calc), f=x=>"$"+x.toFixed(2);
  const c=document.getElementById("o-cost"), p=document.getElementById("o-price");
  if(c) c.textContent=f(r.cost); if(p) p.textContent=f(r.price);
  if(S.simOpen) renderSim();
}
app.addEventListener("toggle",e=>{ if(e.target.matches(".deck-card")&&e.target.open&&!S.gift){ S.gift=true; send("gift_opened"); } },true);
app.addEventListener("input",e=>{
  if(e.target.matches(".group input[aria-invalid]")){ e.target.removeAttribute("aria-invalid"); const er=document.getElementById("contact-error"); if(er) er.textContent=""; }
  if(e.target.dataset.other){ S.v[e.target.dataset.other+"Other"]=e.target.value; return; }
  const i=e.target.dataset.c; if(i!=null){ S.calc[+i]=e.target.value; calc(); }
  if(e.target.id==="simq"){ S.simQ=e.target.value; }
});
app.addEventListener("keydown",e=>{ if(e.target.id==="simq" && e.key==="Enter"){ e.preventDefault(); S.simOpen=true; send("similar_search"); renderSim(); } });

/* ---------------- submission ---------------- */
function send(stage){
  const body={stage,lang:S.lang,at:new Date().toISOString(),contact:S.c,answers:S.v,checked:S.m,labConnect:S.lab,
    score:stage==="started"?null:(()=>{const r=score();return {points:r.pts,max:r.max,pct:Math.round(r.pct),blockers:r.blk,tier:r.tier};})()};
  if(TEST_MODE||!SUBMIT_URL){ console.info("[FSQMS test]",body); return; }
  fetch(SUBMIT_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),keepalive:true}).catch(()=>{});
}
render();
})();
