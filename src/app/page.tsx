import { loadAtlas, loadEras } from "@/lib/content";
import { Masthead, Principle } from "@/components/Chrome";
import { Timeline } from "@/components/Timeline";

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
        <Timeline eras={eras} entries={entries} />
        <Principle />
      </div>
    </div>
  );
}
