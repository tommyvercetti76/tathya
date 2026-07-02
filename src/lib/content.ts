import fs from "node:fs";
import path from "node:path";
import { AtlasEntry, LedgerEntry, Era, Flag } from "./schema";

const ROOT = path.join(process.cwd(), "content");

/** A content file holds one entry (object) or an era bundle (array of entries). */
function readDir<T>(dir: string, parse: (raw: unknown) => T): T[] {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith(".json"))
    .flatMap((f) => {
      const raw = JSON.parse(fs.readFileSync(path.join(full, f), "utf8")) as unknown;
      return (Array.isArray(raw) ? raw : [raw]).map(parse);
    });
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

export type Technique = {
  id: string;
  name: string;
  definition: string;
  tell: string;
  counter: string;
  example: string;
  categories: number[];
};

export function loadTechniques(): { about: string; techniques: Technique[] } {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "techniques.json"), "utf8"));
}

export function loadTaxonomy(): {
  categories: { id: number; key: string; name: string; description: string; example: string }[];
  verdictDirections: { key: string; name: string; color: string; meaning: string }[];
  flagForOptions: string[];
} {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "taxonomy.json"), "utf8"));
}

export { toDevanagari } from "./deva";
