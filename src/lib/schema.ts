/**
 * tathya — shared content model.
 *
 * ONE schema serves both sides:
 *   - Atlas  (the deep-time timeline of Sanātana Dharma)
 *   - Ledger (the structured propaganda/claim ledger)
 *
 * Design constraints this schema encodes:
 *   - every claim sourced, every uncertainty named
 *   - dating carries an honesty tag + machine-readable EDTF
 *     (Extended Date/Time Format, Library of Congress) so
 *     approximate/uncertain dates are first-class, not prose
 *   - ledger entries are exportable as schema.org ClaimReview,
 *     so tathya interoperates with the global fact-check
 *     ecosystem instead of reinventing it
 *   - vetting status is part of the data: nothing renders as
 *     "published" without named human vetters
 */
import { z } from "zod";

/**
 * All URLs in content must be https. `z.string().url()` alone accepts
 * javascript:/data:/http: — a stored-XSS and downgrade vector once content
 * is community-contributed. Scheme is enforced at the schema layer so no
 * renderer ever has to remember to check.
 */
const httpsUrl = z
  .string()
  .url()
  .refine((u) => u.startsWith("https://"), { message: "URLs must be https://" });

// ---------------------------------------------------------------- sources

export const SourceKind = z.enum([
  "primary", // the text/inscription/artifact itself
  "peer-reviewed", // journal article
  "monograph", // academic book / university press
  "reference", // standard reference work, critical edition
  "reportage", // journalism, institutional press release
  "archival", // archive, museum record, epigraphic corpus
  "dataset", // dataset, corpus, database
]);

export const Source = z.object({
  label: z.string(), // short human citation, e.g. "Coppa et al., Nature 440 (2006)"
  detail: z.string().optional(), // full citation / what it establishes
  url: httpsUrl.optional(),
  kind: SourceKind,
  independent: z.boolean().default(true), // false if derivative of another listed source
});
export type Source = z.infer<typeof Source>;

// ---------------------------------------------------------------- dating

/** Honesty tags on dating — required, never implied. */
export const DatingTag = z.enum([
  "firm", // firmly dated (stratigraphy, C14, epigraphy, astronomy)
  "traditional", // a traditional date, reported as such
  "contested", // scholars disagree; positions must be listed
  "evolved", // composed/redacted over centuries; a span, not a point
]);

export const ScientificDating = z.object({
  method: z.string(), // "AMS radiocarbon", "thermoluminescence", "palaeography", ...
  result: z.string(), // what the measurement said, with lab/sample context
  source: Source,
});

export const Dating = z.object({
  display: z.string(), // "c. 7000–2600 BCE"
  edtf: z.string(), // EDTF: "-6999/-2599", "-0499~", "1340/1425"
  tag: DatingTag,
  basis: z.string(), // what the date rests on, in one honest sentence
  scientific: z.array(ScientificDating).optional(),
  positions: z
    .array(
      z.object({
        position: z.string(),
        holders: z.string(), // who argues this
        evidence: z.string(),
      })
    )
    .optional(), // REQUIRED in practice when tag === "contested" (enforced in validate)
});

// ---------------------------------------------------------------- shared

export const EntryKind = z.enum([
  "person",
  "text",
  "place",
  "event",
  "concept",
  "innovation",
  "artifact",
  "claim", // ledger side
]);

export const Title = z.object({
  en: z.string(),
  deva: z.string().optional(), // Devanāgarī
  iast: z.string().optional(), // IAST romanization
});

export const Location = z.object({
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  note: z.string().optional(), // "approximate", "current holder: Bodleian Library", ...
});

/** A scripture citation: reference, gist, and (preferably Indian-hosted) link. */
export const ScriptureRef = z.object({
  ref: z.string(), // "Ṛgveda 10.18.8", "Bhagavad Gītā 10.22"
  text: z.string().optional(), // the gist or key phrase, transliterated/translated
  link: httpsUrl.optional(), // prefer Indian scholarly portals (Vedic Heritage, Gita Supersite...)
});

/**
 * The entry's tie to Sanātana Dharma — explicit and GRADED, never vague.
 * Grading is the shield: labeling Mehrgarh honestly as "substrate" is what
 * makes "direct-scriptural" unimpeachable where it's claimed.
 */
export const DharmicTie = z.object({
  status: z.enum([
    "direct-scriptural", // named or constituted in śruti/smṛti/śāstra
    "living-practice", // continuous practice within the tradition today
    "historical-lineage", // documented lineage inside the tradition's knowledge systems
    "contested-continuity", // tie argued seriously, evidence divided — positions shown
    "substrate", // pre-Vedic material substrate; regional/ancestral, not doctrinal
  ]),
  statement: z.string(),
  scriptureRefs: z.array(ScriptureRef).optional(), // required by validator for the first two statuses
});

/** Custody: who holds it, where, under which legal instrument, and parallels abroad. */
export const CustodyParallel = z.object({
  name: z.string(),
  holder: z.string(),
  note: z.string().optional(),
});
export const Custody = z.object({
  holder: z.string(), // who owns/administers it
  place: z.string(), // where it physically is
  legalBasis: z.string(), // why it is there — treaty, act, agreement, case law
  parallels: z.array(CustodyParallel).min(3).optional(), // at least 3 comparable items internationally
});

/** Images carry provenance like everything else: credit, license, source link. */
export const EntryImage = z.object({
  src: httpsUrl, // hotlinked from Wikimedia Commons (self-host later at scale)
  alt: z.string(),
  credit: z.string().optional(), // artist/photographer, from Commons metadata
  license: z.string().optional(), // e.g. "CC BY-SA 4.0", "Public domain"
  sourceUrl: httpsUrl.optional(), // Commons file page
});

