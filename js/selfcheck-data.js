/* Self-check content shared by the browser (window.StratumSelfcheck) and the
   server (/api/selfcheck requires this file), so emails are built from the same
   text the results page shows, never from text sent by the browser. */
(function (root) {
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
const TIERS={es:{ready:["Listo","Estás bien posicionado. Mantén todo al día."],
         close:["Cerca","Te faltan requisitos clave. Empieza por los marcados como prioridad."],
         gaps:["Brechas importantes","Tienes trabajo por delante, pero es alcanzable. Empieza por la lista de abajo."]},en:{ready:["Ready","You're well positioned. Keep everything current."],
         close:["Close","You're missing key requirements. Start with the ones marked priority."],
         gaps:["Significant gaps","You have work ahead, but it's doable. Start with the list below."]}};
const SECTIONS={es:{1:"Registro",2:"Inocuidad",3:"Trazabilidad",4:"Seguro"},en:{1:"Registration",2:"Food safety",3:"Traceability",4:"Insurance"}};
const DATA={ITEMS,TIERS,SECTIONS};
if (typeof module !== "undefined" && module.exports) module.exports = DATA; else root.StratumSelfcheck = DATA;
})(typeof window !== "undefined" ? window : globalThis);
