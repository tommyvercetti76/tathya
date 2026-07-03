# Threat model & hardening — the admin handbook

A project that debunks propaganda **will be attacked** — not hypothetically. This document is the handover brief: what the assets are, how each gets attacked, what already defends it, and what an admin must switch on. Vulnerability reporting: see [/SECURITY.md](../SECURITY.md).

Design stance that does most of the defending: **no database, no server state, no user accounts.** Content is git; the site is statically generated; detection runs in the reader's browser; intake flows through GitHub issues (public, auditable, someone else's abuse team). Most web attack classes have nothing to grab.

---

## Asset 1 — content integrity (the crown jewel)

The product is trust. One fabricated citation that ships kills more value than any outage.

| attack | defense (✅ = built, ☐ = admin must enable, ◇ = roadmap) |
|---|---|
| Poisoned PR: subtle verdict edit, fake source added | ✅ validator invariants (CLAUDE.md §Invariants) · ☐ branch protection: required CI + ≥1 CODEOWNERS review, no direct pushes to `main` · ☐ fill in `.github/CODEOWNERS` |
| Citation fraud (source doesn't say what the entry claims) | ✅ `vetting` provenance + AI-draft labeling · governance rule: vetter opens every citation before `published` · ◇ CI link-checker for dead URLs (flags rot) |
| Gradual drift: many small "tone" edits shifting a verdict | ☐ protected-file rule: verdict/quickRebuttal changes require a second reviewer · ✅ git history is the audit log — never squash content history |
| Unicode tricks (homoglyph URLs, bidi overrides in quotes) | ✅ https-only URLs schema-enforced · ◇ add NFC-normalization + bidi-control-char check to `validate.ts` |
| One-sided rot (ledger becomes a fan page) | ✅ category-9 machinery + validator symmetry rules · ◇ publish the correction rate and the cat-9 share as public stats — if cat-9 goes to zero, the rot is visible |
| "Who fact-checks you?" delegitimization | ✅ every entry shows sources, vetters, AI-assistance, status · ◇ public corrections ledger ("we were wrong" page) — the cheapest trust ever bought |

## Asset 2 — the intake & training data (poisoning surface)

Flags are labels for the future model; coordinated false flags are a real vector.

- ✅ Flags never auto-publish anything — they rank a **human** queue; rule hits are deterministic anchors that a flood can't shift.
- ✅ Bust kits are deterministic templates over vetted entries — no model, nothing to prompt-inject. Keep it that way: **any future LLM step drafts for humans and never writes to published content.**
- ◇ v2 (per the Debunker 2.0 plan): per-source flag caps, disagreement sampling, and Community-Notes-style bridging before any verdict — agreement required across raters who usually disagree.
- ✅ Privacy by architecture: screenshots are OCR'd **in the reader's browser** and never uploaded. Keep this invariant; it is both a privacy promise and a "we hold no PII" defense. ◇ If image upload is ever added: strip EXIF client-side first.

## Asset 3 — the web app

- ✅ React auto-escaping everywhere; `dangerouslySetInnerHTML` is banned (grep for it in review).
- ✅ https-only URLs enforced in the schema (`javascript:`/`data:`/`http:` cannot enter content).
- ✅ External links use `rel="noreferrer"`; security headers set in `next.config.mjs` (nosniff, DENY framing, referrer policy, permissions policy); `poweredByHeader` off.
- ◇ Full CSP: blocked on two roadmap items — self-host tesseract.js wasm + traineddata (currently CDN-fetched at runtime: a supply-chain and CSP hole) and self-host entry images (currently hotlinked from Wikimedia Commons: fine for v0, but an availability + fingerprinting dependency). After both: `script-src 'self' 'wasm-unsafe-eval'; img-src 'self'; default-src 'self'`.

## Asset 4 — supply chain & CI

- ✅ 4 runtime deps total (next, react/react-dom, zod, tesseract.js); detection pipeline is deliberately dependency-free. Treat every new dependency as a security decision.
- ✅ `package-lock.json` committed; CI uses `npm ci`; workflow token is read-only (`permissions: contents: read`).
- ☐ Enable Dependabot (or `npm audit` in CI) · ☐ pin GitHub Actions to commit SHAs · ☐ require 2FA for the org · ☐ enable GitHub private vulnerability reporting · ☐ sign releases/tags.
- ✅ No secrets exist in the repo (nothing to leak — keep it that way; the static architecture needs none).

## Asset 5 — the humans

The likeliest real-world attack is not technical: it is harassment, brigading, and legal intimidation of maintainers.

- ☐ Allow pseudonymous vetters; vetter names in `vetting.vetters` may be stable handles, not legal names. Never require contributor PII.
- ☐ Issue hygiene: templates already constrain input; add a triage-label bot and a lock-after-resolution policy; brigaded issues get locked, not argued.
- Defamation posture (already built into the content model — keep the discipline): verdicts attach to **claims, never to people**; `asCirculated` quotes the claim, entries cite archives rather than rehosting content; screenshots minimal and evidentiary. The "what's true" concession in every entry is also legal armor — it demonstrates good faith adjudication.
- ◇ Archive-on-flag (v2): snapshot flagged content at intake — evidence survives deletion and takedown pressure.

## Asset 6 — availability & continuity

- ✅ Static site + content-in-git = trivially mirrorable; any fork is a full backup; GitHub Pages/Netlify/Vercel/IPFS all work. There is no database to ransom.
- ☐ Admin continuity: ≥2 org owners; recovery codes stored offline; CODEOWNERS covers `content/`, `src/lib/schema.ts`, `scripts/validate.ts` (the trust-critical trio).

---

## Handover checklist (do these on day one)

1. GitHub: branch protection on `main` — required CI, required review, no force-push, no direct push.
2. Fill `.github/CODEOWNERS`; minimum two owners; 2FA enforced.
3. Enable Dependabot + private vulnerability reporting; set the contact in `/SECURITY.md`.
4. Replace `REPO_ISSUES_URL` placeholder in `src/components/FlagForm.tsx` with the real repo.
5. Read the invariants in `CLAUDE.md` — they are the constitution; the validator enforces them; never merge a PR that weakens the validator without a governance discussion.
6. Schedule the two CSP prerequisites (self-host tesseract assets, self-host images) as the first infrastructure milestones.
