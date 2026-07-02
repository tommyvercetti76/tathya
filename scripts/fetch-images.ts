/**
 * Fetch entry images from Wikimedia Commons — with provenance.
 *
 * For each atlas entry we keep a curated search query (or exact file title).
 * The script asks the Commons API for the top file match, records the
 * 640px thumbnail URL, artist credit, and license from the file's
 * structured metadata, HEAD-checks the URL, and writes the image block
 * into the entry JSON (single-entry files and era bundles both supported).
 *
 * Re-runnable: entries that already have an image are skipped unless --force.
 * Review the printed table — a wrong match means: refine the query here,
 * re-run, or delete the image block. Humans approve; the script only fetches.
 */
import fs from "node:fs";
import path from "node:path";

const ATLAS = path.join(process.cwd(), "content", "atlas");
const UA = "tathya-open-source-atlas/0.1 (image provenance fetcher)";

/** entryId → Commons search query, or { file: "Exact File Name.jpg" }. */
const QUERIES: Record<string, string | { file: string }> = {
  mehrgarh: "Mehrgarh Balochistan ruins",
  "mehrgarh-cotton": "cotton boll plant closeup",
  "zebu-domestication": "zebu bull hump cattle",
  "lahuradewa-rice": "rice paddy field Uttar Pradesh",
  bhimbetka: "Bhimbetka cave paintings Madhya Pradesh",
  "bhirrana-hakra": "Hakra ware pottery",
  "ghaggar-sarasvati": "Ghaggar river",
  "mehrgarh-figurines": "Mehrgarh terracotta figurine",
  "mohenjo-daro": "Mohenjo-daro Great Bath",
  dholavira: "Dholavira reservoir",
  "indus-script": "Indus seal unicorn British Museum",
  rakhigarhi: "Rakhigarhi",
  "indus-weights": "cubical weights Harappa chert",
  "dancing-girl": "Dancing Girl Mohenjo-daro bronze",
  "kalibangan-fire-altars": "Kalibangan",
  "pashupati-seal": "Shiva Pashupati seal",
  rigveda: "Rigveda manuscript",
  "upanishads-early": "Isha Upanishad manuscript",
  samaveda: "Samaveda Sanskrit manuscript page",
  shulbasutras: "Athirathram yajna altar",
  "vedanga-jyotisha": "Hindu astronomy manuscript jyotisha",
  "ganga-iron": "wootz steel ingot",
  "pgw-hastinapura": "Painted Grey Ware culture pottery India",
  agnicayana: "Athirathram",
  "panini-ashtadhyayi": "Panini stamp India 2004",
  "pingala-binary": "Chandas shastra manuscript",
  "sushruta-rhinoplasty": "Sushruta",
  "bhagavad-gita": "Bhagavad Gita manuscript illustrated",
  arthashastra: "Chanakya artistic depiction",
  "charaka-samhita": "ayurveda manuscript",
  yogasutras: "Yoga Sutras Patanjali manuscript",
  aryabhatiya: "Aryabhata statue IUCAA",
  "iron-pillar-delhi": "Iron Pillar Delhi Qutb",
  "zero-place-value": "Bakhshali manuscript zero",
  "kerala-school-madhava": "Madhava sine table manuscript",
  "bhaskara-ii": "Lilavati manuscript",
  "adi-shankara": "Adi Shankaracharya painting",
  "kailasa-ellora": "Kailasa temple Ellora cave 16",
  "chola-nataraja": "Shiva Nataraja bronze Chola dynasty",
  "bhakti-movement": "Mirabai painting",
  nalanda: "Nalanda university ruins",
  "vijayanagara-hampi": "Vittala temple stone chariot Hampi",
  ramcharitmanas: "Tulsidas Ramcharitmanas",
  "jantar-mantar": "Samrat Yantra Jaipur",
  "jones-1786": "William Jones orientalist portrait",
  "brahmo-samaj": "Raja Ram Mohan Roy portrait",
  "sati-abolition-1829": "Rammohun Roy engraving",
  "vivekananda-1893": "Swami Vivekananda September 1893",
  "modern-postural-yoga": "Surya Namaskar yoga sequence",
  "hindu-code-bills": "Dr. Babasaheb Ambedkar",
  "global-bhakti-iskcon": "ISKCON temple Mayapur",
  "yoga-day-un": "International Yoga Day India",
  "artifact-repatriations": "Nataraja bronze Government Museum Chennai",
  "bakhshali-c14-2017": "Bodleian Library Radcliffe Camera",
  "digital-sanskrit": "Sanskrit manuscript Devanagari page",
  "kumbh-mela": "Kumbh Mela pilgrims Sangam",
  "vedic-chanting-unesco": "yajna ritual fire priests",
};

const API = "https://commons.wikimedia.org/w/api.php";

/**
 * Fallback: use the lead image of an English Wikipedia article (usually the
 * iconic depiction), then resolve license/credit from Commons by exact title.
 * More reliable than the search index, which throttles aggressively.
 */
