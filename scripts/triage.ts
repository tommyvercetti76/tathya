/**
 * CLI triage + bust kit: run the local detection pipeline on a piece of text
 * (a paste of a post, or OCR output) and emit a copy-ready, sourced rebuttal.
 *
 *   npm run triage -- "Sanskrit was codified by the ancient Pakistani grammarian Panini"
 *   npm run triage -- path/to/post.txt
 *
 * Same code path as the web flag form — one pipeline, two doors.
 */
import fs from "node:fs";
import path from "node:path";
import { buildBustKit, type BustEntry, type TechniqueInfo } from "../src/lib/detect/bustkit";
import { simhash } from "../src/lib/detect/fingerprint";

const arg = process.argv.slice(2).join(" ").trim();
if (!arg) {
  console.error('usage: npm run triage -- "<text>" | <file.txt>');
  process.exit(1);
}
const text = fs.existsSync(arg) ? fs.readFileSync(arg, "utf8") : arg;

const ledgerDir = path.join(process.cwd(), "content", "ledger");
const entries: BustEntry[] = fs
  .readdirSync(ledgerDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => {
    const e = JSON.parse(fs.readFileSync(path.join(ledgerDir, f), "utf8"));
    return {
      id: e.id,
      claimText: [e.claim.text, e.claim.asCirculated, ...(e.spread?.knownVariants ?? [])].join(" "),
      quickRebuttal: e.quickRebuttal,
      verdict: e.verdict?.direction,
      techniques: e.techniques,
      topSources: (e.sources as { label: string }[]).slice(0, 3).map((s) => s.label),
    };
  });

const techniques: TechniqueInfo[] = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "content", "techniques.json"), "utf8")
).techniques;

const kit = buildBustKit(text, entries, techniques);

console.log("\n─ tathya triage ──────────────────────────────");
console.log(text.length > 300 ? text.slice(0, 300) + "…" : text);
console.log(`fingerprint: ${simhash(text)}`);

console.log(`\nrule hits (${kit.ruleHits.length}):`);
if (kit.ruleHits.length === 0)
  console.log("  none — rules are narrow by design; absence of hits is not a verdict of 'clean'.");
for (const h of kit.ruleHits) console.log(`  [cat ${h.category} · ${h.confidence}] ${h.rule}: ${h.matched}`);

console.log(`\nclosest ledger entries:`);
if (kit.matches.length === 0) console.log("  none above threshold — this may be a NEW claim worth an entry.");
for (const m of kit.matches)
  console.log(`  ${m.score.toFixed(2)}${m.nearDuplicate ? " [near-duplicate]" : ""}  ${m.id}`);

if (kit.text) {
  console.log("\n─ bust kit (copy-ready) ──────────────────────");
  console.log(kit.text);
}
console.log("\nrules rank the queue; humans issue verdicts.\n");
