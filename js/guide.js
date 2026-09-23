/* Official links guide, shared by the landing page (#guia), the self-check results
   and the passport email (api/selfcheck requires this file). */
(function(root){
const GUIDE=[
 ["https://walmartpr.com/nosotros/opencall",{es:"Open Call PR 2026: registro y requisitos",en:"Open Call PR 2026: registration and requirements"},"walmartpr.com"],
 ["https://corporate.walmart.com/suppliers",{es:"Requisitos para suplidores de Walmart (incluye EDI)",en:"Walmart supplier requirements (incl. EDI)"},"corporate.walmart.com"],
 ["https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online",{es:"Solicitar EIN",en:"Apply for an EIN"},"irs.gov"],
 ["https://www.dnb.com/duns/get-a-duns.html",{es:"Solicitar número D-U-N-S",en:"Request a D-U-N-S number"},"dnb.com"],
 ["https://www.gs1us.org",{es:"Membresía GS1 y códigos UPC",en:"GS1 membership and UPCs"},"gs1us.org"],
 ["https://www.ftc.gov/business-guidance/resources/complying-made-usa-standard",{es:"Guía Made in USA de la FTC",en:"FTC Made in USA guidance"},"ftc.gov"],
 ["https://www.fda.gov/food/online-registration-food-facilities/food-facility-registration-user-guide-biennial-registration-renewal",{es:"Registro y renovación con la FDA",en:"FDA registration and renewal"},"fda.gov"],
 ["https://enablement.walmart.com/content/food-safety/en_us/food-safety-requirements/national-branded-products/all-other-commodities.html",{es:"Requisitos de inocuidad de Walmart",en:"Walmart food safety requirements"},"walmart.com"],
 ["https://mygfsi.com/how-to-implement/recognition/",{es:"Certificaciones reconocidas por GFSI",en:"GFSI-recognized certifications"},"mygfsi.com"],
 ["https://www.fspca.net",{es:"Curso PCQI de la FSPCA",en:"FSPCA PCQI course"},"fspca.net"],
 ["https://www.a2la.org",{es:"Laboratorios acreditados ISO/IEC 17025",en:"ISO/IEC 17025 accredited labs"},"a2la.org"],
 ["https://enablement.walmart.com/content/food-safety/en_us/food-safety-requirements/food-traceability.html",{es:"Trazabilidad que exige Walmart",en:"Walmart traceability requirements"},"walmart.com"],
 ["https://www.fda.gov/food/food-safety-modernization-act-fsma/fsma-final-rule-requirements-additional-traceability-records-certain-foods",{es:"Regla de trazabilidad FSMA 204",en:"FSMA 204 traceability rule"},"fda.gov"],
 ["https://corporate.walmart.com/content/dam/corporate/documents/suppliers/requirements/insurance-requirements.pdf",{es:"Requisitos de seguro de Walmart (PDF)",en:"Walmart insurance requirements (PDF)"},"corporate.walmart.com"]
];
/* Guide links grouped for the deck (indexes into GUIDE). */
const GUIDE_GROUPS=[
 {tone:"walmart",es:"Walmart",en:"Walmart",idx:[0,1,7,11,13]},
 {tone:"registro",es:"Registro del negocio",en:"Business registration",idx:[2,3,4,5]},
 {tone:"fda",es:"FDA e inocuidad",en:"FDA and food safety",idx:[6,8,9,10,12]}
];
const DATA={GUIDE,GUIDE_GROUPS};
if (typeof module !== "undefined" && module.exports) module.exports = DATA; else root.FSQMSGuide = DATA;
})(typeof window !== "undefined" ? window : globalThis);
