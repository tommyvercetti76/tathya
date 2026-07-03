# CLAUDE.md — agent guide to tathya

tathya (तथ्य, "fact") is an open-source, two-sided evidence project: an **Atlas** (deep-time timeline of Sanātana Dharma) and a **Debunker** (propaganda ledger + playbook + drill + detection pipeline). One principle governs every change: **evidence over assertion — every claim sourced, every uncertainty named, the same rigor in both directions.**

## Repo map

```
content/                 ← ALL knowledge lives here, as plain JSON (no DB, no CMS)
  atlas/                 one entry per file OR era bundles (era-*.json = array of entries)
  ledger/                one debunk entry per file
  flags/samples.json     example user flags (the intake format)
  eras.json              the 7 timeline eras
  taxonomy.json          the 12 debunk categories + verdict directions + flag reasons
  techniques.json        the propaganda playbook (15 manipulation techniques)
  drills.json            the inoculation game items
  tradecraft.json        Kauṭilya + analyst tradecraft cards + ACH demo data
src/lib/
  schema.ts              Zod content model — THE data contract; read this first
  content.ts             server-only loaders (uses node:fs — never import in client components)
  deva.ts                client-safe helpers (Devanāgarī numerals)
  detect/                the local detection pipeline (browser + CLI, dependency-free)
    rules.ts             deterministic labeling functions (each returns the exact span that fired)
    match.ts             TF-IDF claim matching + near-duplicate boost
    fingerprint.ts       SimHash for recycled-propaganda detection
    bustkit.ts           deterministic sourced-rebuttal generator (no model in the loop)
src/app/                 Next.js App Router pages: / (atlas), /ledger, /playbook, /drill, /flag
src/components/          Timeline, FlagForm, Drill, AchMatrix, SourceGrader, Chrome, CopyButton
scripts/
  validate.ts            schema + EDITORIAL rules; runs in CI; the gatekeeper
  triage.ts              CLI: rules + matching + bust kit on any text
  fetch-images.ts        Wikimedia Commons image fetcher (license-aware, re-runnable)
docs/                    API.md · DETECTION.md · GOVERNANCE.md · SECURITY.md · INDIC-SOURCES.md
.github/                 CI (validate + build), issue-form templates (the no-code contribution door)
```

## Commands

```bash
npm run dev        # dev server on :3000
npm run check      # validate + production build — run before every commit
npm run validate   # content schema + editorial rules only
npm run triage -- "<text>"   # run the detection pipeline + bust kit on any text
npx tsx scripts/fetch-images.ts   # fetch/refresh entry images (review its output!)
```

## Invariants — never weaken these

The validator (`scripts/validate.ts`) enforces the project's soul. Do not bypass or soften it; extend it when adding features.

1. Every atlas entry has a **dating honesty tag** (`firm | traditional | contested | evolved`); `contested` REQUIRES ≥2 positions listed.
2. Every atlas entry has a **dharmicTie** graded honestly (`direct-scriptural | living-practice | historical-lineage | contested-continuity | substrate`); the two strongest grades REQUIRE scripture references.
3. Flagship atlas entries: **≥5 independent sources**. All entries: ≥3.
4. Ledger entries with a verdict REQUIRE a **quickRebuttal** (the copy-ready 10-second answer).
5. Ledger `techniques` must reference ids in `content/techniques.json`.
6. Category 12 (legitimate debate) can NEVER carry an accusatory verdict — genuine scholarship is protected, in both directions.
7. Category 9 (internal overclaims) gets the SAME rigor as external distortions. An atlas that only debunks outsiders is a fan page.
8. Nothing renders as `published` without named human vetters. AI drafts (`aiAssisted: true`) stay `in-review` until a human verifies every citation. This includes YOUR output.
9. Drill decks must include ≥2 `legitimate` items — the game trains NOT firing on real scholarship too.
10. Detection rules must return the exact span that fired (explainability is non-negotiable) and NEVER auto-publish verdicts. Rules rank queues; humans decide.
11. All URLs in content are **https-only** (schema-enforced — prevents scheme injection).

## Stable URL contract — do not change existing anchors

These are the project's permalinks; external replies and bust kits cite them. Ids are permanent once merged.

| URL | Meaning |
|---|---|
| `/#<atlas-entry-id>` | opens + scrolls to an atlas entry |
| `/?lens=great-ideas` | atlas filtered to modern through-lines |
| `/ledger#<ledger-entry-id>` | a debunk entry (used by bust kits!) |
| `/ledger?cat=<1..12>` | ledger filtered by category |
| `/playbook#<technique-id>` | a named manipulation technique |
| `/drill`, `/flag` | the game; the intake form |

## Recipes

- **Add an atlas entry**: copy a similar file in `content/atlas/` (or append to its era bundle), keep the id kebab-case and permanent, fill dating+dharmicTie+sources, run `npm run check`. Cross-link `relatedLedger` where relevant.
- **Add a ledger entry**: include `whatsTrue` (concede the kernel honestly — that's what makes debunks land), evidence FOR and AGAINST as stated, `quickRebuttal`, technique ids, `spread.knownVariants` (these feed the matcher).
- **Add a technique**: `content/techniques.json` (definition/tell/counter/example) → add ≥1 drill item using it → consider a detection rule in `rules.ts`.
- **Add a detection rule**: new labeling function in `src/lib/detect/rules.ts` returning `RuleHit[]` with the matched span; add to `ALL_RULES`; test via `npm run triage`.
- **Full schema + library reference**: `docs/API.md`.

## Gotchas (learned the hard way)

- `content.ts` imports `node:fs` — importing it in a `"use client"` file breaks the build. Client-safe helpers live in `deva.ts`.
- Never call `Math.random()`/`Date.now()` during React render — it breaks SSR hydration (shuffle in `useEffect`; see `Drill.tsx`).
- If dev pages go blank or interactions die with "Cannot find module './NNN.js'": the dev cache corrupted — `rm -rf .next && npm run dev`. Production builds are unaffected.
- `fetch-images.ts`: the Commons search API 429s aggressively; the script retries, but re-run for stragglers and ALWAYS eyeball the matched filenames — wrong images get hand-culled.
- Era bundle files are JSON **arrays**; single-entry files are objects. Both loaders and the validator handle either.
