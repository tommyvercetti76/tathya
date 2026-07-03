# tathya API reference

Three API surfaces, all documented here:
1. **Data contracts** — the JSON shapes in `content/` (the real API of an open-content project)
2. **Library API** — `src/lib/` functions (used by the site, the CLI, and future extensions)
3. **URL contract** — stable permalinks (external replies and bust kits depend on them)

There is no hosted HTTP API yet; the planned `/api/triage` spec is at the end so contributors can build against it. The single source of truth for all shapes is [`src/lib/schema.ts`](../src/lib/schema.ts) (Zod) — when this document and the schema disagree, the schema wins and this doc has a bug.

---

## 1 · Data contracts

All content is UTF-8 JSON, one entry per file, except era bundles (`content/atlas/era-*.json`) which are arrays of entries. Validation: `npm run validate` (runs in CI; see rule list at §1.7).

### 1.1 AtlasEntry (`content/atlas/`)

| field | type | req | notes |
|---|---|---|---|
| `id` | `kebab-case string` | ✔ | permanent once merged; used in `/#<id>` permalinks |
| `side` | `"atlas"` | ✔ | |
| `era` | id into `eras.json` | ✔ | `foundations…contemporary` |
| `slice` | string | ✔ | thematic grouping inside the era |
| `title` | `{ en, deva?, iast? }` | ✔ | Devanāgarī + IAST where applicable |
| `kind` | enum | ✔ | `person·text·place·event·concept·innovation·artifact` |
| `dating` | Dating | ✔ | see 1.1a |
| `summary`, `whyItMatters` | string | ✔ | |
| `honestyNote` | string | | the uncertainty we refuse to bury |
| `dharmicTie` | DharmicTie | ✔* | *validator-required; see 1.1b |
| `custody` | Custody | | who holds it / where / legal basis / ≥3 parallels abroad |
| `image` | EntryImage | | `src/alt/credit/license/sourceUrl`; https-only |
| `locations` | `{name,lat,lng,note?}[]` | | coordinates; mark approximations in `note` |
| `throughLines` | ThroughLine[] | | presence ⇒ appears in the Great Ideas lens |
| `flagship` | boolean | ✔ | flagship ⇒ ≥5 independent sources |
| `sources` | Source[] (≥3) | ✔ | see 1.5 |
| `relatedLedger` | ledger ids[] | | validated cross-refs |
| `contributors`, `vetting` | | ✔ | see 1.6 |

**1.1a Dating** — `{ display, edtf, tag, basis, scientific?, positions? }`. `edtf` is Library-of-Congress EDTF (`-6999/-2599`, `1893-09-11`, `1947/..`). `tag ∈ firm|traditional|contested|evolved`; `contested` requires ≥2 `positions` (`{position, holders, evidence}`). `scientific[]` records lab evidence (`{method, result, source}`).

**1.1b DharmicTie** — `{ status, statement, scriptureRefs? }`. `status ∈ direct-scriptural | living-practice | historical-lineage | contested-continuity | substrate` (graded honestly — the grading is the shield). The first two statuses require `scriptureRefs[]` (`{ref, text?, link?}`; prefer Indian-hosted critical texts — see [INDIC-SOURCES.md](INDIC-SOURCES.md)).

**1.1c ThroughLine** — `{ to, status, chain[], sources[] }`. `status ∈ documented` (causal chain in the record) `| anticipation` (idea existed first, no transmission) `| conjectural` (hypothesized — say so). The label is the point.

### 1.2 LedgerEntry (`content/ledger/`)

| field | type | req | notes |
|---|---|---|---|
| `id`, `side:"ledger"` | | ✔ | permalink `/ledger#<id>` — bust kits cite this |
| `claim` | `{text, asCirculated, channels[], exampleRefs?}` | ✔ | neutral statement + verbatim flavor |
| `category` | 1–12 | ✔ | taxonomy in `content/taxonomy.json` |
| `techniques` | technique ids[] | | validated against `techniques.json` |
| `quickRebuttal` | string | ✔* | *required when `verdict` present — the copy-ready 10-second answer |
| `spread` | `{recurrence, note?, knownVariants?}` | | `recurrence ∈ evergreen|seasonal|burst`; `knownVariants` feed the matcher |
| `whatsTrue`, `whatsDistorted` | string | | concede the kernel honestly |
| `evidence` | `{supporting[], countering[]}` | ✔ | each item `{point, sources[]}`; countering required except cat 12 |
| `verdict` | `{direction, rationale}` | | `direction ∈ overclaim|misrepresentation|legitimate`; cat 12 may only be `legitimate` |
| `relatedAtlas` | atlas ids[] | | validated cross-refs |
| `sources` (≥3), `contributors`, `vetting` | | ✔ | |

### 1.3 Flag (`content/flags/`) — the intake format

