"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, Wifi, WifiOff } from "lucide-react";
import { STATIONS } from "@/lib/stations";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { predictCrowd, predictDemand } from "@/lib/api";
import { group, type CrowdLevel } from "@/lib/utils";

// Hour demand shape (0-1) mirroring the dataset's bimodal peaks (09:00 & 19:00).
const HOUR_SHAPE: Record<number, number> = {
  5: 0.14, 6: 0.28, 7: 0.52, 8: 0.85, 9: 0.98, 10: 0.77, 11: 0.52, 12: 0.42,
  13: 0.43, 14: 0.43, 15: 0.45, 16: 0.55, 17: 0.73, 18: 0.92, 19: 1.0,
  20: 0.81, 21: 0.54, 22: 0.35, 23: 0.23,
};

type Estimate = { passengers: number; level: CrowdLevel; congestion: number; confidence: number };

function estimate(footfall: number, hour: number, weekend: boolean): Estimate {
  const shape = HOUR_SHAPE[hour] ?? 0.3;
  const wk = weekend ? 0.75 : 1;
  const hourlyBase = footfall / 18; // spread daily footfall across service hours
  const passengers = Math.round(hourlyBase * shape * wk * 1.6);
  const load = Math.min(0.99, shape * wk * 1.05);
  const level: CrowdLevel =
    load > 0.85 ? "Critical" : load > 0.68 ? "High" : load > 0.45 ? "Medium" : "Low";
  const congestion = Number(load.toFixed(2));
  const confidence = Math.round((0.8 + (1 - Math.abs(0.7 - load)) * 0.15) * 100);
  return { passengers, level, congestion, confidence };
}

export function PredictWidget() {
  const [stationId, setStationId] = useState(STATIONS[0].id);
  const [hour, setHour] = useState(18);
  const [weekend, setWeekend] = useState(false);

  const station = STATIONS.find((s) => s.id === stationId)!;
  const local = useMemo(
    () => estimate(station.footfall, hour, weekend),
    [station, hour, weekend]
  );

  // Try the real model API; fall back to the local estimate when offline.
  const [live, setLive] = useState<Estimate | null>(null);
  const [source, setSource] = useState<"live" | "offline">("offline");

  useEffect(() => {
    let active = true;
    const ctx = { day_of_week: weekend ? "Saturday" : "Monday", occupancy: station.occupancy };
    Promise.all([
      predictCrowd({ station_id: station.id, hour, context: ctx }),
      predictDemand({ station_id: station.id, hour, context: ctx }),
    ]).then(([crowd, demand]) => {
      if (!active) return;
      if (crowd) {
        setLive({
          level: crowd.crowd_level,
          congestion: crowd.congestion_probability,
          confidence: Math.round(crowd.confidence * 100),
          passengers: demand?.passenger_count ?? local.passengers,
        });
        setSource("live");
      } else {
        setLive(null);
        setSource("offline");
      }
    });
    return () => {
      active = false;
    };
  }, [station.id, station.occupancy, hour, weekend, local.passengers]);

  const out = live ?? local;

  const control =
    "w-full rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[color:var(--color-brand)]";

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-[color:var(--color-muted)]">Station</span>
          <select value={stationId} onChange={(e) => setStationId(e.target.value)} className={control}>
            {STATIONS.map((s) => (
              <option key={s.id} value={s.id}>{s.name} · {s.metro.replace(" Metro", "")}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-[color:var(--color-muted)]">Hour of day</span>
          <select value={hour} onChange={(e) => setHour(Number(e.target.value))} className={control}>
            {Object.keys(HOUR_SHAPE).map((h) => (
              <option key={h} value={h}>{h.padStart(2, "0")}:00</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-[color:var(--color-muted)]">Day type</span>
          <select value={weekend ? "we" : "wd"} onChange={(e) => setWeekend(e.target.value === "we")} className={control}>
            <option value="wd">Weekday</option>
            <option value="we">Weekend</option>
          </select>
        </label>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-surface-2)] p-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ai)]">
            <Sparkles size={13} /> AI · estimated · v1.0.0
          </span>
          {source === "live" ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[color:var(--color-crowd-low)]">
              <Wifi size={13} /> live model
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[color:var(--color-muted)]">
              <WifiOff size={13} /> offline estimate
            </span>
          )}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <div>
            <div className="text-[11px] text-[color:var(--color-muted)]">Predicted crowd</div>
            <div className="mt-1"><StatusChip level={out.level} /></div>
          </div>
          <div>
            <div className="text-[11px] text-[color:var(--color-muted)]">Passengers / hr</div>
            <div className="tabular mt-1 font-display text-2xl font-bold">{group(out.passengers)}</div>
          </div>
          <div>
            <div className="text-[11px] text-[color:var(--color-muted)]">Congestion prob.</div>
            <div className="tabular mt-1 font-display text-2xl font-bold">{out.congestion}</div>
          </div>
          <div>
            <div className="text-[11px] text-[color:var(--color-muted)]">Confidence</div>
            <div className="tabular mt-1 font-display text-2xl font-bold text-[color:var(--color-crowd-low)]">{out.confidence}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
