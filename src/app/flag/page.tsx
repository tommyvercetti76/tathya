import { loadLedger, loadTaxonomy } from "@/lib/content";
import { Masthead, Principle } from "@/components/Chrome";
import { FlagForm } from "@/components/FlagForm";

export default function FlagPage() {
  const taxonomy = loadTaxonomy();
  const candidates = loadLedger().map((e) => ({
    id: e.id,
    surface: [e.claim.text, e.claim.asCirculated, ...(e.techniques ?? [])].join(" "),
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
        <FlagForm flagForOptions={taxonomy.flagForOptions} candidates={candidates} />
        <Principle />
      </div>
    </div>
  );
}