`{ id, submitted, channel, url?, screenshotRef?, imagePHash?, ocrText?, flagFor[] (≥1), submitterNote?, ruleHits?, matchedLedger?, status, resolution? }`. `status ∈ new|triaged|merged-into-entry|spawned-entry|rejected`. Every field maps to a question the campaign-analysis layer (ABCDE) needs.

### 1.4 Technique / DrillItem / Era

- **Technique** (`techniques.json`): `{id, name, definition, tell, counter, example, categories[]}` — permalink `/playbook#<id>`.
- **DrillItem** (`drills.json`): `{id, channel, handle, post, choices[4] (technique ids or "legitimate"), answer, explanation}`. Deck must contain ≥2 `legitimate` items.
- **Era** (`eras.json`): `{id, name, span, edtf, order}`.

### 1.5 Source

`{ label, detail?, url?, kind, independent }` · `kind ∈ primary | peer-reviewed | monograph | reference | reportage | archival | dataset` · `independent:false` marks derivative sources (they don't count toward minimums). All `url`s must be `https://` (schema-enforced).

### 1.6 Vetting

`{ status: draft|in-review|published, vetters[], aiAssisted, lastReviewed? }`. `published` requires ≥1 named vetter (validator-enforced). `aiAssisted` is permanent provenance, never removed.

### 1.7 Validator rules (CI gate)

schema-shape for every file · flagship ⇒ ≥5 independent sources · contested dating ⇒ ≥2 positions · dharmicTie required; scripture refs for the two strongest grades · unique atlas ids · cross-ref ids must exist · ledger: countering evidence (except cat 12) · verdict ⇒ quickRebuttal · technique ids must exist · cat 12 never accusatory · published ⇒ named vetters · drills: valid choices, explanations, ≥2 legitimate items.

---

## 2 · Library API (`src/lib/`)

Everything below is dependency-free TypeScript that runs in browser AND Node — the same pipeline powers the flag form, the CLI, and (future) the extension.

### detect/rules.ts
```ts
runRules(text: string): RuleHit[]
// RuleHit = { rule, category (1–12), technique (id into techniques.json),
//             matched (the EXACT span that fired — explainability contract),
//             confidence: "high"|"medium"|"low" }
```
11 deterministic labeling functions (weak-supervision pattern). Adding one: export a `lf*` function, append to `ALL_RULES`. Rules rank queues; they never publish verdicts.

### detect/match.ts
```ts
matchClaims(flagText, candidates: MatchCandidate[], topK=3): MatchResult[]
// MatchCandidate = { id, surface, variants? }   // surface: claim+asCirculated+variants
// MatchResult   = { id, score (0–1 TF-IDF cosine), nearDuplicate (SimHash ≤12 bits) }
```

### detect/fingerprint.ts
```ts
simhash(text): string      // 64-bit hex fingerprint (Charikar SimHash over word 2-grams)
hamming(a, b): number      // ≤ NEAR_DUPLICATE_BITS (12) ⇒ recycled post
```

### detect/bustkit.ts
```ts
buildBustKit(flagText, entries: BustEntry[], techniques: TechniqueInfo[], siteBase=""): BustKit
// BustKit = { ruleHits, matches, text (copy-ready sourced rebuttal), isNewClaim }
```
Deterministic templating over vetted content — no model in the loop; every sentence traces to a ledger entry.

### content.ts (server-only — imports node:fs)
`loadAtlas() · loadLedger() · loadEras() · loadFlags() · loadTaxonomy() · loadTechniques() · loadDrills() · loadTradecraft()` — each parses through the Zod schema (fail-fast). Client-safe helpers (e.g. `toDevanagari`) live in `deva.ts`.

### CLI
```bash
npm run triage -- "<text>" | file.txt   # rules + matches + fingerprint + bust kit
npm run validate                        # §1.7
npm run check                           # validate + production build
npx tsx scripts/fetch-images.ts [--force]  # Commons images w/ license metadata
```

---

## 3 · URL contract (stable — do not break)

| pattern | resolves to |
|---|---|
| `/#<atlas-id>` | atlas entry, auto-opened and centered |
| `/?lens=great-ideas` | through-line entries only |
| `/ledger#<ledger-id>` | debunk entry — **cited inside every bust kit** |
| `/ledger?cat=<1..12>` | category filter |
| `/playbook#<technique-id>` | technique card |
| `/drill` · `/flag` | game · intake |

Entry/technique ids are permanent once merged. Renames require a redirect entry and a very good reason.

---

## 4 · Planned HTTP API (spec for contributors — not yet served)

```
POST /api/triage          { text: string } → BustKit (JSON; same shape as §2)
GET  /api/ledger.json     all published ledger entries (vetting.status === "published" only)
GET  /api/claimreview.json  published verdicts as schema.org ClaimReview JSON-LD
```
Constraints for implementers: stateless · published-content only · rate-limited · CORS open for GET, none for POST · no user data stored server-side (flags keep flowing through the GitHub-issue door, which is public and auditable by design).
