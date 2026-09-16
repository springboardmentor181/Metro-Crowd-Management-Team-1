"use client";

import { useState } from "react";
import { Sparkles, ArrowRight, Check, X, Loader2 } from "lucide-react";
import { decideReco } from "@/lib/api";

type Reco = {
  line: string;
  slot: string;
  current: number;
  recommended: number;
  score: number;
  demand?: number;
};

type State = Record<string, "applied" | "dismissed" | "pending" | undefined>;

export function SchedulingRecos({ recos, isAdmin }: { recos: Reco[]; isAdmin: boolean }) {
  const [state, setState] = useState<State>({});

  async function decide(r: Reco, decision: "applied" | "dismissed") {
    const key = r.line + r.slot;
    setState((s) => ({ ...s, [key]: "pending" }));
    const ok = await decideReco({
      line: r.line, slot: r.slot, current: r.current,
      recommended: r.recommended, score: r.score, decision,
    });
    setState((s) => ({ ...s, [key]: ok ? decision : undefined }));
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {recos.map((r) => {
        const key = r.line + r.slot;
        const st = state[key];
        const change = r.current !== r.recommended;
        return (
          <div key={key} className="rounded-[var(--radius-card)] border border-[color:var(--color-ai)]/25 bg-[color:var(--color-ai)]/[0.04] p-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ai)]">
                <Sparkles size={13} /> AI · estimated
              </span>
              <span className="text-xs text-[color:var(--color-muted)]">score {r.score}</span>
            </div>
            <h3 className="mt-2 font-semibold">{r.line}</h3>
            <p className="text-xs text-[color:var(--color-ink-2)]">{r.slot}</p>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="tabular rounded-md bg-[color:var(--color-surface-2)] px-2 py-1">{r.current} min</span>
              <ArrowRight size={15} className="text-[color:var(--color-muted)]" />
              <span className="tabular rounded-md bg-[color:var(--color-accent)]/12 px-2 py-1 font-semibold text-[color:var(--color-accent)]">
                {r.recommended} min
              </span>
              {change ? (
                <span className="text-xs text-[color:var(--color-crowd-low)]">↑ frequency</span>
              ) : (
                <span className="text-xs text-[color:var(--color-muted)]">no change</span>
              )}
            </div>

            {st === "applied" ? (
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-[var(--radius-card)] bg-[color:var(--color-crowd-low)]/12 px-3 py-2 text-xs font-medium text-[color:var(--color-crowd-low)]">
                <Check size={14} /> Applied to operating schedule
              </div>
            ) : st === "dismissed" ? (
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-[var(--radius-card)] bg-[color:var(--color-surface-2)] px-3 py-2 text-xs font-medium text-[color:var(--color-muted)]">
                <X size={14} /> Dismissed
              </div>
            ) : (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => decide(r, "applied")}
                  disabled={!isAdmin || st === "pending"}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-card)] bg-[color:var(--color-brand)] px-3 py-2 text-xs font-medium text-white hover:bg-[color:var(--color-brand-900)] disabled:opacity-40"
                >
                  {st === "pending" ? <Loader2 size={13} className="animate-spin" /> : null}
                  {isAdmin ? "Apply" : "Admin only"}
                </button>
                <button
                  onClick={() => (isAdmin ? decide(r, "dismissed") : undefined)}
                  disabled={st === "pending"}
                  className="rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] px-3 py-2 text-xs font-medium text-[color:var(--color-ink-2)] hover:bg-[color:var(--color-surface-2)]"
                >
                  {isAdmin ? "Dismiss" : "Propose"}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
