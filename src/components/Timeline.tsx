"use client";

/**
 * Interactive era timeline for the Atlas.
 *
 * Nesting model (select to descend):
 *   era rail (whole deep-time span, sticky, scroll-spied)
 *     └─ era section (click a rail segment to jump)
 *         └─ thematic slice
 *             └─ entry row (collapsed: title · dating tag · date · kind)
 *                 └─ full evidence card (summary, uncertainties, positions,
 *                    scientific dating, through-lines, sources, vetting)
 */
import { useEffect, useState } from "react";
import type { AtlasEntry, Era } from "@/lib/schema";
import { toDevanagari } from "@/lib/deva";
import { SourceList, VettingLine } from "@/components/Chrome";

const TAG_LABEL: Record<string, string> = {
  firm: "firmly dated",
  traditional: "traditional date",
  contested: "contested",
  evolved: "evolved over centuries",
};

const TIE_LABEL: Record<string, string> = {
  "direct-scriptural": "direct scriptural tie",
  "living-practice": "living practice",
  "historical-lineage": "historical lineage",
  "contested-continuity": "contested continuity",
  substrate: "substrate (pre-Vedic)",
};

function EntryDetail({ e }: { e: AtlasEntry }) {
  return (
    <div className="tcard-body">
      {e.image && (
        <figure className="tfigure">
          <img src={e.image.src} alt={e.image.alt} loading="lazy" />
          <figcaption>
            {e.image.alt}
            {" · "}
            {e.image.credit ? `${e.image.credit} · ` : ""}
            {e.image.license ?? ""}
            {e.image.sourceUrl && (
              <>
                {" · "}
                <a href={e.image.sourceUrl} target="_blank" rel="noreferrer">
                  source
                </a>
              </>
            )}
          </figcaption>
        </figure>
      )}
      <div className="dating-row">
        <span className={`dating-tag ${e.dating.tag}`}>{TAG_LABEL[e.dating.tag]}</span>
        <span>{e.dating.display}</span>
        <span className="note" title="EDTF — machine-readable date">
          ⟨{e.dating.edtf}⟩
        </span>
      </div>
      {e.dharmicTie && (
        <div className={`dharmic dharmic-${e.dharmicTie.status}`}>
          <div className="dharmic-head">
            <span className={`tie-chip ${e.dharmicTie.status}`}>{TIE_LABEL[e.dharmicTie.status]}</span>
            <span className="dharmic-label">Tie to Sanātana Dharma</span>
          </div>
          <p>{e.dharmicTie.statement}</p>
          {e.dharmicTie.scriptureRefs && e.dharmicTie.scriptureRefs.length > 0 && (
            <ul className="scripture-refs">
              {e.dharmicTie.scriptureRefs.map((s, i) => (
                <li key={i}>
                  <b>{s.ref}</b>
                  {s.text && <> — {s.text}</>}
                  {s.link && (
                    <>
                      {" "}
                      <a href={s.link} target="_blank" rel="noreferrer">
                        text ↗
                      </a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <p className="summary">{e.summary}</p>
      <p className="why">
        <b>Why it matters:</b> {e.whyItMatters}
      </p>
      {e.custody && (
        <div className="facts">
          <div className="facts-title">Custody — who holds it, and why</div>
          <div className="fact-row">
            <span className="fact-key">Held by</span>
            <span>{e.custody.holder}</span>
          </div>
          <div className="fact-row">
            <span className="fact-key">Where</span>
            <span>{e.custody.place}</span>
          </div>
          <div className="fact-row">
            <span className="fact-key">Why there</span>
            <span>{e.custody.legalBasis}</span>
          </div>
          {e.custody.parallels && (
            <div className="fact-row">
              <span className="fact-key">Similar, held abroad</span>
              <ul className="parallel-list">
                {e.custody.parallels.map((p, i) => (
                  <li key={i}>
                    <b>{p.name}</b> — {p.holder}
                    {p.note && <span className="note"> ({p.note})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
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
    </div>
  );
}

function EntryCard({
  e,
  index,
  open,
  onToggle,
}: {
  e: AtlasEntry;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <article className={`tcard ${open ? "open" : ""}`} id={e.id} data-tag={e.dating.tag}>
      <button className="tcard-head" onClick={onToggle} aria-expanded={open}>
        {e.image ? (
          <img className="tthumb" src={e.image.src} alt="" loading="lazy" aria-hidden />
        ) : (
          <span className="tthumb tthumb-empty" aria-hidden>
            {e.title.deva?.[0] ?? e.title.en[0]}
          </span>
        )}
        <span className="tindex">{toDevanagari(index)}</span>
        <span className="tcard-title">
          {e.title.en}
          {e.title.deva && <span className="deva"> {e.title.deva}</span>}
        </span>
        <span className={`dating-tag ${e.dating.tag}`}>{TAG_LABEL[e.dating.tag]}</span>
        <span className="tcard-date">{e.dating.display}</span>
        <span className="kind-chip">{e.kind}</span>
        <span className="chev" aria-hidden>
          ▸
        </span>
      </button>
      {open && <EntryDetail e={e} />}
    </article>
  );
}

export function Timeline({ eras, entries }: { eras: Era[]; entries: AtlasEntry[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [activeEra, setActiveEra] = useState<string>(eras[0]?.id ?? "");

  // Scroll-spy: highlight the era currently in view on the sticky rail.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (obs) => {
        for (const o of obs) {
          if (o.isIntersecting) setActiveEra(o.target.getAttribute("data-era") ?? "");
        }
      },
      { rootMargin: "-25% 0px -65% 0px" }
    );
    document.querySelectorAll("section[data-era]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [entries]);

  // Deep link: /#entry-id opens and centers that entry.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id && entries.some((e) => e.id === id)) {
      setOpen((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: "center" }), 60);
    }
  }, [entries]);

  const jump = (eraId: string) =>
    document.getElementById(`era-${eraId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  let index = 0;
  return (
    <>
      <nav className="era-rail" aria-label="Eras — 7000 BCE to the present">
        {eras.map((era) => {
          const count = entries.filter((e) => e.era === era.id).length;
          return (
            <button
              key={era.id}
              className={activeEra === era.id ? "active" : ""}
              onClick={() => jump(era.id)}
              title={`${era.name} · ${era.span} · ${count} entries`}
            >
              <span className="rail-num">{toDevanagari(era.order)}</span>
              <span className="rail-name">{era.name}</span>
              <span className="rail-span">{era.span}</span>
            </button>
          );
        })}
      </nav>

      {eras.map((era) => {
        const inEra = entries.filter((e) => e.era === era.id);
        const slices = [...new Set(inEra.map((e) => e.slice))];
        return (
          <section className="era" key={era.id} id={`era-${era.id}`} data-era={era.id}>
            <div className="era-head">
              <span className="era-index">{toDevanagari(era.order)}</span>
              <h2 className="era-name">{era.name}</h2>
              <span className="era-span">{era.span}</span>
              <span className="era-count">
                {inEra.length === 0 ? "no entries yet" : `${inEra.length} ${inEra.length === 1 ? "entry" : "entries"}`}
              </span>
            </div>
            {inEra.length === 0 && (
              <p className="note" style={{ marginLeft: 34 }}>
                Nothing documented in this era yet — <a href="/flag">flag something</a> or propose an entry.
              </p>
            )}
            {slices.map((slice) => (
              <div key={slice}>
                <div className="slice-name">{slice}</div>
                <div className="spine">
                  {inEra
                    .filter((e) => e.slice === slice)
                    .map((e) => {
                      index += 1;
                      return (
                        <EntryCard
                          key={e.id}
                          e={e}
                          index={index}
                          open={!!open[e.id]}
                          onToggle={() => setOpen((prev) => ({ ...prev, [e.id]: !prev[e.id] }))}
                        />
                      );
                    })}
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </>
  );
}