export const Vetting = z.object({
  status: z.enum(["draft", "in-review", "published"]),
  vetters: z.array(z.string()), // named humans; empty only while draft/in-review
  aiAssisted: z.boolean(), // AI is a draft tool; a human always verifies against cited sources
  lastReviewed: z.string().optional(), // ISO date
});

/** A documented connection from an ancient contribution to modern usage. */
export const ThroughLine = z.object({
  to: z.string(), // the modern endpoint, e.g. "reconstructive plastic surgery"
  status: z.enum([
    "documented", // causal transmission chain exists in the record
    "anticipation", // the idea demonstrably existed first; no causal chain to the modern form
    "conjectural", // transmission hypothesized, not established — say so
  ]),
  chain: z.array(z.string()), // hop-by-hop, each hop checkable
  sources: z.array(Source).min(1),
});

// ---------------------------------------------------------------- atlas

export const AtlasEntry = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  side: z.literal("atlas"),
  era: z.string(), // id into eras.json
  slice: z.string(), // thematic slice within the era
  title: Title,
  kind: EntryKind,
  dating: Dating,
  summary: z.string(),
  whyItMatters: z.string(),
  honestyNote: z.string().optional(), // the uncertainty or caveat we refuse to bury
  dharmicTie: DharmicTie.optional(), // validator requires this on every atlas entry
  custody: Custody.optional(), // for artifacts/places/manuscripts with a real custody story
  image: EntryImage.optional(),
  locations: z.array(Location).optional(),
  throughLines: z.array(ThroughLine).optional(), // presence => appears in the "Great Ideas" lens
  flagship: z.boolean().default(false), // flagship entries need >= 5 independent sources
  sources: z.array(Source).min(3),
  relatedLedger: z.array(z.string()).optional(), // ledger entry ids
  contributors: z.array(z.string()).min(1),
  vetting: Vetting,
});
export type AtlasEntry = z.infer<typeof AtlasEntry>;

// ---------------------------------------------------------------- ledger

/**
 * The 12-part taxonomy. Category 9 turns the same rigor inward
 * (overclaims BY supporters); category 12 protects genuine scholarship
 * from being miscategorized as attack.
 */
export const LedgerCategory = z.number().int().min(1).max(12);

export const EvidenceItem = z.object({
  point: z.string(),
  sources: z.array(Source).min(1),
});

export const VerdictDirection = z.enum([
  "overclaim", // exaggeration/fabrication in favor of the tradition
  "misrepresentation", // distortion against or appropriation of the tradition
  "legitimate", // genuine scholarship / open question — not distortion
]);

export const LedgerEntry = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  side: z.literal("ledger"),
  claim: z.object({
    text: z.string(), // the claim, stated neutrally
    asCirculated: z.string(), // how it actually circulates, verbatim flavor
    channels: z.array(z.string()), // where it spreads
    exampleRefs: z.array(z.string()).optional(), // archived URLs / flag ids
  }),
  category: LedgerCategory,
  techniques: z.array(z.string()).optional(), // ids into content/techniques.json (validated)
  /** The 10-second, copy-ready answer — the shareable payload of the entry. */
  quickRebuttal: z.string().optional(), // required by validator when a verdict is present
  /** How the claim circulates over time — recurrence intelligence for triage. */
  spread: z
    .object({
      recurrence: z.enum(["evergreen", "seasonal", "burst"]),
      note: z.string().optional(),
      knownVariants: z.array(z.string()).optional(), // paraphrases seen in the wild (feeds matching)
    })
    .optional(),
  whatsTrue: z.string().optional(), // the kernel of truth, honestly conceded
  whatsDistorted: z.string().optional(),
  evidence: z.object({
    supporting: z.array(EvidenceItem), // evidence FOR the claim as stated
    countering: z.array(EvidenceItem), // evidence AGAINST the claim as stated
  }),
  verdict: z
    .object({
      direction: VerdictDirection,
      rationale: z.string(),
    })
    .optional(), // omitted when evidence does not support one (esp. category 12)
  relatedAtlas: z.array(z.string()).optional(),
  sources: z.array(Source).min(3),
  contributors: z.array(z.string()).min(1),
  vetting: Vetting,
});
export type LedgerEntry = z.infer<typeof LedgerEntry>;

// ---------------------------------------------------------------- flags

/** A user-submitted flag: a screenshot or link somebody thinks is propaganda. */
export const Flag = z.object({
  id: z.string(),
  submitted: z.string(), // ISO datetime
  channel: z.enum([
    "x-twitter",
    "instagram",
    "facebook",
    "youtube",
    "tiktok",
    "whatsapp",
    "reddit",
    "news-article",
    "other",
  ]),
  url: z.string().optional(),
  screenshotRef: z.string().optional(), // path/hash of uploaded image
  imagePHash: z.string().optional(), // perceptual hash for near-duplicate detection
  ocrText: z.string().optional(), // local OCR output (tesseract), human-corrected if needed
  flagFor: z.array(z.string()).min(1), // preset reasons + bespoke free text — this is training signal
  submitterNote: z.string().optional(),
  ruleHits: z
    .array(
      z.object({
        rule: z.string(),
        category: LedgerCategory,
        technique: z.string(),
        matched: z.string(), // the span that fired the rule
        confidence: z.enum(["high", "medium", "low"]),
      })
    )
    .optional(),
  matchedLedger: z.array(z.object({ id: z.string(), score: z.number() })).optional(),
  status: z.enum(["new", "triaged", "merged-into-entry", "spawned-entry", "rejected"]),
  resolution: z.string().optional(),
});
export type Flag = z.infer<typeof Flag>;

export const Era = z.object({
  id: z.string(),
  name: z.string(),
  span: z.string(),
  edtf: z.string(),
  order: z.number(),
});
export type Era = z.infer<typeof Era>;
