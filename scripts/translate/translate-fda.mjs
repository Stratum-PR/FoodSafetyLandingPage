/* Spanish names for the FDA recall products shown on Alertas PR.
   Fetches the last 12 months of FDA recalls exactly as /api/recalls does (Puerto Rico + nationwide),
   asks Claude for a short Spanish name for every product not translated yet, and writes
   data/fda-es.json ({ updated, model, names: { "<FDA product text>": "<nombre en español>" } }).
   Names that no longer appear are dropped, so the file only covers the current year.
   Run by .github/workflows/translate-fda.yml; locally: ANTHROPIC_API_KEY=… node scripts/translate/translate-fda.mjs */
import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const recalls = require("../../api/recalls.js"); // same queries and product text as the site
const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "../../data/fda-es.json");
const MODEL = "claude-opus-5-5";
const BATCH = 40;

const SYSTEM = `You translate U.S. FDA food recall product descriptions into short Spanish product names for shoppers in Puerto Rico.
For each item, write the name a shopper would recognize on the shelf: the kind of product, then the brand and the flavor or variety when the text gives them (for example "Galletas de vainilla Great Value" or "Lechuga romana picada Taylor Farms").
Rules:
- Keep brand names and trademarks exactly as written; never translate them.
- Leave out UPC codes, lot codes, weights, package counts and case counts.
- Use the Spanish used in Puerto Rico (maní, habichuelas, guineo, mantecado, salchichas).
- If the text is already in Spanish, clean it up the same way.
- At most 80 characters. If the text names several products, name the main one and add "y otros".
Return one entry per input item, with the same i.`;

const SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: { i: { type: "integer" }, es: { type: "string" } },
        required: ["i", "es"],
        additionalProperties: false,
      },
    },
  },
  required: ["items"],
  additionalProperties: false,
};

const client = new Anthropic();

/** Translate one batch; returns { text: name } for the items the model answered. */
async function translate(batch) {
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: "user", content: JSON.stringify(batch.map((t, i) => ({ i, t }))) }],
  });
  if (response.stop_reason === "refusal") {
    console.warn(`  declined (${response.stop_details?.category ?? "no category"}); skipping ${batch.length} names`);
    return {};
  }
  if (response.stop_reason === "max_tokens") {
    console.warn(`  answer cut off; skipping ${batch.length} names`);
    return {};
  }
  const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const out = {};
  for (const { i, es } of JSON.parse(text).items) {
    const name = String(es || "").replace(/\s+/g, " ").trim();
    if (batch[i] && name) out[batch[i]] = name.slice(0, 120);
  }
  return out;
}

async function main() {
  const names = new Set();
  for (const scope of ["pr", "nat"]) {
    const { results } = await recalls.fetchScope(scope);
    for (const ev of recalls.toEvents(results, scope)) for (const p of ev.prods) names.add(p);
  }
  let old = {};
  try { old = JSON.parse(fs.readFileSync(OUT, "utf8")).names || {}; } catch (err) { /* first run */ }
  const todo = [...names].filter((n) => !old[n]);
  console.log(`${names.size} FDA products in the last 12 months; ${names.size - todo.length} already translated; ${todo.length} to translate`);

  const fresh = {};
  let failed = 0;
  for (let k = 0; k < todo.length; k += BATCH) {
    const batch = todo.slice(k, k + BATCH);
    try {
      Object.assign(fresh, await translate(batch));
    } catch (err) {
      failed += batch.length;
      if (err instanceof Anthropic.AuthenticationError) throw err; // a bad key fails every batch: stop now
      if (err instanceof Anthropic.APIError) console.warn(`  API error ${err.status}: ${err.message}`);
      else if (err instanceof SyntaxError) console.warn(`  unreadable answer: ${err.message}`);
      else throw err;
    }
    console.log(`  ${Math.min(k + BATCH, todo.length)}/${todo.length}`);
  }

  const merged = {};
  for (const n of [...names].sort()) if (old[n] || fresh[n]) merged[n] = old[n] || fresh[n];
  if (JSON.stringify(merged) === JSON.stringify(old)) { console.log("no changes"); return; } // keep the file (and its date) as is
  fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString().slice(0, 10), model: MODEL, names: merged }, null, 1) + "\n");
  console.log(`wrote ${Object.keys(merged).length} names to data/fda-es.json (${Object.keys(fresh).length} new, ${failed} failed)`);
  if (todo.length && !Object.keys(fresh).length) process.exitCode = 1; // nothing worked: show the run as failed
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
