import { loadDrills, loadTechniques } from "@/lib/content";
import { Masthead, Principle } from "@/components/Chrome";
import { Drill } from "@/components/Drill";

export default function DrillPage() {
  const { items } = loadDrills();
  const techNames = Object.fromEntries(loadTechniques().techniques.map((t) => [t.id, t.name]));

  return (
    <div data-side="ledger">
      <div className="shell">
        <Masthead side="drill" />
        <h2 className="playbook-title">Drill — spot it before it spots you</h2>
        <p className="note">
          {items.length} posts, modeled on what actually circulates. Call the technique — or call it{" "}
          <b>legitimate</b>, because firing on real scholarship is also failing the drill. Prebunking games like
          this are RCT-validated (Roozenbeek &amp; van der Linden, 2019–2022): once you know the shape, the
          template stops working on you.
        </p>
        <Drill items={items} techNames={techNames} />
        <Principle />
      </div>
    </div>
  );
}
