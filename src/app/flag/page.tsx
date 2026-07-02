import { loadLedger, loadTaxonomy, loadTechniques } from "@/lib/content";
import { Masthead, Principle } from "@/components/Chrome";
import { FlagForm } from "@/components/FlagForm";

export default function FlagPage() {
  const taxonomy = loadTaxonomy();
  const techniques = loadTechniques().techniques.map((t) => ({
    id: t.id,
    name: t.name,
    tell: t.tell,
    counter: t.counter,
  }));
  const entries = loadLedger().map((e) => ({
    id: e.id,
    claimText: [e.claim.text, e.claim.asCirculated, ...(e.spread?.knownVariants ?? [])].join(" "),
    quickRebuttal: e.quickRebuttal,
    verdict: e.verdict?.direction,
    techniques: e.techniques,
    topSources: e.sources.slice(0, 3).map((s) => s.label),
  }));

  return (
    <div data-side="ledger">
      <div className="shell">
        <Masthead side="flag" />
        <p className="note" style={{ marginTop: 16 }}>
          Saw something that looks like propaganda? Flag it. Drop a screenshot (text is read <b>locally in
          your browser</b> — nothing is uploaded anywhere) or paste the text and link. tathya&apos;s rules give
          you an instant read, checks whether we&apos;ve already documented the claim, and your flag — including
          <b> why you flagged it</b> — becomes training signal for the open detection model.
        </p>
        <FlagForm flagForOptions={taxonomy.flagForOptions} entries={entries} techniques={techniques} />
        <Principle />
      </div>
    </div>
  );
}
