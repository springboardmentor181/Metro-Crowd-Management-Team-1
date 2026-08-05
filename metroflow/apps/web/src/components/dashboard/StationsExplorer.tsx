"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Train, ArrowUpDown } from "lucide-react";
import { STATIONS, type Station } from "@/lib/stations";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { compact } from "@/lib/utils";

const METROS = ["All networks", ...Array.from(new Set(STATIONS.map((s) => s.metro)))];
const LEVELS = ["All", "Low", "Medium", "High", "Critical"] as const;

export function StationsExplorer() {
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [metro, setMetro] = useState("All networks");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("All");
  const [sortDesc, setSortDesc] = useState(true);

  const rows = useMemo(() => {
    let r: Station[] = STATIONS.filter((s) => {
      const matchesQ =
        !q ||
        s.name.toLowerCase().includes(q.toLowerCase()) ||
        s.city.toLowerCase().includes(q.toLowerCase()) ||
        s.line.toLowerCase().includes(q.toLowerCase());
      const matchesMetro = metro === "All networks" || s.metro === metro;
      const matchesLevel = level === "All" || s.level === level;
      return matchesQ && matchesMetro && matchesLevel;
    });
    r = [...r].sort((a, b) => (sortDesc ? b.occupancy - a.occupancy : a.occupancy - b.occupancy));
    return r;
  }, [q, metro, level, sortDesc]);

  const control =
    "rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[color:var(--color-brand)]";

  return (
    <div className="space-y-4">
      {/* filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] px-3 py-2">
          <Search size={15} className="text-[color:var(--color-muted)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search station, city or line…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <select value={metro} onChange={(e) => setMetro(e.target.value)} className={control}>
          {METROS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <select value={level} onChange={(e) => setLevel(e.target.value as typeof level)} className={control}>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l === "All" ? "All levels" : l}
            </option>
          ))}
        </select>
      </div>

      <div className="text-xs text-[color:var(--color-muted)]">
        Showing <strong className="text-[color:var(--color-ink)]">{rows.length}</strong> monitored stations
      </div>

      {/* table */}
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[color:var(--color-hairline)]">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-[color:var(--color-hairline)] bg-[color:var(--color-surface-2)] text-left text-xs text-[color:var(--color-muted)]">
              <th className="px-4 py-2.5 font-medium">Station</th>
              <th className="px-4 py-2.5 font-medium">Network / Line</th>
              <th className="px-4 py-2.5 font-medium">Category</th>
              <th className="px-4 py-2.5 font-medium">Crowd</th>
              <th className="px-4 py-2.5 font-medium">
                <button onClick={() => setSortDesc((v) => !v)} className="inline-flex items-center gap-1 hover:text-[color:var(--color-ink)]">
                  Occupancy <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="px-4 py-2.5 text-right font-medium">Daily footfall</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-b border-[color:var(--color-hairline)] last:border-0 hover:bg-[color:var(--color-surface-2)]">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--color-brand-100)] text-[color:var(--color-brand)]">
                      <Train size={14} />
                    </span>
                    <div>
                      <div className="font-medium leading-tight">{s.name}</div>
                      <div className="text-[11px] text-[color:var(--color-muted)]">
                        {s.city} {s.interchange && "· interchange"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-[color:var(--color-ink-2)]">
                  <div className="text-xs">{s.metro}</div>
                  <div className="text-[11px] text-[color:var(--color-muted)]">{s.line}</div>
                </td>
                <td className="px-4 py-2.5 text-xs text-[color:var(--color-ink-2)]">{s.category}</td>
                <td className="px-4 py-2.5">
                  <StatusChip level={s.level} />
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[color:var(--color-hairline)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${s.occupancy}%`,
                          background:
                            s.level === "Critical"
                              ? "var(--color-crowd-critical)"
                              : s.level === "High"
                              ? "var(--color-crowd-high)"
                              : s.level === "Medium"
                              ? "var(--color-crowd-medium)"
                              : "var(--color-crowd-low)",
                        }}
                      />
                    </div>
                    <span className="tabular text-xs text-[color:var(--color-ink-2)]">{s.occupancy}%</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right tabular text-[color:var(--color-ink-2)]">{compact(s.footfall)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
