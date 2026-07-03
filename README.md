# tathya · तथ्य

**Truth wins, always.**

An open-source, two-sided project about Sanātana Dharma, built on one principle: **evidence over assertion — every claim sourced, every uncertainty named.**

| Side | What it is |
|---|---|
| **Atlas** (timeline) | An interactive deep-time atlas, c. 7000 BCE → present. Eras → slices → entries. Every entry carries an honesty tag on its dating (firm / traditional / contested / evolved), scientific dating evidence where it exists, coordinates and current custodianship, and — where documented — a hop-by-hop **through-line to modern usage** (Suśruta → modern rhinoplasty, zero → the global number system, Pāṇini → formal grammars…). The **Great Ideas lens** filters to entries with through-lines, each labeled *documented*, *anticipation*, or *conjectural* — the label is the point. |
| **Ledger** (debunker) | A structured evidence ledger documenting misinformation about Hinduism — **in both directions**. Twelve categories, including **category 9** (overclaims *by* supporters: vimāna aircraft, "NASA Sanskrit" — corrected with the same rigor) and **category 12** (legitimate scholarship, protected from being branded an attack). Entries are color-coded by verdict direction: overclaim / misrepresentation / legitimate scholarship. |

Plus the piece that makes it grow: a **propaganda flagging + detection pipeline**. Anyone can flag a screenshot or link; OCR runs locally in the browser; transparent rules give an instant triage; every flag becomes training signal for an open detection model. See [docs/DETECTION.md](docs/DETECTION.md).

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
npm run validate   # schema + editorial rules over all content
npm run triage -- "Sanskrit was codified by the ancient Pakistani grammarian Panini around the 4th-5th century BCE"
```

That last command demonstrates the detection layer: it fires the *nation-retrojection* rule (modern polity + pre-founding date → anachronism, category 7) and matches the claim to the existing ledger entry — the same code path the web flag form runs in your browser.

## How it's built

- **Stack**: Next.js (App Router) · React · TypeScript · Zod. Content is plain JSON files in `content/` — reviewable in a PR diff, no database, no CMS.
- **One content model, two sides** ([src/lib/schema.ts](src/lib/schema.ts)): atlas and ledger entries share sources, vetting, provenance, and cross-reference each other (`relatedLedger` / `relatedAtlas`).
- **Standards over invention**: [EDTF](https://www.loc.gov/standards/datetime/) for uncertain dates · schema.org **ClaimReview** export for verdicts · **SemEval-2020 Task 11** alignment for technique tags · **PDQ/pHash** for image dedup · weak supervision (Snorkel-style labeling functions) for the detection bootstrap.
- **Provenance as design**: sources, dating evidence, contributor credit, AI-assistance labels, and vetting status render on every card — not in a footnote.
- **Governance** ([docs/GOVERNANCE.md](docs/GOVERNANCE.md)): anyone submits (sources required at submission) → trusted vetters verify every citation → publication. AI drafts; humans verify; the seed content in this repo is itself marked `in-review` for that reason.

## Documentation

| doc | what it covers |
|---|---|
| [CLAUDE.md](CLAUDE.md) | **Start here (humans and AI agents alike):** repo map, invariants, recipes, gotchas |
| [docs/API.md](docs/API.md) | data contracts, library API, stable URL contract, planned HTTP API |
| [docs/DETECTION.md](docs/DETECTION.md) | the detection pipeline design and its scientific basis |
| [docs/GOVERNANCE.md](docs/GOVERNANCE.md) | who publishes what, vetting, the AI policy |
| [docs/SECURITY.md](docs/SECURITY.md) | threat model + admin hardening handbook |
| [docs/INDIC-SOURCES.md](docs/INDIC-SOURCES.md) | Indian research infrastructure, cited on merit |

## Contributing

Three doors — flag propaganda (2 minutes, no code), propose an entry (a form), or hack on the pipeline. See [CONTRIBUTING.md](CONTRIBUTING.md). AI-agent contributors: read [CLAUDE.md](CLAUDE.md) first — the validator enforces the project's editorial constitution, and `npm run check` must pass before any PR.

## License

Code MIT · content and docs CC BY-SA 4.0.
