"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Train, ArrowUpDown, Loader2, Database } from "lucide-react";
import { getStations } from "@/lib/api";
import { STATIONS as FALLBACK } from "@/lib/stations";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { compact, type CrowdLevel } from "@/lib/utils";

type Row = {
  id: string; name: string; metro: string; city: string; line: string;
  category: string; interchange: boolean; footfall: number;
  level: CrowdLevel; occupancy: number;
};

const LEVELS = ["All", "Low", "Medium", "High", "Critical"] as const;
const BANDS: Record<string, [number, number]> = {
  Critical: [90, 99], High: [72, 88], Medium: [50, 68], Low: [22, 48],
};

function hashNum(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Deterministic typical crowd level & occupancy from footfall (no randomness → stable). */
function display(footfall: number, id: string): { level: CrowdLevel; occupancy: number } {
  const h = hashNum(id);
  let level: CrowdLevel;
  if (footfall > 95000) level = h % 3 === 0 ? "High" : "Critical";
  else if (footfall > 60000) level = h % 3 === 0 ? "Medium" : "High";
  else if (footfall > 35000) level = h % 2 === 0 ? "Low" : "Medium";
  else level = h % 3 === 0 ? "Medium" : "Low";
  const [lo, hi] = BANDS[level];
  return { level, occupancy: lo + (h % (hi - lo + 1)) };
}

export function StationsExplorer() {
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [source, setSource] = useState<"db" | "offline">("db");
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [metro, setMetro] = useState(searchParams.get("network") ?? "All networks");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("All");
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    getStations().then((list) => {
      if (list && list.length) {
        setRows(
          list.map((s) => ({
            id: s.station_id, name: s.station_name, metro: s.metro_name, city: s.city,
            line: s.line_name, category: s.station_category,
            interchange: s.interchange_station === "Yes", footfall: s.daily_average_footfall,
            ...display(s.daily_average_footfall, s.station_id),
          }))
        );
        setSource("db");
      } else {
        setRows(FALLBACK.map((s) => ({ ...s })));
        setSource("offline");
      }
    });
  }, []);

  const metros = useMemo(
    () => ["All networks", ...Array.from(new Set((rows ?? []).map((r) => r.metro)))],
    [rows]
  );

  const filtered = useMemo(() => {
    const list = (rows ?? []).filter((s) => {
      const mq =
        !q ||
        s.name.toLowerCase().includes(q.toLowerCase()) ||
        s.city.toLowerCase().includes(q.toLowerCase()) ||
        s.line.toLowerCase().includes(q.toLowerCase());
      const mm = metro === "All networks" || s.metro === metro;
      const ml = level === "All" || s.level === level;
      return mq && mm && ml;
    });
    return [...list].sort((a, b) => (sortDesc ? b.occupancy - a.occupancy : a.occupancy - b.occupancy));
  }, [rows, q, metro, level, sortDesc]);

  const control =
    "rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[color:var(--color-brand)]";

  if (rows === null) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-[color:var(--color-muted)]">
        <Loader2 size={16} className="animate-spin" /> Loading stations…
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
          {metros.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <select value={level} onChange={(e) => setLevel(e.target.value as typeof level)} className={control}>
          {LEVELS.map((l) => (
            <option key={l} value={l}>{l === "All" ? "All levels" : l}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 text-xs text-[color:var(--color-muted)]">
        {source === "db" && <Database size={13} className="text-[color:var(--color-crowd-low)]" />}
        Showing <strong className="text-[color:var(--color-ink)]">{filtered.length}</strong> of {rows.length} stations
        {source === "offline" && " (offline sample)"}
      </div>

      <div className="max-h-[70vh] overflow-auto rounded-[var(--radius-card)] border border-[color:var(--color-hairline)]">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="sticky top-0 z-10">
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
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-[color:var(--color-hairline)] last:border-0 hover:bg-[color:var(--color-surface-2)]">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--color-brand-100)] text-[color:var(--color-brand)]">
                      <Train size={14} />
                    </span>
                    <div>
                      <div className="font-medium leading-tight">{s.name}</div>
                      <div className="text-[11px] text-[color:var(--color-muted)]">
                        {s.city}{s.interchange && " · interchange"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-[color:var(--color-ink-2)]">
                  <div className="text-xs">{s.metro}</div>
                  <div className="text-[11px] text-[color:var(--color-muted)]">{s.line}</div>
                </td>
                <td className="px-4 py-2.5 text-xs text-[color:var(--color-ink-2)]">{s.category}</td>
                <td className="px-4 py-2.5"><StatusChip level={s.level} /></td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[color:var(--color-hairline)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${s.occupancy}%`,
                          background:
                            s.level === "Critical" ? "var(--color-crowd-critical)"
                            : s.level === "High" ? "var(--color-crowd-high)"
                            : s.level === "Medium" ? "var(--color-crowd-medium)"
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
