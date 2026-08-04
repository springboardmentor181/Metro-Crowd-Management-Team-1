"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock, Siren, Database, CheckCheck, Loader2 } from "lucide-react";
import { getAlerts, ackAlert, type ApiAlert } from "@/lib/api";
import { ALERTS as MOCK } from "@/lib/mock-data";
import { CROWD, type CrowdLevel } from "@/lib/utils";

const TYPE_ICON = { overcrowding: AlertTriangle, delay: Clock, emergency: Siren };

const FALLBACK: ApiAlert[] = MOCK.map((a) => ({
  id: a.id, type: a.type, severity: a.severity as ApiAlert["severity"],
  status: a.status as ApiAlert["status"], message: a.message, line: a.line,
  station: a.station, ago: a.ago,
}));

export function AlertsPanel() {
  const [alerts, setAlerts] = useState<ApiAlert[]>([]);
  const [source, setSource] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [acking, setAcking] = useState<string | null>(null);

  async function load() {
    const res = await getAlerts();
    if (res) {
      setAlerts(res.alerts);
      setSource(res.source);
    } else {
      setAlerts(FALLBACK);
      setSource("offline");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function onAck(id: string) {
    setAcking(id);
    const ok = await ackAlert(id);
    if (ok) {
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "acknowledged" } : a))
      );
    }
    setAcking(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-[color:var(--color-muted)]">
        <Loader2 size={16} className="animate-spin" /> Loading alerts…
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5 text-xs text-[color:var(--color-muted)]">
        {source === "supabase" ? (
          <>
            <Database size={13} className="text-[color:var(--color-crowd-low)]" /> Live from Supabase
          </>
        ) : source === "offline" ? (
          "Offline — showing sample alerts"
        ) : (
          "Live"
        )}
      </div>
      <ul className="divide-y divide-[color:var(--color-hairline)]">
        {alerts.map((a) => {
          const Icon = TYPE_ICON[a.type] ?? AlertTriangle;
          const c = CROWD[a.severity as CrowdLevel];
          return (
            <li key={a.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <span
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ background: c.bg, color: c.color }}
              >
                <Icon size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{a.station}</span>
                  {a.line && <span className="text-xs text-[color:var(--color-muted)]">· {a.line}</span>}
                </div>
                <p className="mt-0.5 text-xs text-[color:var(--color-ink-2)]">{a.message}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-[11px] text-[color:var(--color-muted)]">{a.ago}</span>
                {a.status === "open" ? (
                  <button
                    onClick={() => onAck(a.id)}
                    disabled={acking === a.id}
                    className="inline-flex items-center gap-1 rounded-full border border-[color:var(--color-hairline)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--color-ink-2)] hover:bg-[color:var(--color-surface-2)] disabled:opacity-50"
                  >
                    {acking === a.id ? <Loader2 size={11} className="animate-spin" /> : null} Ack
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[color:var(--color-crowd-low)]">
                    <CheckCheck size={12} /> Ack&rsquo;d
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
