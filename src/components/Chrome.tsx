import Link from "next/link";

export function Masthead({ side }: { side: "atlas" | "ledger" | "playbook" | "drill" | "flag" }) {
  return (
    <header className="masthead">
      <div>
        <Link href="/" className="wordmark">
          <span className="deva">तथ्य</span>tathya
        </Link>
        <div className="tagline">evidence over assertion · every claim sourced · every uncertainty named</div>
      </div>
      <nav className="side-toggle">
        <Link href="/" className={side === "atlas" ? "active" : ""}>
          Atlas · timeline
        </Link>
        <Link href="/ledger" className={side === "ledger" ? "active" : ""}>
          Ledger · debunker
        </Link>
        <Link href="/playbook" className={side === "playbook" ? "active" : ""}>
          Playbook
        </Link>
        <Link href="/drill" className={side === "drill" ? "active" : ""}>
          Drill
        </Link>
        <Link href="/flag" className={side === "flag" ? "active" : ""}>
          Flag it
        </Link>
      </nav>
    </header>
  );
}

export function Principle() {
  return (
    <footer className="principle">
      <span className="deva">तथ्य</span> — the fact. Rules rank the queue; humans issue verdicts. Truth wins,
      always.
    </footer>
  );
}

export function SourceList({
  sources,
  label = "Sources & provenance",
}: {
  sources: { label: string; url?: string; kind: string; detail?: string }[];
  label?: string;
}) {
  return (
    <details className="provenance">
      <summary>
        {label} ({sources.length})
      </summary>
      <ul>
        {sources.map((s, i) => (
          <li key={i}>
            <span className="src-kind">{s.kind}</span>
            {s.url ? (
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.label}
              </a>
            ) : (
              s.label
            )}
            {s.detail ? <> — {s.detail}</> : null}
          </li>
        ))}
      </ul>
    </details>
  );
}

export function VettingLine({
  vetting,
  contributors,
}: {
  vetting: { status: string; vetters: string[]; aiAssisted: boolean };
  contributors: string[];
}) {
  return (
    <div className="vet-line">
      <span className={`vet-badge ${vetting.status}`}>{vetting.status}</span>
      contributors: {contributors.join(", ")}
      {vetting.aiAssisted && " · AI-assisted draft — human verification against cited sources required before publication"}
      {vetting.vetters.length > 0 && ` · vetted by ${vetting.vetters.join(", ")}`}
    </div>
  );
}
