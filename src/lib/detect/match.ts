/**
 * v0 claim matching: rank existing ledger entries against flagged text.
 *
 * Deliberately dependency-free (token Jaccard + bigram boost) so it runs
 * in the browser inside the flag form. The documented upgrade path
 * (docs/DETECTION.md) swaps this for multilingual sentence embeddings
 * (the "claim retrieval" task from CLEF CheckThat!) behind the same
 * interface — callers only see id + score.
 */

const STOP = new Set(
  "a an the is are was were be been being of in on at to from by with for and or not no this that these those it its as their our your his her they them he she we you i has have had do does did will would can could than then so such very really just also only even more most about into over under out up down".split(
    " "
  )
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w));
}

function bigrams(tokens: string[]): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i < tokens.length - 1; i++) out.add(`${tokens[i]} ${tokens[i + 1]}`);
  return out;
}

function jaccard<T>(a: Set<T>, b: Set<T>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

export type MatchCandidate = {
  id: string;
  /** concatenated claim.text + asCirculated + techniques — the match surface */
  surface: string;
};

export function matchClaims(
  flagText: string,
  candidates: MatchCandidate[],
  topK = 3
): { id: string; score: number }[] {
  const ft = tokenize(flagText);
  const fSet = new Set(ft);
  const fBi = bigrams(ft);
  return candidates
    .map((c) => {
      const ct = tokenize(c.surface);
      const uni = jaccard(fSet, new Set(ct));
      const bi = jaccard(fBi, bigrams(ct));
      return { id: c.id, score: Math.round((0.6 * uni + 0.4 * bi) * 100) / 100 };
    })
    .filter((r) => r.score > 0.02)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
