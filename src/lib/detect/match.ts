/**
 * Claim matching: rank existing ledger entries against flagged text.
 *
 * v0.2: TF-IDF weighted cosine over unigrams+bigrams, plus a SimHash
 * near-duplicate check against known circulating variants. Dependency-free,
 * so the same code runs in the browser flag form and the CLI.
 * The documented upgrade path (docs/DETECTION.md) swaps this for multilingual
 * sentence embeddings (CLEF CheckThat! "verified-claim retrieval") behind the
 * same interface.
 */
import { simhash, hamming, NEAR_DUPLICATE_BITS } from "./fingerprint";

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

function terms(text: string): string[] {
  const uni = tokenize(text);
  const bi: string[] = [];
  for (let i = 0; i < uni.length - 1; i++) bi.push(`${uni[i]} ${uni[i + 1]}`);
  return [...uni, ...bi];
}

export type MatchCandidate = {
  id: string;
  /** claim.text + asCirculated + techniques + spread.knownVariants — the match surface */
  surface: string;
  /** known circulating paraphrases, fingerprinted for near-duplicate detection */
  variants?: string[];
};

export type MatchResult = { id: string; score: number; nearDuplicate: boolean };

export function matchClaims(flagText: string, candidates: MatchCandidate[], topK = 3): MatchResult[] {
  // document frequencies over the candidate set
  const df = new Map<string, number>();
  const docs = candidates.map((c) => {
    const t = new Set(terms(c.surface));
    for (const term of t) df.set(term, (df.get(term) ?? 0) + 1);
    return t;
  });
  const N = candidates.length || 1;
  const idf = (term: string) => Math.log(1 + N / (1 + (df.get(term) ?? 0)));

  const qTerms = terms(flagText);
  const qVec = new Map<string, number>();
  for (const t of qTerms) qVec.set(t, (qVec.get(t) ?? 0) + idf(t));
  const qNorm = Math.sqrt([...qVec.values()].reduce((s, v) => s + v * v, 0)) || 1;

  const flagPrint = simhash(flagText);

  return candidates
    .map((c, i) => {
      let dot = 0;
      let dNormSq = 0;
      for (const term of docs[i]) {
        const w = idf(term);
        dNormSq += w * w;
        if (qVec.has(term)) dot += w * (qVec.get(term) ?? 0);
      }
      const cosine = dot / (qNorm * (Math.sqrt(dNormSq) || 1));
      const nearDuplicate = (c.variants ?? [])
        .concat(c.surface)
        .some((v) => hamming(flagPrint, simhash(v)) <= NEAR_DUPLICATE_BITS);
      return {
        id: c.id,
        score: Math.round((nearDuplicate ? Math.max(cosine, 0.9) : cosine) * 100) / 100,
        nearDuplicate,
      };
    })
    .filter((r) => r.score > 0.02)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
