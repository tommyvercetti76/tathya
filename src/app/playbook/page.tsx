import { loadLedger, loadTechniques, toDevanagari } from "@/lib/content";
import { Masthead, Principle } from "@/components/Chrome";

/**
 * The prebunking page. Inoculation research (McGuire 1961; Roozenbeek &
 * van der Linden, 2019–2022) shows that teaching the SHAPE of a manipulation
 * before people meet it measurably reduces its effect — prebunking beats
 * debunking. This page is the vaccine; the ledger is the treatment.
 */
export default function PlaybookPage() {
  const { techniques } = loadTechniques();
  const ledger = loadLedger();
  const usedBy = (id: string) => ledger.filter((e) => e.techniques?.includes(id));

  return (
    <div data-side="ledger">
      <div className="shell">
        <Masthead side="playbook" />
        <h2 className="playbook-title">The propaganda playbook</h2>
        <p className="note">
          Propaganda about Sanātana Dharma is template-driven: a handful of manipulation shapes, reskinned
          endlessly. Inoculation research shows that learning the shape <i>before</i> you meet it measurably
          blunts its effect (McGuire&apos;s inoculation theory; Roozenbeek &amp; van der Linden&apos;s randomized
          prebunking trials, 2019–2022; Lewandowsky et al., <i>The Debunking Handbook</i>, 2020). Learn these{" "}
          {techniques.length} shapes and most of what you&apos;ll see stops working on you — that is the
          mechanism.
        </p>
        {techniques.map((t, i) => (
          <article className="card" id={t.id} key={t.id}>
            <div className="card-top">
              <h3 className="card-title">
                <span style={{ color: "var(--accent)", marginRight: 10 }}>{toDevanagari(i + 1)}</span>
                {t.name}
              </h3>
              <span className="kind-chip">categories {t.categories.join(", ")}</span>
            </div>
            <p className="summary">{t.definition}</p>
            <div className="truth-grid">
              <div className="truth-cell distorted">
                <h4>The tell — how to spot it</h4>
                {t.tell}
              </div>
              <div className="truth-cell true">
                <h4>The counter — how to answer it</h4>
                {t.counter}
              </div>
            </div>
            <blockquote className="as-circulated">example: {t.example}</blockquote>
            {usedBy(t.id).length > 0 && (
              <p className="note">
                busted in the ledger:{" "}
                {usedBy(t.id).map((e, j) => (
                  <span key={e.id}>
                    {j > 0 && " · "}
                    <a href={`/ledger#${e.id}`}>{e.claim.text.slice(0, 60)}…</a>
                  </span>
                ))}
              </p>
            )}
          </article>
        ))}
        <Principle />
      </div>
    </div>
  );
}
