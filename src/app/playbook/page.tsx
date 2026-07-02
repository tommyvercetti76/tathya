import { loadLedger, loadTechniques, loadTradecraft, toDevanagari } from "@/lib/content";
import { Masthead, Principle } from "@/components/Chrome";
import { AchMatrix } from "@/components/AchMatrix";
import { SourceGrader } from "@/components/SourceGrader";

/**
 * The prebunking page: technique cards (collapsed — scan the tells, expand for
 * the counter), Kauṭilya's intelligence doctrine, and declassified analyst
 * tradecraft with live tools. The vaccine; the ledger is the treatment.
 */
export default function PlaybookPage() {
  const { techniques } = loadTechniques();
  const tc = loadTradecraft();
  const ledger = loadLedger();
  const usedBy = (id: string) => ledger.filter((e) => e.techniques?.includes(id));

  return (
    <div data-side="ledger">
      <div className="shell">
        <Masthead side="playbook" />
        <h2 className="playbook-title">The playbook</h2>
        <p className="note">
          Propaganda is template-driven: {techniques.length} shapes, reskinned endlessly. Scan the tells below,
          expand any card for the counter — then <a href="/drill">run the drill</a> to make it reflex. Prebunking
          beats debunking (inoculation theory: McGuire 1961; Roozenbeek &amp; van der Linden RCTs, 2019–22;
          Lewandowsky et al., <i>The Debunking Handbook</i>, 2020).
        </p>

        <div className="pb-grid">
          {techniques.map((t, i) => (
            <details className="pb-card" id={t.id} key={t.id}>
              <summary>
                <span className="tindex">{toDevanagari(i + 1)}</span>
                <b>{t.name}</b>
                <span className="pb-tell">{t.tell}</span>
              </summary>
              <p className="summary">{t.definition}</p>
              <div className="truth-cell true" style={{ margin: "10px 0" }}>
                <h4>The counter</h4>
                {t.counter}
              </div>
              <blockquote className="as-circulated">example: {t.example}</blockquote>
              {usedBy(t.id).length > 0 && (
                <p className="note">
                  busted in the ledger:{" "}
                  {usedBy(t.id).map((e, j) => (
                    <span key={e.id}>
                      {j > 0 && " · "}
                      <a href={`/ledger#${e.id}`}>{e.claim.text.slice(0, 55)}…</a>
                    </span>
                  ))}
                </p>
              )}
            </details>
          ))}
        </div>

        <h2 className="playbook-title">{tc.kautilya.title}</h2>
        <p className="note">{tc.kautilya.intro}</p>
        <div className="pb-grid">
          {tc.kautilya.items.map((k) => (
            <details className="pb-card tc-card" id={k.id} key={k.id}>
              <summary>
                <b>{k.name}</b>
                <span className="pb-tell">{k.source}</span>
              </summary>
              <div className="truth-grid">
                <div className="truth-cell distorted">
                  <h4>Then — {k.source}</h4>
                  {k.ancient}
                </div>
                <div className="truth-cell true">
                  <h4>Now</h4>
                  {k.modern}
                </div>
              </div>
              <div className="tc-drill">⚔ {k.drill}</div>
            </details>
          ))}
        </div>

        <h2 className="playbook-title">{tc.analyst.title}</h2>
        <p className="note">{tc.analyst.intro}</p>
        <div className="pb-grid">
          {tc.analyst.items.map((k) => (
            <details className="pb-card tc-card" id={k.id} key={k.id}>
              <summary>
                <b>{k.name}</b>
                <span className="pb-tell">{k.source}</span>
              </summary>
              <p className="summary">{k.how}</p>
              <div className="tc-drill">⚔ {k.drill}</div>
            </details>
          ))}
        </div>

        <h3 className="playbook-title" style={{ fontSize: "1.1rem" }}>
          Live tool · grade a source (Admiralty code)
        </h3>
        <SourceGrader />

        <h3 className="playbook-title" style={{ fontSize: "1.1rem" }}>
          Live tool · Analysis of Competing Hypotheses
        </h3>
        <AchMatrix question={tc.achDemo.question} hypotheses={tc.achDemo.hypotheses} evidence={tc.achDemo.evidence} />

        <Principle />
      </div>
    </div>
  );
}
