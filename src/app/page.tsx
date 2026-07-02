import { loadAtlas, loadEras, toDevanagari } from "@/lib/content";
import { Masthead, Principle, SourceList, VettingLine } from "@/components/Chrome";
import type { AtlasEntry } from "@/lib/schema";

const TAG_LABEL: Record<string, string> = {
  firm: "firmly dated",
  traditional: "traditional date",
  contested: "contested",
  evolved: "evolved over centuries",
};

function Entry({ e, index }: { e: AtlasEntry; index: number }) {
  return (
    <article className="card" id={e.id}>
      <div className="card-top">
        <h3 className="card-title">
          <span style={{ color: "var(--accent)", marginRight: 10 }}>{toDevanagari(index)}</span>
          {e.title.en}
          {e.title.deva && <span className="deva">{e.title.deva}</span>}
        </h3>
        <span className="kind-chip">{e.kind}</span>
      </div>
      <div className="dating-row">
        <span className={`dating-tag ${e.dating.tag}`}>{TAG_LABEL[e.dating.tag]}</span>
        <span>{e.dating.display}</span>
        <span className="note" title="EDTF — machine-readable date">
          ⟨{e.dating.edtf}⟩
        </span>
      </div>
      <p className="summary">{e.summary}</p>
      <p className="why">
        <b>Why it matters:</b> {e.whyItMatters}
      </p>
      {e.honestyNote && (
        <div className="honesty">
          <b>Named uncertainty:</b> {e.honestyNote}
        </div>
      )}
      {e.dating.positions && e.dating.positions.length > 0 && (
        <div className="honesty">
          <b>Competing positions on the date:</b>
          <ul style={{ margin: "6px 0", paddingLeft: 18 }}>
            {e.dating.positions.map((p, i) => (
              <li key={i}>
                <b style={{ color: "var(--text)" }}>{p.position}</b> — {p.holders}. {p.evidence}
              </li>
            ))}
          </ul>
        </div>
      )}
      {e.dating.scientific && e.dating.scientific.length > 0 && (
        <div className="honesty" style={{ borderLeftColor: "var(--dating-firm)" }}>
          <b style={{ color: "var(--dating-firm)" }}>Scientific dating:</b>
          <ul style={{ margin: "6px 0", paddingLeft: 18 }}>
            {e.dating.scientific.map((s, i) => (
              <li key={i}>
                <b style={{ color: "var(--text)" }}>{s.method}:</b> {s.result}{" "}
                <span className="evidence-src">[{s.source.label}]</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {e.throughLines?.map((tl, i) => (
        <div className="throughline" key={i}>
          <span className="throughline-head">
            Modern through-line → <b>{tl.to}</b>
            <span className={`tl-status ${tl.status}`}>{tl.status}</span>
          </span>
          <ol>
            {tl.chain.map((hop, j) => (
              <li key={j}>{hop}</li>
            ))}
          </ol>
          <SourceList sources={tl.sources} label="Through-line citations" />
        </div>
      ))}
      {e.locations && e.locations.length > 0 && (
        <p className="note">
          📍{" "}
          {e.locations
            .map((l) => `${l.name} (${l.lat.toFixed(2)}, ${l.lng.toFixed(2)})${l.note ? ` — ${l.note}` : ""}`)
            .join(" · ")}
        </p>
      )}
      <SourceList sources={e.sources} />
      <VettingLine vetting={e.vetting} contributors={e.contributors} />
    </article>
  );
}

export default async function AtlasPage({
  searchParams,
}: {
  searchParams: Promise<{ lens?: string }>;
}) {
  const { lens } = await searchParams;
  const greatIdeas = lens === "great-ideas";
  const eras = loadEras();
  const all = loadAtlas();
  const entries = greatIdeas ? all.filter((e) => (e.throughLines?.length ?? 0) > 0) : all;

  let index = 0;
  return (
    <div data-side="atlas">
      <div className="shell">
        <Masthead side="atlas" />
        <div className="lens-bar">
          <a href="/" className={!greatIdeas ? "active" : ""}>
            Full atlas
          </a>
          <a href="/?lens=great-ideas" className={greatIdeas ? "active" : ""}>
            ✦ Great Ideas — contributions with documented modern through-lines
          </a>
        </div>
        {greatIdeas && (
          <p className="note" style={{ marginTop: 14 }}>
            Each through-line is labeled: <b>documented</b> (causal chain in the record), <b>anticipation</b>{" "}
            (idea existed first; no transmission chain), or <b>conjectural</b> (transmission hypothesized,
            unproven). The label is the point.
          </p>
        )}
        {eras.map((era) => {
          const inEra = entries.filter((e) => e.era === era.id);
          if (inEra.length === 0) return null;
          const slices = [...new Set(inEra.map((e) => e.slice))];
          return (
            <section className="era" key={era.id}>
              <div className="era-head">
                <span className="era-index">{toDevanagari(era.order)}</span>
                <h2 className="era-name">{era.name}</h2>
                <span className="era-span">{era.span}</span>
              </div>
              {slices.map((slice) => (
                <div key={slice}>
                  <div className="slice-name">{slice}</div>
                  {inEra
                    .filter((e) => e.slice === slice)
                    .map((e) => {
                      index += 1;
                      return <Entry e={e} index={index} key={e.id} />;
                    })}
                </div>
              ))}
            </section>
          );
        })}
        <Principle />
      </div>
    </div>
  );
}
