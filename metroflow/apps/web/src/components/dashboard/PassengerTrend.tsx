"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AreaTrend } from "@/components/dashboard/charts";
import { Insight } from "@/components/dashboard/Insight";
import { getTimeseries, type TimePoint } from "@/lib/api";
import { cn } from "@/lib/utils";

const RANGES = ["1H", "1D", "1W", "1M"];

const HINTS: Record<string, string> = {
  "1H": "Recent hours — passenger volume over the last few hours of service.",
  "1D": "Two clear peaks: morning ~09:00 and evening ~19:00. Keep peak-hour frequency raised.",
  "1W": "Weekday volumes run well above weekends — plan staffing to the working week.",
  "1M": "Month-long trend — watch for festival and event spikes that lift demand.",
};

export function PassengerTrend({ initial }: { initial: TimePoint[] }) {
  const [range, setRange] = useState("1D");
  const [data, setData] = useState<TimePoint[]>(initial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getTimeseries(range).then((d) => {
      if (!active) return;
      if (d && d.length) setData(d);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [range]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs text-[color:var(--color-muted)]">
          Passenger volume (thousands)
          {loading && <Loader2 size={12} className="animate-spin" />}
        </span>
        <div className="inline-flex rounded-full border border-[color:var(--color-hairline)] p-0.5 text-xs">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-full px-2.5 py-1 font-medium transition-colors",
                r === range
                  ? "bg-[color:var(--color-brand)] text-white"
                  : "text-[color:var(--color-ink-2)] hover:bg-[color:var(--color-surface-2)]"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <AreaTrend
        data={data}
        xKey="label"
        series={[{ key: "passengers", label: "Passengers", color: "var(--color-series-1)" }]}
      />
      <Insight>{HINTS[range]}</Insight>
    </div>
  );
}
