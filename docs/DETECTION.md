# The tathya detection pipeline

Goal: given a screenshot or a link, decide **cheaply, locally, and explainably** whether it matches known propaganda patterns about Hinduism / Sanātana Dharma — and turn every user flag into training signal for an open model.

Design rule: **reuse existing science at every stage.** Nothing below is invented here; each stage names the pattern it borrows.

```
 screenshot / link
        │
        ▼
 ┌─ Stage 0: intake ────────────────────────────────────────────┐
 │ pHash / PDQ perceptual hash → near-duplicate check           │
 │ (propaganda recycles images; most flags are re-posts)        │
 │ OCR: tesseract.js in-browser (screenshots never leave the    │
 │ user's device) → server-side PaddleOCR for Indic scripts     │
 └──────────────────────────────────────────────────────────────┘
        │ text
        ▼
 ┌─ Stage 1: deterministic labeling functions ──────────────────┐
 │ src/lib/detect/rules.ts — small, transparent rules that      │
 │ return the exact span that fired:                            │
 │   • nation-retrojection: modern polity + pre-founding date   │
 │     ("ancient Pakistani" + "4th c. BCE" → anachronism)       │
 │   • founding-date fallacy ("X years older than Hinduism")    │
 │   • nation-age inflation ("Pakistan: 9,000-year-old…")       │
 │   • fabricated endorsement ("NASA declared… best")           │
 │   • ancient-tech overclaim ("ancient aircraft")              │
 │ Pattern: weak supervision (Snorkel — Ratner et al. 2018).    │
 │ Rules NEVER publish verdicts; they rank the review queue     │
 │ and emit noisy labels for training.                          │
 └──────────────────────────────────────────────────────────────┘
        │
        ▼
 ┌─ Stage 2: claim matching ────────────────────────────────────┐
 │ "Have we already documented this claim?"                     │
 │ v0: token/bigram Jaccard (src/lib/detect/match.ts, zero      │
 │ dependencies, runs in the browser).                          │
 │ v1: multilingual sentence embeddings (e.g. multilingual-e5   │
 │ or LaBSE via sentence-transformers) + FAISS/sqlite-vec.      │
 │ This is the "verified-claim retrieval" task from CLEF        │
 │ CheckThat! — use their eval setup, don't reinvent it.        │
 └──────────────────────────────────────────────────────────────┘
        │
        ▼
 ┌─ Stage 3: learned classifier (grows with the data) ──────────┐
 │ Features: OCR text, rule hits, channel, account patterns,    │
 │ image pHash cluster. Labels: the 12-category taxonomy +      │
 │ technique tags. Bootstrap: rule outputs as weak labels;      │
 │ every human flag ("Flag for:" checkboxes + bespoke text) is  │
 │ a real label; every vetter decision is a gold label.         │
 │ Start: multilingual DistilBERT/IndicBERT fine-tune — small   │
 │ enough to run locally. Technique taxonomy: align with        │
 │ SemEval-2020 Task 11 propaganda techniques (Da San Martino   │
 │ et al.) so tathya data is comparable with existing corpora.  │
 │ Active learning: surface lowest-confidence / highest-        │
 │ disagreement items to vetters first (uncertainty sampling).  │
 └──────────────────────────────────────────────────────────────┘
        │
        ▼
 human vetter issues the verdict. Always.
```

## Why local-first, frontier-last

- **OCR**: a screenshot of a tweet is a solved OCR problem; tesseract/PaddleOCR at ~zero cost beats shipping user images to an API on privacy, cost, and latency. Frontier models enter only for genuinely hard inputs (memes with warped text, mixed-script images) — and then only with user consent.
- **Rules before models**: the attached example tweets are catchable with a regex and a founding-dates table. A rule that says `"ancient Pakistani" + "4th–5th century BCE" → anachronism (state founded 1947)` is auditable by a non-programmer, free, and produces its own explanation. Models earn their place when rules run out.
- **Every flag is a label.** The "Flag for:" checkboxes are the taxonomy; the bespoke free-text field captures patterns we haven't named yet. Periodically cluster the bespoke texts (embeddings + HDBSCAN) to discover new rule/technique candidates — the users teach the taxonomy.

## Dataset schema (what training consumes)

Each vetted flag becomes a row:

| field | source |
|---|---|
| `text` | OCR/paste, human-corrected |
| `channel`, `url` | submitter |
| `image_phash` | intake |
| `rule_hits[]` | stage 1 (weak labels) |
| `flag_for[]` | submitter (human labels) |
| `bespoke_reason` | submitter (open vocabulary) |
| `category`, `techniques[]`, `verdict` | vetter (gold labels) |
| `matched_entry` | vetter (claim-matching gold) |

Publish periodic anonymized dumps (CSV/parquet) so researchers can train without touching the app.

## Interop (maximize reuse, emit standards)

- **schema.org ClaimReview**: every published ledger verdict is exportable as ClaimReview JSON-LD, so Google Fact Check Explorer and friends index tathya for free.
- **EDTF** for all dates (already in the content schema).
- **PDQ hash** (Meta ThreatExchange) as the image-hash format, so hash lists can be shared with other integrity projects.

## Failure modes we design against

- **Rules as verdicts** — forbidden; rules rank queues.
- **One-sided rigor** — category 9 (internal overclaims) trains and evaluates with the same pipeline; the eval set must stay balanced across verdict directions, or the model becomes a partisan.
- **Category 12 leakage** — legitimate-scholarship items are hard negatives in training: the model must learn *scholarly disagreement ≠ propaganda*. Track a dedicated false-positive rate on category-12 items; regressions there block release.
