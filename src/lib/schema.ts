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
  url: z.string().url().optional(),
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
  techniques: z.array(z.string()).optional(), // rhetorical technique tags (SemEval-style)
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
