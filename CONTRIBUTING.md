# Contributing to tathya

You do not need to know git, JSON, or Sanskrit to contribute. Pick your door:

## Door 1 — I saw propaganda and want to flag it (2 minutes, no account needed to analyze)

Use the **Flag it** page in the app. Drop a screenshot (text is read locally in your browser — never uploaded) or paste the text, tick why you're flagging it, and submit. Submission opens a prefilled GitHub issue; creating it needs a free GitHub account. That's the entire public triage queue — auditable by anyone.

## Door 2 — I want to add or improve an entry (form, no code)

Open a [new issue](../../issues/new/choose) with the **Atlas entry** or **Ledger entry** template. The form asks for exactly what the content model needs — including **sources, which are required at submission**. A vetter will verify every citation before anything publishes.

## Door 3 — I'm technical

- Content lives in `content/atlas/*.json` and `content/ledger/*.json`, one entry per file, validated by `src/lib/schema.ts` (Zod). Run `npm run validate` before a PR.
- Try the detection pipeline: `npm run triage -- "Sanskrit was codified by the ancient Pakistani grammarian Panini"`.
- Detection rules live in `src/lib/detect/rules.ts` — adding a labeling function is a great first PR. Every rule must return the exact span that fired (explainability is non-negotiable).
- Model work: see [docs/DETECTION.md](docs/DETECTION.md). The dataset schema, taxonomy alignment (SemEval-2020 Task 11), and eval requirements (balanced verdict directions, category-12 false-positive gate) are specified there.

## Rules that apply to everyone

- Every claim sourced. Every uncertainty named. Contested topics present positions, not verdicts.
- The same rigor in both directions: overclaims *for* the tradition (category 9) are corrected as firmly as distortions *against* it.
- AI may draft; humans verify. Mark AI-assisted work honestly — it stays in the provenance record.
- Be precise about what's true. Most effective propaganda has a true kernel; conceding it explicitly (`whatsTrue`) is what makes the debunk land.

Code: MIT. Content (`content/`, `docs/`): CC BY-SA 4.0.
