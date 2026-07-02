/**
 * Deterministic labeling functions — the cheapest, most transparent layer
 * of the tathya detection pipeline (see docs/DETECTION.md).
 *
 * Pattern borrowed from weak supervision (Snorkel; Ratner et al., VLDB 2018):
 * many small, imperfect, explainable rules whose outputs become (a) instant
 * triage hints for vetters and (b) noisy labels for training the real
 * classifier later. Rules NEVER auto-publish a verdict — they rank the queue.
 *
 * Every rule returns the exact span that fired, so a non-techie reviewer
 * can see WHY something was flagged.
 */

export type RuleHit = {
  rule: string;
  category: number; // taxonomy category id (1..12)
  technique: string;
  matched: string;
  confidence: "high" | "medium" | "low";
};

/** Modern polities commonly retrojected onto the ancient past, with founding years. */
const MODERN_POLITIES: Record<string, number> = {
  pakistan: 1947,
  pakistani: 1947,
  bangladesh: 1971,
  bangladeshi: 1971,
  "saudi arabia": 1932,
  indonesia: 1945,
  afghanistan: 1747, // as a nameable polity (Durrani); generous to reduce false positives
};

/** Extract approximate "claimed date" signals from text. Returns years BCE as negative. */
export function extractClaimedDates(text: string): { span: string; year: number }[] {
  const out: { span: string; year: number }[] = [];
  const t = text.toLowerCase();

  // "4th-5th century BCE", "3rd century bc"
  const century = /(\d{1,2})(?:st|nd|rd|th)?(?:\s*[-–—]\s*(\d{1,2})(?:st|nd|rd|th)?)?\s*century\s*(bce|bc|ce|ad)/g;
  for (const m of t.matchAll(century)) {
    const c = parseInt(m[2] ?? m[1], 10);
    const era = m[3];
    const year = era === "ce" || era === "ad" ? (c - 1) * 100 : -((c - 1) * 100 + 50);
    out.push({ span: m[0], year });
  }

  // "1500 BCE", "876 CE"
  const abs = /(\d{3,5})\s*(bce|bc|ce|ad)\b/g;
  for (const m of t.matchAll(abs)) {
    const y = parseInt(m[1], 10);
    out.push({ span: m[0], year: m[2] === "ce" || m[2] === "ad" ? y : -y });
  }

  // "9,000-year-old", "5000 years old/ago"
  const yearsOld = /([\d,]{3,6})[\s-]*(?:year[\s-]*old|years\s*(?:old|ago))/g;
  for (const m of t.matchAll(yearsOld)) {
    const n = parseInt(m[1].replace(/,/g, ""), 10);
    if (n >= 200) out.push({ span: m[0], year: 2026 - n });
  }

  // "ancient" with no explicit date still signals deep past
  const ancient = /\bancient\b/g;
  for (const m of t.matchAll(ancient)) {
    out.push({ span: m[0], year: -500 }); // conservative placeholder
  }
  return out;
}

/** LF1 — nation retrojection: modern polity name + a date preceding its founding. */
export function lfNationRetrojection(text: string): RuleHit[] {
  const t = text.toLowerCase();
  const dates = extractClaimedDates(text);
  const hits: RuleHit[] = [];
  for (const [name, founded] of Object.entries(MODERN_POLITIES)) {
    if (!t.includes(name)) continue;
    // Direct pattern "ancient <polity>" is high confidence on its own.
    const direct = new RegExp(`ancient\\s+${name}`, "i").exec(text);
    if (direct) {
      hits.push({
        rule: "nation-retrojection",
        category: 7,
        technique: "anachronism",
        matched: `"${direct[0]}" (polity founded ${founded})`,
        confidence: "high",
      });
      continue;
    }
    const preFounding = dates.filter((d) => d.year < founded - 100 && d.span !== "ancient");
    if (preFounding.length > 0) {
      hits.push({
        rule: "nation-retrojection",
        category: 7,
        technique: "anachronism",
        matched: `"${name}" + "${preFounding[0].span}" (polity founded ${founded})`,
        confidence: "high",
      });
    }
  }
  return hits;
}