const WIKI: Record<string, string> = {
  mehrgarh: "Mehrgarh",
  "mehrgarh-cotton": "Cotton",
  "zebu-domestication": "Zebu",
  "lahuradewa-rice": "Paddy field",
  "bhirrana-hakra": "Bhirrana",
  "ghaggar-sarasvati": "Ghaggar-Hakra River",
  "indus-script": "Indus script",
  rakhigarhi: "Rakhigarhi",
  "kalibangan-fire-altars": "Kalibangan",
  "upanishads-early": "Upanishads",
  samaveda: "Samaveda",
  shulbasutras: "Shulba Sutras",
  "vedanga-jyotisha": "Vedanga Jyotisha",
  "pingala-binary": "Pingala",
  "kerala-school-madhava": "Kerala school of astronomy and mathematics",
  "kailasa-ellora": "Kailasa Temple, Ellora",
  "chola-nataraja": "Nataraja",
  "vijayanagara-hampi": "Hampi",
  ramcharitmanas: "Ramcharitmanas",
  "jantar-mantar": "Jantar Mantar, Jaipur",
  "sati-abolition-1829": "Ram Mohan Roy",
  "vivekananda-1893": "Swami Vivekananda",
  "global-bhakti-iskcon": "International Society for Krishna Consciousness",
  "ganga-iron": "History of metallurgy in the Indian subcontinent",
  "artifact-repatriations": "Subhash Kapoor",
};

async function wikiLeadFile(article: string): Promise<string | null> {
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(article)}`,
    { headers: { "User-Agent": UA } }
  );
  if (!res.ok) return null;
  const data: any = await res.json();
  const src: string | undefined = data?.originalimage?.source;
  if (!src || !src.includes("/wikipedia/commons/")) return null; // commons-hosted only (licensed)
  const name = decodeURIComponent(src.split("/").pop() ?? "");
  return name || null;
}

function stripHtml(s: string): string {
  const text = s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  // Commons Artist markup often nests the same name twice ("Unknown artistUnknown artist")
  const half = Math.floor(text.length / 2);
  if (text.length % 2 === 0 && text.slice(0, half) === text.slice(half)) return text.slice(0, half);
  return text;
}

async function commons(params: Record<string, string>): Promise<any> {
  const url = `${API}?${new URLSearchParams({ format: "json", ...params })}`;
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.status === 429) {
      const wait = 3000 * (attempt + 1);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  }
  throw new Error("API 429 (retries exhausted)");
}

async function findImage(q: string | { file: string }) {
  const params: Record<string, string> =
    typeof q === "object"
      ? { action: "query", titles: `File:${q.file}`, prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "640" }
      : {
          action: "query",
          generator: "search",
          gsrsearch: `${q} filetype:bitmap`,
          gsrnamespace: "6",
          gsrlimit: "1",
          prop: "imageinfo",
          iiprop: "url|extmetadata",
          iiurlwidth: "640",
        };
  const data = await commons(params);
  const pages = data?.query?.pages;
  if (!pages) return null;
  const page: any = Object.values(pages)[0];
  const info = page?.imageinfo?.[0];
  if (!info?.thumburl) return null;
  const meta = info.extmetadata ?? {};
  return {
    title: page.title as string,
    src: info.thumburl as string,
    sourceUrl: info.descriptionurl as string,
    credit: meta.Artist?.value ? stripHtml(meta.Artist.value).slice(0, 120) : undefined,
    license: meta.LicenseShortName?.value ? stripHtml(meta.LicenseShortName.value) : undefined,
  };
}

async function headOk(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", headers: { "User-Agent": UA } });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  const force = process.argv.includes("--force");
  const files = fs.readdirSync(ATLAS).filter((f) => f.endsWith(".json"));
  let set = 0,
    skipped = 0,
    missed = 0;

  for (const f of files) {
    const full = path.join(ATLAS, f);
    const raw = JSON.parse(fs.readFileSync(full, "utf8"));
    const entries: any[] = Array.isArray(raw) ? raw : [raw];
    let changed = false;

    for (const e of entries) {
      const q = QUERIES[e.id];
      if (!q) continue;
      if (e.image && !force) {
        skipped++;
        continue;
      }
      try {
        let img = null;
        // Prefer the Wikipedia lead image when mapped — it's the vetted iconic pick.
        if (WIKI[e.id]) {
          const file = await wikiLeadFile(WIKI[e.id]);
          if (file) img = await findImage({ file });
        }
        if (!img) img = await findImage(q);
        if (!img || !(await headOk(img.src))) {
          console.log(`  ✗ ${e.id}: no usable result for "${typeof q === "string" ? q : q.file}"`);
          missed++;
          continue;
        }
        e.image = {
          src: img.src,
          alt: e.title.en,
          credit: img.credit,
          license: img.license,
          sourceUrl: img.sourceUrl,
        };
        changed = true;
        set++;
        console.log(`  ✓ ${e.id}  ←  ${img.title}  [${img.license ?? "license?"}]`);
      } catch (err) {
        console.log(`  ✗ ${e.id}: ${err}`);
        missed++;
      }
      await new Promise((r) => setTimeout(r, 1200)); // be polite to the API
    }

    if (changed) {
      fs.writeFileSync(full, JSON.stringify(Array.isArray(raw) ? entries : entries[0], null, 2) + "\n");
    }
  }
  console.log(`\nimages set: ${set} · skipped (already set): ${skipped} · no match: ${missed}`);
  console.log("Review the matches above — refine QUERIES and re-run for any wrong picks.");
}

main();
