import fs from "node:fs";
import path from "node:path";
import { AtlasEntry, LedgerEntry, Era, Flag } from "./schema";

const ROOT = path.join(process.cwd(), "content");

function readDir<T>(dir: string, parse: (raw: unknown) => T): T[] {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith(".json"))
    .map((f) => parse(JSON.parse(fs.readFileSync(path.join(full, f), "utf8"))));
}

export function loadAtlas(): AtlasEntry[] {
  return readDir("atlas", (raw) => AtlasEntry.parse(raw));
}

export function loadLedger(): LedgerEntry[] {
  return readDir("ledger", (raw) => LedgerEntry.parse(raw));
}

export function loadEras(): Era[] {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, "eras.json"), "utf8")) as unknown[];
  return raw.map((e) => Era.parse(e)).sort((a, b) => a.order - b.order);
}

export function loadFlags(): Flag[] {
  const p = path.join(ROOT, "flags", "samples.json");
  if (!fs.existsSync(p)) return [];
  return (JSON.parse(fs.readFileSync(p, "utf8")) as unknown[]).map((f) => Flag.parse(f));
}

export function loadTaxonomy(): {
  categories: { id: number; key: string; name: string; description: string; example: string }[];
  verdictDirections: { key: string; name: string; color: string; meaning: string }[];
  flagForOptions: string[];
} {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "taxonomy.json"), "utf8"));
}

/** Devanāgarī numeral indexing: 1 → १, 108 → १०८ */
export function toDevanagari(n: number): string {
  const digits = "०१२३४५६७८९";
  return String(n)
    .split("")
    .map((d) => (/\d/.test(d) ? digits[Number(d)] : d))
    .join("");
}
