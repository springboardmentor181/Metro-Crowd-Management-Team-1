import { AlertTriangle, Clock, Siren } from "lucide-react";
import { CROWD, type CrowdLevel } from "@/lib/utils";
import type { Alert } from "@/lib/mock-data";

const TYPE_ICON = {
  overcrowding: AlertTriangle,
  delay: Clock,
  emergency: Siren,
};

export function AlertRail({ alerts }: { alerts: Alert[] }) {
  return (
    <ul className="divide-y divide-[color:var(--color-hairline)]">
      {alerts.map((a) => {
        const Icon = TYPE_ICON[a.type];
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
                <span className="text-xs text-[color:var(--color-muted)]">· {a.line}</span>
              </div>
              <p className="mt-0.5 text-xs text-[color:var(--color-ink-2)]">{a.message}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-[11px] text-[color:var(--color-muted)]">{a.ago}</span>
              {a.status === "open" ? (
                <button className="rounded-full border border-[color:var(--color-hairline)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--color-ink-2)] hover:bg-[color:var(--color-surface-2)]">
                  Ack
                </button>
              ) : (
                <span className="text-[11px] text-[color:var(--color-crowd-low)]">✓ Ack’d</span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
