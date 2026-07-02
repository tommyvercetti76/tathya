/**
 * CLI triage: run the local detection rules + claim matching on a piece
 * of text (a paste of a post, or OCR output).
 *
 *   npm run triage -- "Sanskrit was codified by the ancient Pakistani grammarian Panini"
 *   npm run triage -- path/to/post.txt
 *
 * This is the same code path the web flag form uses — one pipeline, two doors.
 */
import fs from "node:fs";
import path from "node:path";
import { runRules } from "../src/lib/detect/rules";
import { matchClaims } from "../src/lib/detect/match";

const arg = process.argv.slice(2).join(" ").trim();
if (!arg) {
  console.error('usage: npm run triage -- "<text>" | <file.txt>');
  process.exit(1);
}
const text = fs.existsSync(arg) ? fs.readFileSync(arg, "utf8") : arg;

console.log("\n─ tathya triage ──────────────────────────────");
console.log(text.length > 300 ? text.slice(0, 300) + "…" : text);

const hits = runRules(text);
console.log(`\nrule hits (${hits.length}):`);
if (hits.length === 0) console.log("  none — rules are narrow by design; absence of hits is not a verdict of 'clean'.");
for (const h of hits) {
  console.log(`  [cat ${h.category} · ${h.confidence}] ${h.rule}: ${h.matched}`);
}

const ledgerDir = path.join(process.cwd(), "content", "ledger");
const candidates = fs
  .readdirSync(ledgerDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => {
    const e = JSON.parse(fs.readFileSync(path.join(ledgerDir, f), "utf8"));
    return {
      id: e.id as string,
      surface: [e.claim.text, e.claim.asCirculated, ...(e.techniques ?? [])].join(" "),
    };
  });

const matches = matchClaims(text, candidates);
console.log(`\nclosest ledger entries:`);
if (matches.length === 0) console.log("  none above threshold — this may be a NEW claim worth an entry.");
for (const m of matches) console.log(`  ${m.score.toFixed(2)}  ${m.id}`);
console.log("\nrules rank the queue; humans issue verdicts.\n");
