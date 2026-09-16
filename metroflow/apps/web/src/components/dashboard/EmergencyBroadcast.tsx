"use client";

import { useState } from "react";
import { Siren, Loader2, CheckCircle2 } from "lucide-react";
import { createAlert } from "@/lib/api";

export function EmergencyBroadcast() {
  const [msg, setMsg] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function send() {
    if (!msg.trim()) return;
    setState("sending");
    const ok = await createAlert({ message: msg.trim(), type: "emergency", severity: "emergency" });
    if (ok) {
      setState("sent");
      setMsg("");
      setTimeout(() => setState("idle"), 3500);
    } else {
      setState("error");
      setTimeout(() => setState("idle"), 3500);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <input
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && send()}
        placeholder="Broadcast message to all stations…"
        className="flex-1 rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] px-3 py-2.5 text-sm outline-none focus:border-[color:var(--color-crowd-critical)]"
      />
      <button
        onClick={send}
        disabled={state === "sending" || !msg.trim()}
        className="inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-card)] bg-[color:var(--color-crowd-critical)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {state === "sending" ? <Loader2 size={15} className="animate-spin" /> : <Siren size={15} />}
        Broadcast
      </button>
      {state === "sent" && (
        <span className="inline-flex items-center gap-1.5 self-center text-sm font-medium text-[color:var(--color-crowd-low)]">
          <CheckCircle2 size={15} /> Alert broadcast
        </span>
      )}
      {state === "error" && (
        <span className="self-center text-sm font-medium text-[color:var(--color-crowd-critical)]">Failed — try again</span>
      )}
    </div>
  );
}
