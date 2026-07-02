"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Copy rebuttal" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="copy-btn"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          /* clipboard unavailable — no-op */
        }
      }}
    >
      {copied ? "✓ copied" : `⧉ ${label}`}
    </button>
  );
}
