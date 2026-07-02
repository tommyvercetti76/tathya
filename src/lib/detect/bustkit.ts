/**
 * The bust kit: turn a flagged post into a copy-ready, sourced rebuttal.
 *
 * Deterministic templating over vetted ledger content — no model in the loop,
 * so every sentence in the kit traces to an entry a human can check. Follows
 * the Debunking Handbook (Lewandowsky et al., 2020) structure: lead with the
 * fact, name the technique (the fallacy), cite, link.
 */
import { runRules, type RuleHit } from "./rules";
import { matchClaims, type MatchCandidate, type MatchResult } from "./match";

export type BustEntry = {
  id: string;
  claimText: string;
  quickRebuttal?: string;
  verdict?: string;
  techniques?: string[];
  topSources: string[];
};

export type TechniqueInfo = { id: string; name: string; tell: string; counter: string };

export type BustKit = {
  ruleHits: RuleHit[];
  matches: MatchResult[];
  text: string; // the copy-ready rebuttal
  isNewClaim: boolean;
};

export function buildBustKit(
  flagText: string,
  entries: BustEntry[],
  techniques: TechniqueInfo[],
  siteBase = ""
): BustKit {
  const ruleHits = runRules(flagText);
  const candidates: MatchCandidate[] = entries.map((e) => ({
    id: e.id,
    surface: [e.claimText, ...(e.techniques ?? [])].join(" "),
    variants: [],
  }));
  const matches = matchClaims(flagText, candidates);
  const byId = new Map(entries.map((e) => [e.id, e]));
  const techById = new Map(techniques.map((t) => [t.id, t]));

  const lines: string[] = [];
  const top = matches[0] ? byId.get(matches[0].id) : undefined;

  if (top?.quickRebuttal) {
    lines.push(top.quickRebuttal);
  }

  const namedTechniques = [
    ...new Set(
      ruleHits
        .map((h) => techById.get(h.technique))
        .filter((t): t is TechniqueInfo => !!t)
        .map((t) => `${t.name}: ${t.tell}`)
    ),
  ];
  if (namedTechniques.length > 0) {
    lines.push("", "The technique at work:");
    for (const t of namedTechniques.slice(0, 3)) lines.push(`• ${t}`);
  }

  if (top) {
    lines.push(
      "",
      `Sources: ${top.topSources.slice(0, 3).join(" · ")}`,
      `Full evidence ledger: ${siteBase}/ledger#${top.id}`
    );
  } else if (ruleHits.length > 0) {
    lines.push(
      "",
      "This pattern is documented, but the specific claim isn't in the ledger yet — flag it so a vetter can add it with sources."
    );
  }

  return {
    ruleHits,
    matches,
    text: lines.join("\n").trim(),
    isNewClaim: !top && ruleHits.length > 0,
  };
}
