import { loadLedger, loadTaxonomy, toDevanagari } from "@/lib/content";
import { Masthead, Principle, SourceList, VettingLine } from "@/components/Chrome";
import type { LedgerEntry } from "@/lib/schema";

function Entry({
  e,
  catName,
}: {
  e: LedgerEntry;
  catName: string;
}) {
  const v = e.verdict;
  return (
    <article className="card" id={e.id}>
      <div className="card-top">
        <h3 className="card-title">{e.claim.text}</h3>
        <span className={`verdict-chip ${v ? v.direction : "none"}`}>
          {v ? (v.direction === "legitimate" ? "legitimate scholarship" : v.direction) : "no verdict yet"}
        </span>
      </div>
      <div className="dating-row">
        <span className="cat-chip">
          {toDevanagari(e.category)} · category {e.category}: {catName}
        </span>
        <span className="note">spreads on: {e.claim.channels.join(", ")}</span>
      </div>
      <blockquote className="as-circulated">as it circulates: {e.claim.asCirculated}</blockquote>
      {(e.whatsTrue || e.whatsDistorted) && (
        <div className="truth-grid">
          {e.whatsTrue && (
            <div className="truth-cell true">
              <h4>What&apos;s true</h4>
              {e.whatsTrue}
            </div>
          )}
          {e.whatsDistorted && (
            <div className="truth-cell distorted">
              <h4>What&apos;s distorted</h4>
              {e.whatsDistorted}
            </div>
          )}
        </div>
      )}
      <div className="evidence-block">
        {e.evidence.supporting.length > 0 && (
          <>
            <h4>Evidence for the claim as stated</h4>
            <ul>
              {e.evidence.supporting.map((ev, i) => (
                <li key={i}>
                  {ev.point} <span className="evidence-src">[{ev.sources.map((s) => s.label).join("; ")}]</span>
                </li>
              ))}
            </ul>
          </>
        )}
        {e.evidence.countering.length > 0 && (
          <>
            <h4>Evidence against the claim as stated</h4>
            <ul>
              {e.evidence.countering.map((ev, i) => (
                <li key={i}>
                  {ev.point} <span className="evidence-src">[{ev.sources.map((s) => s.label).join("; ")}]</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      {v && (
        <div className="rationale">
          <b>Verdict rationale:</b> {v.rationale}
        </div>
      )}
      {e.techniques && e.techniques.length > 0 && (
        <p className="note">techniques: {e.techniques.join(" · ")}</p>
      )}
      <SourceList sources={e.sources} />
      <VettingLine vetting={e.vetting} contributors={e.contributors} />
    </article>
  );
}

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const taxonomy = loadTaxonomy();
  const all = loadLedger().sort((a, b) => a.category - b.category);
  const active = cat ? parseInt(cat, 10) : undefined;
  const entries = active ? all.filter((e) => e.category === active) : all;

  return (
    <div data-side="ledger">
      <div className="shell">
        <Masthead side="ledger" />
        <p className="note" style={{ marginTop: 16 }}>
          A structured evidence ledger of misinformation, distortion, and overclaim about Hinduism and Sanātana
          Dharma — in <b>both directions</b>. Category ९ corrects overclaims made by supporters with the same
          rigor; category १२ protects genuine scholarship from being branded an attack.
        </p>
        <div className="lens-bar">
          <a href="/ledger" className={!active ? "active" : ""}>
            All
          </a>
          {taxonomy.categories.map((c) => (
            <a
              key={c.id}
              href={`/ledger?cat=${c.id}`}
              className={active === c.id ? "active" : ""}
              title={c.description}
            >
              {toDevanagari(c.id)} {c.name}
            </a>
          ))}
        </div>
        {entries.map((e) => (
          <Entry
            key={e.id}
            e={e}
            catName={taxonomy.categories.find((c) => c.id === e.category)?.name ?? ""}
          />
        ))}
        {entries.length === 0 && <p className="note" style={{ marginTop: 30 }}>No entries in this category yet — submit one.</p>}
        <Principle />
      </div>
    </div>
  );
}
