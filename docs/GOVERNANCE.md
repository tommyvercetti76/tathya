# Governance — how anything gets published

One principle: **evidence over assertion, every claim sourced, every uncertainty named.** The same standard of evidence applies whether a claim is favorable or unfavorable to the tradition.

## Roles

- **Contributor** — anyone. Submits entries or flags through the forms (web form → GitHub issue, or a PR directly). No git knowledge required for the form path.
- **Vetter** — a trusted reviewer with a track record (starts as the maintainer team; grows by invitation based on review quality). Verifies each cited source actually says what the entry claims, checks category assignment, and approves publication.
- **Maintainer** — merges, resolves vetter disagreements, owns the eval sets.

## The pipeline

1. **Submission** — sources are required *at submission*. A claim with no sources is returned, not queued.
2. **Triage** — automatic: schema validation (`npm run validate`), rule hits, claim matching against existing entries (dupes get merged as `exampleRefs`, not new entries).
3. **Vetting** — a human vetter checks every citation against the source. AI may draft; AI never verifies. The `vetting` block records `aiAssisted`, the named vetters, and the review date — visibly, on every entry.
4. **Publication** — status flips to `published` only with ≥1 named vetter (flagship entries: 2). CI blocks `published` + zero vetters.

## Hard editorial rules (enforced by `scripts/validate.ts` where possible)

- Flagship atlas entries: **≥ 5 independent sources**.
- `contested` dating: competing positions **must** be listed — the entry presents positions, not a verdict.
- Ledger entries must include evidence **for** the claim as stated (or explicitly concede the kernel of truth in `whatsTrue`), not only against.
- Category 12 (legitimate debate) can never carry an `overclaim`/`misrepresentation` verdict.
- Category 9 exists and gets used. An atlas that only debunks outsiders is a marketing site; an atlas that also corrects its own side is a reference.
- Contested entries present competing positions rather than asserting a verdict.

## AI policy

Contributors may use local or hosted AI models to draft entries. AI output is treated exactly like an anonymous tip: useful for drafting, worth nothing as evidence. Publication requires a human vetter to have opened every cited source. Entries drafted with AI are labeled `aiAssisted: true` forever — provenance is a design feature.

The seed content in this repository was AI-drafted and is marked `in-review`, not `published`, for exactly this reason.