/** LF2 — founding-date fallacy: "X years older than <unfounded tradition>". */
export function lfFoundingDateFallacy(text: string): RuleHit[] {
  const re = /([\d,]+)\s*years?\s*(older|before)\s*than\s*(hinduism|sanatana?\s*dharma|hindu\s*religion)/i;
  const m = re.exec(text);
  if (!m) return [];
  return [
    {
      rule: "founding-date-fallacy",
      category: 5,
      technique: "conflation",
      matched: `"${m[0]}" (assigns a founding date to an unfounded, evolved tradition)`,
      confidence: "high",
    },
  ];
}

/** LF3 — nation-age inflation: "<modern polity>: a N-year-old civilisation". */
export function lfNationAgeInflation(text: string): RuleHit[] {
  const hits: RuleHit[] = [];
  for (const [name, founded] of Object.entries(MODERN_POLITIES)) {
    const re = new RegExp(`${name}[^.!?]{0,40}?([\\d,]{3,6})[\\s-]*year[\\s-]*old`, "i");
    const m = re.exec(text);
    if (m) {
      const claimed = parseInt(m[1].replace(/,/g, ""), 10);
      const actual = 2026 - founded;
      if (claimed > actual * 3) {
        hits.push({
          rule: "nation-age-inflation",
          category: 7,
          technique: "anachronism",
          matched: `"${m[0].trim()}" (polity age ${actual}; claimed ${claimed.toLocaleString()})`,
          confidence: "high",
        });
      }
    }
  }
  return hits;
}

/** LF4 — fabricated institutional endorsement: "<big institution> declared/says <superlative>". */
export function lfFabricatedEndorsement(text: string): RuleHit[] {
  const re = /(nasa|mit|harvard|oxford|un|unesco|einstein)\s+(?:has\s+)?(declared|says|said|announced|confirmed|proved|admits?)\b[^.!?]{0,120}?(best|most|only|greatest|first|perfect)/i;
  const m = re.exec(text);
  if (!m) return [];
  return [
    {
      rule: "fabricated-endorsement",
      category: 10,
      technique: "fabricated institutional endorsement",
      matched: `"${m[0].trim()}" — demand the primary link before believing`,
      confidence: "medium",
    },
  ];
}

/** LF5 — ancient-technology overclaim: "ancient <modern technology>". */
export function lfAncientTech(text: string): RuleHit[] {
  const re = /ancient\s+(?:indian?s?\s+)?(aircraft|aeroplanes?|airplanes?|flying\s+machines?|nuclear\s+\w+|television|internet|stem\s+cells?|plastic\s+surgery|test[\s-]tube)/i;
  const m = re.exec(text);
  if (!m) return [];
  return [
    {
      rule: "ancient-tech-overclaim",
      category: 9,
      technique: "mythology literalized as engineering",
      matched: `"${m[0]}"`,
      confidence: "medium",
    },
  ];
}

/** LF6 — institution inflation: "Taxila university" style term upgrades. */
export function lfInstitutionInflation(text: string): RuleHit[] {
  const re = /(taxila|takshashila)\s+university/i;
  const m = re.exec(text);
  if (!m) return [];
  return [
    {
      rule: "institution-inflation",
      category: 1,
      technique: "term-inflation",
      matched: `"${m[0]}" (famed hub of teachers; not an institutional university — see ledger)`,
      confidence: "medium",
    },
  ];
}

const ALL_RULES = [
  lfNationRetrojection,
  lfFoundingDateFallacy,
  lfNationAgeInflation,
  lfFabricatedEndorsement,
  lfAncientTech,
  lfInstitutionInflation,
];

/** Run every labeling function; dedupe identical (rule, matched) pairs. */
export function runRules(text: string): RuleHit[] {
  const hits = ALL_RULES.flatMap((lf) => lf(text));
  const seen = new Set<string>();
  return hits.filter((h) => {
    const k = `${h.rule}|${h.matched}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
