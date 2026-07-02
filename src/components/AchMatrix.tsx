"use client";

import { useState } from "react";

type Mark = "C" | "I" | "·";
const NEXT: Record<Mark, Mark> = { "·": "C", C: "I", I: "·" };

/**
 * Live Analysis of Competing Hypotheses matrix (Heuer, CIA CSI 1999, ch. 8).
 * Click cells to cycle Consistent → Inconsistent → unmarked. ACH ranks
 * hypotheses by LEAST inconsistency — refutation, not confirmation.
 */
export function AchMatrix({
  question,
  hypotheses,
  evidence,
}: {
  question: string;
  hypotheses: string[];
  evidence: string[];
}) {
  const [marks, setMarks] = useState<Mark[][]>(evidence.map(() => hypotheses.map(() => "·")));

  const inconsistencies = hypotheses.map((_, h) => marks.reduce((n, row) => n + (row[h] === "I" ? 1 : 0), 0));
  const anyMarked = marks.some((row) => row.some((m) => m !== "·"));
  const allZero = anyMarked && inconsistencies.every((n) => n === 0);

  return (
    <div className="ach">
      <p className="ach-q">
        <b>Try it live:</b> {question}
      </p>
      <p className="note">
        Click a cell to mark the evidence <b>C</b>onsistent or <b>I</b>nconsistent with each hypothesis. You are
        trying to <i>refute</i>, not confirm.
      </p>
      <table className="ach-table">
        <thead>
          <tr>
            <th>Evidence</th>
            {hypotheses.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {evidence.map((ev, r) => (
            <tr key={r}>
              <td>{ev}</td>
              {hypotheses.map((_, h) => (
                <td key={h} className="ach-cell">
                  <button
                    className={`ach-mark m-${marks[r][h]}`}
                    onClick={() =>
                      setMarks((prev) => prev.map((row, ri) => (ri === r ? row.map((m, hi) => (hi === h ? NEXT[m] : m)) : row)))
                    }
                    aria-label="cycle consistency mark"
                  >
                    {marks[r][h]}
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>
              <b>Inconsistency count (lower survives)</b>
            </td>
            {inconsistencies.map((n, h) => (
              <td key={h} className="ach-total">
                {n}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
      {allZero && (
        <p className="ach-warn">
          Zero inconsistencies for every hypothesis on a contested question means the matrix isn&apos;t being
          honest yet — some of this evidence genuinely cuts against one side or the other.
        </p>
      )}
      <p className="note">
        Both hypotheses retain inconsistencies when this is done honestly — which is why the{" "}
        <a href="/ledger#legit-debate-indo-aryan-origins">ledger files it under category 12</a>: live science, not
        settled ammunition.
      </p>
    </div>
  );
}
