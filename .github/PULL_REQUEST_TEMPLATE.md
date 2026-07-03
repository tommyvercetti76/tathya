## What & why

<!-- One paragraph: what changes, and what breaks or stays broken without it. -->

## Checklist

- [ ] `npm run check` passes locally (content validation + production build)
- [ ] **Content PRs**: every claim carries a source; dating/dharmic honesty tags are honest; contested topics present positions, not verdicts
- [ ] **Content PRs**: `vetting` block is truthful (`aiAssisted` set if a model helped draft; status stays `in-review` unless a named human vetter verified every citation)
- [ ] **Code PRs**: no new runtime dependencies (or an issue discussing the exception is linked)
- [ ] **Code PRs touching `src/lib/detect/`**: rules still return the exact span that fired; nothing auto-publishes a verdict
- [ ] No changes to the stable URL contract (existing ids/anchors — see [docs/API.md](../docs/API.md) §3)
- [ ] I read the invariants in [CLAUDE.md](../CLAUDE.md) and this PR weakens none of them
