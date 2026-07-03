# Contributing to tathya

You do not need to know git, JSON, or Sanskrit to contribute — and if you do code, you can be productive in ten minutes. Pick your door.

## Get running (all code contributors)

Prerequisites: **Node.js ≥ 20** (22 recommended — see `.nvmrc`) and npm.

```bash
git clone https://github.com/tommyvercetti76/tathya && cd tathya
npm ci                 # install (uses the lockfile)
npm run dev            # → http://localhost:3000
npm run check          # validate content + production build — MUST pass before any PR
npm run triage -- "NASA declared Sanskrit the best language for computers"   # try the pipeline
```

Then read **[CLAUDE.md](CLAUDE.md)** (10 minutes): the repo map, the 11 editorial invariants, and the gotchas. It's written for AI agents, which makes it the fastest human onboarding doc too.

## Where to contribute — pick your lane

### 🎨 Frontend (React / Next.js / CSS)
Pages live in `src/app/` (App Router), components in `src/components/`, all styling in one file: `src/app/globals.css` (CSS custom properties, no Tailwind). Server components load content; interactive pieces are `"use client"`.

Good first tasks: mobile polish on the era rail · keyboard navigation for the Drill · a map view for atlas `locations` · localStorage streak history for `/drill` · dark/light theming.

⚠ Two rules: `src/lib/content.ts` is server-only (imports `node:fs`) — client-safe helpers go in `src/lib/deva.ts`; and never call `Math.random()`/`Date.now()` during render (SSR hydration — see `Drill.tsx` for the pattern).

### ⚙️ Backend / pipeline (TypeScript, dependency-free by design)
The detection pipeline is `src/lib/detect/` — it runs in the browser AND Node, so **no new dependencies** without discussion. `scripts/` holds the CLI tools; `src/lib/schema.ts` + `scripts/validate.ts` are the data contract and its enforcement.

Good first tasks: a new labeling function in `rules.ts` (must return the exact span that fired) · the `POST /api/triage` route (spec in [docs/API.md](docs/API.md) §4) · ClaimReview JSON-LD export · a CI link-checker for source URLs · NFC/bidi-character checks in `validate.ts` · self-hosting the tesseract wasm/traineddata ([docs/SECURITY.md](docs/SECURITY.md) roadmap).

Bigger game (see the Debunker 2.0 plan in [docs/DETECTION.md](docs/DETECTION.md) + issues): the browser extension · the claim store with variant clustering · the multilingual model.

### 📚 Content (no code required)
Entries are plain JSON in `content/` — reviewable as PR diffs. Or skip git entirely: [open an issue form](../../issues/new/choose) (atlas entry, ledger entry, or flag). Sources are required **at submission**; the field-by-field reference is [docs/API.md](docs/API.md) §1; the editorial rules are enforced by `npm run validate`.

Highest-value content work right now: **vetting** — the seed entries are AI-drafted and marked `in-review`; a human opening every citation and signing `vetting.vetters` is what flips them to `published`.

### 🕵️ Detection & research
Flag real propaganda through the app (`/flag`) — every flag with a "why" is training signal. Analyze patterns, propose new techniques for `content/techniques.json` (each needs: definition, tell, counter, example — and ideally a drill item and a rule).

## The PR process

1. Fork → branch → change → `npm run check` passes.
2. Content PRs: one entry (or one coherent set) per PR; every claim sourced; honesty tags honest.
3. Code PRs: match the existing style (no lint config yet — read neighboring code); no new runtime dependencies without an issue first; explain *what breaks without this change*.
4. A maintainer (see `.github/CODEOWNERS`) reviews. Verdict-bearing content gets a second reviewer.
5. CI must be green. That's the whole ceremony.

## Rules that apply to everyone

- Every claim sourced. Every uncertainty named. Contested topics present positions, not verdicts.
- The same rigor in both directions: overclaims *for* the tradition (category 9) are corrected as firmly as distortions *against* it.
- AI may draft; humans verify. Mark AI-assisted work honestly (`aiAssisted: true`) — it stays in the provenance record permanently.
- Verdicts attach to claims, never to people.
- Be precise about what's true — most effective propaganda has a true kernel, and conceding it (`whatsTrue`) is what makes the debunk land.
- [Code of Conduct](CODE_OF_CONDUCT.md) applies everywhere the project lives.

Licensing: code MIT · content (`content/`, `docs/`) CC BY-SA 4.0. By contributing you license your contribution accordingly.
