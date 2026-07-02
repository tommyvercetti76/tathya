"use client";

import { useState } from "react";
import { runRules, type RuleHit } from "@/lib/detect/rules";
import { matchClaims, type MatchCandidate } from "@/lib/detect/match";

const CHANNELS = [
  "x-twitter",
  "instagram",
  "facebook",
  "youtube",
  "tiktok",
  "whatsapp",
  "reddit",
  "news-article",
  "other",
] as const;

// Point this at the deployed repo once it has a home on GitHub.
const REPO_ISSUES_URL = "https://github.com/OWNER/tathya/issues/new";

export function FlagForm({
  flagForOptions,
  candidates,
}: {
  flagForOptions: string[];
  candidates: MatchCandidate[];
}) {
  const [channel, setChannel] = useState<string>("x-twitter");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [reasons, setReasons] = useState<string[]>([]);
  const [bespoke, setBespoke] = useState("");
  const [ocrState, setOcrState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [hits, setHits] = useState<RuleHit[] | null>(null);
  const [matches, setMatches] = useState<{ id: string; score: number }[] | null>(null);

  async function handleImage(file: File) {
    setOcrState("working");
    try {
      // Local OCR: tesseract.js runs fully in the browser (WASM).
      // The screenshot never leaves the user's machine.
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const {
        data: { text: extracted },
      } = await worker.recognize(file);
      await worker.terminate();
      setText((prev) => (prev ? prev + "\n" : "") + extracted.trim());
      setOcrState("done");
    } catch {
      setOcrState("error");
    }
  }

  function analyze() {
    const t = text.trim();
    if (!t) return;
    setHits(runRules(t));
    setMatches(matchClaims(t, candidates));
  }

  function toggleReason(r: string) {
    setReasons((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  }

  function issueUrl() {
    const body = [
      "### Channel",
      channel,
      "### Link",
      url || "(screenshot only)",
      "### Text as it appears",
      "```",
      text.trim(),
      "```",
      "### Flagged for",
      ...reasons.map((r) => `- ${r}`),
      bespoke ? `- Other: ${bespoke}` : "",
      "### Automatic triage (local rules — not a verdict)",
      ...(hits ?? []).map((h) => `- [cat ${h.category} · ${h.confidence}] ${h.rule}: ${h.matched}`),
      ...(matches ?? []).map((m) => `- possible existing entry: \`${m.id}\` (score ${m.score})`),
    ]
      .filter(Boolean)
      .join("\n");
    const params = new URLSearchParams({
      labels: "flag,needs-triage",
      title: `[flag] ${text.trim().slice(0, 60)}…`,
      body,
    });
    return `${REPO_ISSUES_URL}?${params.toString()}`;
  }

  return (
    <div className="flag-form">
      <div>
        <label>Channel — where did you see it?</label>
        <select value={channel} onChange={(e) => setChannel(e.target.value)}>
          {CHANNELS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Link (optional)</label>
        <input type="url" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
      </div>

      <div>
        <label>Screenshot — read locally, never uploaded</label>
        <div
          className="dropzone"
          onClick={() => document.getElementById("flag-file")?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) void handleImage(f);
          }}
        >
          {ocrState === "working"
            ? "Reading text from image locally…"
            : ocrState === "error"
              ? "Could not read the image — paste the text below instead."
              : "Click or drop a screenshot here (OCR runs in your browser)"}
        </div>
        <input
          id="flag-file"
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleImage(f);
          }}
        />
      </div>

      <div>
        <label>Text of the post (from OCR, or paste it yourself)</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste or correct the post text here…" />
      </div>

      <div>
        <label>Flag for — pick all that apply (this teaches the model)</label>
        {flagForOptions.map((r) => (
          <div className="check-row" key={r}>
            <input type="checkbox" id={r} checked={reasons.includes(r)} onChange={() => toggleReason(r)} />
            <label htmlFor={r} style={{ color: "var(--text)", marginBottom: 0 }}>
              {r}
            </label>
          </div>
        ))}
        <input
          type="text"
          placeholder="Your own words: what feels off about this post?"
          value={bespoke}
          onChange={(e) => setBespoke(e.target.value)}
          style={{ marginTop: 8 }}
        />
      </div>

      <button className="btn" onClick={analyze} disabled={!text.trim()}>
        Analyze locally
      </button>

      {hits !== null && (
        <div>
          <label>Rule hits (transparent, deterministic — these rank the queue, they are not a verdict)</label>
          {hits.length === 0 && (
            <p className="note">
              No deterministic rule fired. That does not mean the post is clean — it means a human should look.
            </p>
          )}
          {hits.map((h, i) => (
            <div className="rule-hit" key={i}>
              <b>
                cat {h.category} · {h.rule} · {h.confidence}
              </b>
              <br />
              {h.matched}
            </div>
          ))}
          {matches && matches.length > 0 && (
            <>
              <label style={{ marginTop: 12 }}>Already documented? Closest ledger entries:</label>
              {matches.map((m) => (
                <div className="match-hit" key={m.id}>
                  <a href={`/ledger#${m.id}`}>{m.id}</a> — similarity {m.score}
                </div>
              ))}
            </>
          )}
          <a className="btn" style={{ display: "inline-block", marginTop: 14, textDecoration: "none" }} href={issueUrl()} target="_blank" rel="noreferrer">
            Submit flag for human review →
          </a>
          <p className="note" style={{ marginTop: 8 }}>
            Submission opens a prefilled GitHub issue — the public, auditable triage queue. A trusted vetter
            reviews before anything is published.
          </p>
        </div>
      )}
    </div>
  );
}
