import {
  Activity, AlertTriangle, Gauge, Users, Megaphone, SlidersHorizontal, Download,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Panel, TimeToggle } from "@/components/dashboard/Card";
import { AreaTrend, HBars, VBars, Sparkline } from "@/components/dashboard/charts";
import { Heatmap } from "@/components/dashboard/Heatmap";
import { PeakHoursGrid } from "@/components/dashboard/PeakHoursGrid";
import { DonutGauge } from "@/components/dashboard/DonutGauge";
import { AlertRail } from "@/components/dashboard/AlertRail";
import { getSession } from "@/lib/current-user";
import { compact } from "@/lib/utils";
import { CROWD } from "@/lib/utils";
import {
  KPIS, PASSENGERS_BY_HOUR, PEAK_HOURS, HEATMAP, HEATMAP_STATIONS, HEATMAP_HOURS,
  ALERTS, CROWD_DISTRIBUTION, TOP_FOOTFALL,
} from "@/lib/mock-data";

const QUICK = [
  { icon: Megaphone, label: "Broadcast" },
  { icon: SlidersHorizontal, label: "Adjust freq" },
  { icon: Download, label: "Export" },
];

export default async function OverviewPage() {
  const session = await getSession();

  return (
    <>
      <PageHeader
        title={`Network Overview`}
        subtitle={`Welcome back, ${session?.name ?? "Operator"} — here's the live network state.`}
        live
        actions={<TimeToggle active="1D" />}
      />

      <div className="space-y-6 p-5 lg:p-8">
        {/* KPI strip */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Network Load" value={`${KPIS.networkLoad}`} suffix="%"
            trend={KPIS.networkLoadTrend} invertTrend icon={Gauge}
            spark={<Sparkline data={[52, 58, 61, 57, 63, 60, 63]} />}
          />
          <KpiCard
            label="Active Alerts" value={`${KPIS.activeAlerts}`}
            icon={AlertTriangle}
            spark={<Sparkline data={[3, 4, 6, 5, 7, 6, 7]} color="var(--color-crowd-critical)" />}
          />
          <KpiCard
            label="On-time Performance" value={`${KPIS.onTime}`} suffix="%"
            trend={KPIS.onTimeTrend} icon={Activity}
            spark={<Sparkline data={[86, 87, 85, 88, 87, 88, 88]} color="var(--color-crowd-low)" />}
          />
          <KpiCard
            label="Footfall Today" value={compact(KPIS.footfallToday)}
            trend={KPIS.footfallTrend} icon={Users}
            spark={<Sparkline data={[3.6, 3.9, 4.0, 3.8, 4.2, 4.1, 4.2]} />}
          />
        </div>

        {/* passengers + gauge/actions */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel
            className="lg:col-span-2"
            title="Passengers over time"
            subtitle="Today vs typical weekday (thousands)"
            actions={<TimeToggle active="1D" />}
          >
            <AreaTrend
              data={PASSENGERS_BY_HOUR}
              xKey="hour"
              series={[
                { key: "passengers", label: "Today", color: "var(--color-series-1)" },
                { key: "typical", label: "Typical", color: "var(--color-series-2)" },
              ]}
            />
          </Panel>

          <Panel title="Network occupancy">
            <div className="flex flex-col items-center">
              <DonutGauge value={63} label="avg occupancy" color="var(--color-brand)" />
              <div className="mt-2 grid w-full grid-cols-3 gap-2">
                {QUICK.map((q) => (
                  <button
                    key={q.label}
                    className="flex flex-col items-center gap-1.5 rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] py-3 text-[11px] font-medium text-[color:var(--color-ink-2)] hover:border-[color:var(--color-brand)] hover:text-[color:var(--color-brand)]"
                  >
                    <q.icon size={18} />
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          </Panel>
        </div>

        {/* peak hours */}
        <Panel title="Peak-hour crowd load" subtitle="Rajiv Chowk · hour-by-hour occupancy">
          <PeakHoursGrid data={PEAK_HOURS} />
        </Panel>

        {/* heatmap + alerts */}
        <div className="grid gap-6 lg:grid-cols-12">
          <Panel className="lg:col-span-7" title="Congestion heatmap" subtitle="Station × hour — congestion probability">
            <Heatmap rows={HEATMAP_STATIONS} cols={HEATMAP_HOURS} values={HEATMAP} />
          </Panel>
          <Panel
            className="lg:col-span-5"
            title="Active alerts"
            subtitle={`${ALERTS.filter((a) => a.status === "open").length} open`}
          >
            <AlertRail alerts={ALERTS} />
          </Panel>
        </div>

        {/* distribution + top stations */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Crowd-level distribution" subtitle="Share of station-hours">
            <HBars
              data={CROWD_DISTRIBUTION.map((d) => ({
                label: d.level,
                value: d.count,
                color: CROWD[d.level].color,
              }))}
            />
          </Panel>
          <Panel title="Top footfall stations" subtitle="90-day totals">
            <VBars
              data={TOP_FOOTFALL.slice(0, 6).map((s) => ({
                station: s.station.length > 12 ? s.station.slice(0, 11) + "…" : s.station,
                footfall: s.footfall,
              }))}
              xKey="station"
              yKey="footfall"
              color="var(--color-series-1)"
            />
          </Panel>
        </div>
      </div>
    </>
  );
}
