"use client";

import { useEffect, useRef, useState } from "react";
import { Radio, AlertTriangle, X } from "lucide-react";

type Tick = { clock: string; network_load: number; passengers_k: number; level: string };
type Toast = { id: number; station: string; line: string; severity: string; message: string };

/**
 * Live network ticker — connects to the realtime WebSocket, shows a pulsing
 * "Live" pill with the simulated clock + network load, and pops a toast when a
 * new overcrowding alert streams in. Satisfies the PRD "real-time updates".
 */
export function LiveTicker() {
  const [tick, setTick] = useState<Tick | null>(null);
  const [connected, setConnected] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let closed = false;
    let retry: ReturnType<typeof setTimeout>;

    async function connect() {
      let token: string | null = null;
      try {
        token = await fetch("/api/token").then((r) => r.json()).then((d) => d.token);
      } catch {
        token = null;
      }
      const base = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/live";
      const ws = new WebSocket(`${base}?token=${token ?? ""}`);
      wsRef.current = ws;

      ws.onopen = () => !closed && setConnected(true);
      ws.onclose = () => {
        if (closed) return;
        setConnected(false);
        retry = setTimeout(connect, 5000); // auto-reconnect
      };
      ws.onmessage = (e) => {
        try {
          const m = JSON.parse(e.data);
          if (m.type === "tick") setTick(m.data);
          else if (m.type === "alert") {
            const id = Date.now() + Math.floor(Math.random() * 1000);
            setToasts((t) => [...t, { id, ...m.data }].slice(-3));
            setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 7000);
          }
        } catch {
          /* ignore */
        }
      };
    }

    connect();
    return () => {
      closed = true;
      clearTimeout(retry);
      wsRef.current?.close();
    };
  }, []);

  return (
    <>
      {/* live pill (in the topbar) */}
      <span
        className="hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium md:inline-flex"
        style={{
          borderColor: connected ? "var(--color-crowd-low)" : "var(--color-hairline)",
          color: connected ? "var(--color-crowd-low)" : "var(--color-muted)",
          background: connected ? "color-mix(in srgb, var(--color-crowd-low) 10%, transparent)" : "transparent",
        }}
        title="Realtime network state"
      >
        <span className="relative flex h-2 w-2">
          {connected && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--color-crowd-low)] opacity-75" />
          )}
          <span
            className="relative inline-flex h-2 w-2 rounded-full"
            style={{ background: connected ? "var(--color-crowd-low)" : "var(--color-muted)" }}
          />
        </span>
        {connected && tick ? (
          <span className="tabular">
            Live {tick.clock} · {tick.network_load}%
          </span>
        ) : (
          "Connecting…"
        )}
      </span>

      {/* toasts for new alerts */}
      <div className="pointer-events-none fixed bottom-24 left-5 z-40 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex w-80 max-w-[calc(100vw-2.5rem)] items-start gap-2.5 rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] p-3 shadow-[var(--shadow-e3)]"
          >
            <span
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              style={{
                background: "color-mix(in srgb, var(--color-crowd-critical) 14%, transparent)",
                color: "var(--color-crowd-critical)",
              }}
            >
              <AlertTriangle size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                {t.station}
                <span className="text-xs text-[color:var(--color-muted)]">· {t.line}</span>
              </div>
              <p className="mt-0.5 text-xs text-[color:var(--color-ink-2)]">{t.message}</p>
            </div>
            <button
              onClick={() => setToasts((cur) => cur.filter((x) => x.id !== t.id))}
              className="text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
