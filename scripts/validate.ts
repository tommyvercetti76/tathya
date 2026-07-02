/**
 * Content validation — runs in CI on every PR.
 * Beyond schema-shape, enforces the editorial rules that make tathya tathya:
 *   - flagship atlas entries: >= 5 independent sources
 *   - contested dating: competing positions must be listed
 *   - ledger entries: countering evidence required; category 12 must not
 *     carry an overclaim/misrepresentation verdict
 *   - nothing with status "published" and zero named vetters
 */
import fs from "node:fs";
import path from "node:path";
import { AtlasEntry, LedgerEntry, Flag, Era } from "../src/lib/schema";

const ROOT = path.join(process.cwd(), "content");
let errors = 0;

function fail(file: string, msg: string) {
  errors++;
  console.error(`  ✗ ${file}: ${msg}`);
}

function filesIn(dir: string): string[] {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full).filter((f) => f.endsWith(".json")).map((f) => path.join(full, f));
}

/** Each file holds one entry or an array of entries; yield [label, raw] pairs. */
function entriesIn(dir: string): [string, unknown][] {
  return filesIn(dir).flatMap((f) => {
    const rel = path.relative(ROOT, f);
    const raw = JSON.parse(fs.readFileSync(f, "utf8")) as unknown;
    return Array.isArray(raw)
      ? raw.map((r, i): [string, unknown] => [`${rel}[${i}]`, r])
      : ([[rel, raw]] as [string, unknown][]);
  });
}

console.log("tathya content validation\n");

const ledgerIds = new Set<string>();
for (const [, raw] of entriesIn("ledger")) {
  ledgerIds.add((raw as { id: string }).id);
}
const atlasIds = new Set<string>();
const atlasIdSeen = new Set<string>();
for (const [rel, raw] of entriesIn("atlas")) {
  const id = (raw as { id: string }).id;
  if (atlasIdSeen.has(id)) fail(rel, `duplicate atlas id "${id}"`);
  atlasIdSeen.add(id);
  atlasIds.add(id);
}

for (const [rel, raw] of entriesIn("atlas")) {
  try {
    const e = AtlasEntry.parse(raw);
    const independent = e.sources.filter((s) => s.independent).length;
    if (e.flagship && independent < 5)
      fail(rel, `flagship entry has ${independent} independent sources; needs >= 5`);
    if (e.dating.tag === "contested" && (!e.dating.positions || e.dating.positions.length < 2))
      fail(rel, `dating tagged "contested" must list >= 2 positions`);
    if (e.vetting.status === "published" && e.vetting.vetters.length === 0)
      fail(rel, `published with no named vetters`);
    if (!e.dharmicTie)
      fail(rel, `missing dharmicTie — every atlas entry must state its tie to Sanātana Dharma, graded honestly`);
    if (
      e.dharmicTie &&
      ["direct-scriptural", "living-practice"].includes(e.dharmicTie.status) &&
      (!e.dharmicTie.scriptureRefs || e.dharmicTie.scriptureRefs.length === 0)
    )
      fail(rel, `dharmicTie status "${e.dharmicTie.status}" requires scripture references`);
    for (const id of e.relatedLedger ?? [])
      if (!ledgerIds.has(id)) fail(rel, `relatedLedger references unknown id "${id}"`);
  } catch (err) {
    fail(rel, String(err));
  }
}

const techniqueIds = new Set<string>(
  (
    JSON.parse(fs.readFileSync(path.join(ROOT, "techniques.json"), "utf8")) as {
      techniques: { id: string }[];
    }
  ).techniques.map((t) => t.id)
);

const seenCategories = new Set<number>();
for (const [rel, raw] of entriesIn("ledger")) {
  try {
    const e = LedgerEntry.parse(raw);
    seenCategories.add(e.category);
    if (e.evidence.countering.length === 0 && e.category !== 12)
      fail(rel, `ledger entry has no countering evidence`);
    if (e.verdict && !e.quickRebuttal)
      fail(rel, `entry has a verdict but no quickRebuttal — every busted claim needs its 10-second answer`);
    for (const t of e.techniques ?? [])
      if (!techniqueIds.has(t)) fail(rel, `unknown technique "${t}" — add it to content/techniques.json or fix the id`);
    if (e.category === 12 && e.verdict && e.verdict.direction !== "legitimate")
      fail(rel, `category 12 (legitimate debate) cannot carry an accusatory verdict`);
    if (e.vetting.status === "published" && e.vetting.vetters.length === 0)
      fail(rel, `published with no named vetters`);
    for (const id of e.relatedAtlas ?? [])
      if (!atlasIds.has(id)) fail(rel, `relatedAtlas references unknown id "${id}"`);
  } catch (err) {
    fail(rel, String(err));
  }
}

const erasRaw = JSON.parse(fs.readFileSync(path.join(ROOT, "eras.json"), "utf8")) as unknown[];
erasRaw.forEach((e, i) => {
  try {
    Era.parse(e);
  } catch (err) {
    fail("eras.json", `era[${i}]: ${err}`);
  }
});

const flagsPath = path.join(ROOT, "flags", "samples.json");
if (fs.existsSync(flagsPath)) {
  (JSON.parse(fs.readFileSync(flagsPath, "utf8")) as unknown[]).forEach((raw, i) => {
    try {
      Flag.parse(raw);
    } catch (err) {
      fail("flags/samples.json", `flag[${i}]: ${err}`);
    }
  });
}

console.log(
  `\n  atlas: ${atlasIds.size} entries · ledger: ${ledgerIds.size} entries (categories covered: ${[...seenCategories].sort((a, b) => a - b).join(", ")})`
);
if (errors > 0) {
  console.error(`\n${errors} error(s).`);
  process.exit(1);
}
console.log("  all content valid ✓");
