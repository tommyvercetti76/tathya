"use client";

import { useEffect, useState } from "react";

export type DrillItem = {
  id: string;
  channel: string;
  handle: string;
  post: string;
  choices: string[]; // technique ids + "legitimate"
  answer: string;
  explanation: string;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function Drill({ items, techNames }: { items: DrillItem[]; techNames: Record<string, string> }) {
  const [round, setRound] = useState(0); // bump to reshuffle
  // Shuffle only after mount — randomizing during render breaks SSR hydration.
  const [deck, setDeck] = useState<DrillItem[] | null>(null);
  useEffect(() => {
    setDeck(shuffle(items).map((it) => ({ ...it, choices: shuffle(it.choices) })));
  }, [items, round]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const label = (c: string) => (c === "legitimate" ? "No manipulation — this is legitimate" : techNames[c] ?? c);

  if (!deck) return <p className="note">Shuffling the deck…</p>;

  if (i >= deck.length) {
    const pct = Math.round((score / deck.length) * 100);
    return (
      <div className="drill-done">
        <div className="drill-score-big">
          {score}/{deck.length}
        </div>
        <p className="summary">
          {pct >= 85
            ? "Inoculated. You now recognize the shapes faster than the feed can serve them."
            : pct >= 60
              ? "Solid. Review the ones you missed in the Playbook — the tell is always in the wording."
              : "The templates won this round — which is exactly why drilling works. Read the Playbook tells, then run it again."}
        </p>
        <p className="note">best streak: {bestStreak} · every item's technique is documented in the <a href="/playbook">Playbook</a> and busted in the <a href="/ledger">Ledger</a>.</p>
        <button
          className="btn"
          onClick={() => {
            setRound((r) => r + 1);
            setI(0);
            setScore(0);
            setStreak(0);
            setPicked(null);
          }}
        >
          Run it again (reshuffled)
        </button>
      </div>
    );
  }

  const it = deck[i];
  const correct = picked !== null && picked === it.answer;

  return (
    <div>
      <div className="drill-hud">
        <div className="drill-progress">
          <div className="drill-progress-fill" style={{ width: `${(i / deck.length) * 100}%` }} />
        </div>
        <span className="note">
          {i + 1}/{deck.length} · score {score} · streak {streak}
        </span>
      </div>

      <div className="post-card">
        <div className="post-head">
          <span className="post-avatar" aria-hidden>
            {it.handle.replace(/^[@u/]+/, "").slice(0, 1).toUpperCase()}
          </span>
          <div>
            <b>{it.handle}</b>
            <div className="note">{it.channel}</div>
          </div>
        </div>
        <p className="post-body">{it.post}</p>
      </div>

      <p className="drill-q">What is this?</p>
      <div className="choice-grid">
        {it.choices.map((c) => {
          let cls = "choice";
          if (picked !== null) {
            if (c === it.answer) cls += " right";
            else if (c === picked) cls += " wrong";
            else cls += " dim";
          }
          return (
            <button
              key={c}
              className={cls}
              disabled={picked !== null}
              onClick={() => {
                setPicked(c);
                if (c === it.answer) {
                  setScore((s) => s + 1);
                  setStreak((s) => {
                    const ns = s + 1;
                    setBestStreak((b) => Math.max(b, ns));
                    return ns;
                  });
                } else {
                  setStreak(0);
                }
              }}
            >
              {label(c)}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className={`drill-feedback ${correct ? "ok" : "miss"}`}>
          <b>{correct ? "Spotted." : `Miss — it's ${label(it.answer)}.`}</b>
          <p>{it.explanation}</p>
          {it.answer !== "legitimate" && (
            <p className="note">
              full pattern: <a href={`/playbook#${it.answer}`}>{techNames[it.answer]}</a> in the Playbook
            </p>
          )}
          <button
            className="btn"
            onClick={() => {
              setI((x) => x + 1);
              setPicked(null);
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
