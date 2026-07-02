"use client";

import { useState } from "react";

/** Interactive Admiralty/NATO source grading (AJP-2.1): two axes, graded separately. */
const RELIABILITY = [
  ["A", "Completely reliable — long record, no doubt"],
  ["B", "Usually reliable — minor doubt"],
  ["C", "Fairly reliable — has been right before"],
  ["D", "Not usually reliable — significant doubt"],
  ["E", "Unreliable — record of being wrong"],
  ["F", "Cannot be judged — unknown source"],
] as const;

const CREDIBILITY = [
  ["1", "Confirmed by independent sources"],
  ["2", "Probably true — logical, consistent, partly corroborated"],
  ["3", "Possibly true — plausible, uncorroborated"],
  ["4", "Doubtful — not logical, no corroboration"],
  ["5", "Improbable — contradicted by known facts"],
  ["6", "Cannot be judged"],
] as const;

function advice(r: string, c: string): string {
  const rGood = "AB".includes(r);
  const cGood = "12".includes(c);
  const rBad = "DEF".includes(r);
  const cBad = "456".includes(c);
  if (rGood && cGood) return "Solid — cite it, with the grade. This is what tathya's flagship entries are built from (≥5 independent sources at this level).";
  if (rBad && cBad) return "Do not amplify. Not even to dunk on it — engagement is oxygen. Flag it instead.";
  if (rGood && cBad) return "Reliable source, weak claim — even good outlets carry unconfirmed items. Wait for independent confirmation (Kauṭilya's three-report rule).";
  if (rBad && cGood) return "True claim, junk messenger — find the primary source and cite THAT instead. Never launder a claim through a bad account.";
  return "Middle of the board: usable as a lead, not as a fact. Trace to the original before repeating (SIFT).";
}

export function SourceGrader() {
  const [r, setR] = useState<string | null>(null);
  const [c, setC] = useState<string | null>(null);
  return (
    <div className="grader">
      <div className="grader-cols">
        <div>
          <div className="grader-axis">Source reliability</div>
          {RELIABILITY.map(([k, desc]) => (
            <button key={k} className={`grader-opt ${r === k ? "on" : ""}`} onClick={() => setR(k)}>
              <b>{k}</b> {desc}
            </button>
          ))}
        </div>
        <div>
          <div className="grader-axis">Claim credibility</div>
          {CREDIBILITY.map(([k, desc]) => (
            <button key={k} className={`grader-opt ${c === k ? "on" : ""}`} onClick={() => setC(k)}>
              <b>{k}</b> {desc}
            </button>
          ))}
        </div>
      </div>
      {r && c && (
        <div className="grader-verdict">
          <span className="grader-code">{r}{c}</span>
          {advice(r, c)}
        </div>
      )}
      {!(r && c) && <p className="note">Grade both axes — the whole point is that they are independent.</p>}
    </div>
  );
}
