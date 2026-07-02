/**
 * Text fingerprinting for recycled propaganda.
 *
 * Propaganda circulates as near-duplicates: same template, swapped artifact
 * name, new emoji. SimHash (Charikar 2002 — the scheme Google used for web
 * dedup) maps similar texts to nearby 64-bit fingerprints, so a re-post is
 * caught by Hamming distance even after light edits. Dependency-free (BigInt).
 */

const MASK64 = (1n << 64n) - 1n;

/** FNV-1a 64-bit hash. */
function fnv1a64(s: string): bigint {
  let h = 0xcbf29ce484222325n;
  for (let i = 0; i < s.length; i++) {
    h ^= BigInt(s.charCodeAt(i));
    h = (h * 0x100000001b3n) & MASK64;
  }
  return h;
}

function shingles(text: string, n = 2): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length < n) return words.length ? [words.join(" ")] : [];
  const out: string[] = [];
  for (let i = 0; i <= words.length - n; i++) out.push(words.slice(i, i + n).join(" "));
  return out;
}

/** 64-bit SimHash of a text, as a 16-char hex string. */
export function simhash(text: string): string {
  const votes = new Array<number>(64).fill(0);
  for (const sh of shingles(text)) {
    const h = fnv1a64(sh);
    for (let b = 0; b < 64; b++) {
      votes[b] += (h >> BigInt(b)) & 1n ? 1 : -1;
    }
  }
  let out = 0n;
  for (let b = 0; b < 64; b++) if (votes[b] > 0) out |= 1n << BigInt(b);
  return out.toString(16).padStart(16, "0");
}

/** Hamming distance between two hex fingerprints. <= ~12 bits ≈ near-duplicate. */
export function hamming(a: string, b: string): number {
  let x = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let d = 0;
  while (x) {
    d += Number(x & 1n);
    x >>= 1n;
  }
  return d;
}

export const NEAR_DUPLICATE_BITS = 12;
