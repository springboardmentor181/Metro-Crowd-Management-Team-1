import { CROWD, type CrowdLevel } from "@/lib/utils";

/** Hour-by-hour crowd load cards (Doc 06 D1 — mirrors the reference peak-hours grid). */
export function PeakHoursGrid({
  data,
}: {
  data: { hour: string; pct: number; level: CrowdLevel }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {data.map((d) => {
        const c = CROWD[d.level];
        return (
          <div key={d.hour} className="rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[color:var(--color-muted)]">{d.hour}</span>
              <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
            </div>
            <div className="mt-1 tabular text-xl font-bold">{d.pct}%</div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[color:var(--color-surface-2)]">
              <div
                className="h-full rounded-full"
                style={{ width: `${d.pct}%`, background: c.color }}
              />
            </div>
            <div className="mt-1.5 text-[10px] font-medium" style={{ color: c.color }}>
              {c.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
