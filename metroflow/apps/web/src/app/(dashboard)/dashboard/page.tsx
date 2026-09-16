import Link from "next/link";
import {
  Activity, AlertTriangle, Gauge, Users, Megaphone, SlidersHorizontal, Download,
  ShieldCheck, ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Panel } from "@/components/dashboard/Card";
import { HBars, VBars, Sparkline } from "@/components/dashboard/charts";
import { Heatmap } from "@/components/dashboard/Heatmap";
import { PeakHoursGrid } from "@/components/dashboard/PeakHoursGrid";
import { DonutGauge } from "@/components/dashboard/DonutGauge";
import { AlertRail } from "@/components/dashboard/AlertRail";
import { PassengerTrend } from "@/components/dashboard/PassengerTrend";
import { Insight } from "@/components/dashboard/Insight";
import { getSession } from "@/lib/current-user";
import { compact, CROWD } from "@/lib/utils";
import { STATION_COUNT_TOTAL, NETWORK_COUNT } from "@/lib/stations";
import {
  getKpis, getPassengersByHour, getPeakHours, getHeatmap,
  getCrowdDistribution, getTopFootfall, getAlerts,
} from "@/lib/live-data";

const QUICK = [
  { icon: Megaphone, label: "Broadcast", href: "/dashboard/alerts" },
  { icon: SlidersHorizontal, label: "Adjust freq", href: "/dashboard/scheduling" },
  { icon: Download, label: "Reports", href: "/dashboard/analytics" },
];

export default async function OverviewPage() {
  const [session, KPIS, PASSENGERS_BY_HOUR, PEAK_HOURS, heatmap, CROWD_DISTRIBUTION, TOP_FOOTFALL, alerts] =
    await Promise.all([
      getSession(), getKpis(), getPassengersByHour(), getPeakHours(),
      getHeatmap(), getCrowdDistribution(), getTopFootfall(), getAlerts(),
    ]);
  const openAlerts = alerts.filter((a) => a.status === "open");

  return (
    <>
      <PageHeader
        title="Network Overview"
        subtitle={`Welcome back, ${session?.name ?? "Operator"} — here's the live network state.`}
        live
      />

      <div className="space-y-6 p-5 lg:p-8">
        {/* MetroFlow info banner */}
        <div
          className="relative overflow-hidden rounded-[var(--radius-lg)] p-5 text-white sm:p-6"
          style={{ background: "linear-gradient(120deg,var(--color-brand-900),var(--color-brand) 60%,var(--color-ai))" }}
        >
          <div className="relative z-10 flex flex-wrap items-center gap-4">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-xs font-medium text-white/80">
                <ShieldCheck size={14} /> Privacy-preserving · no cameras
              </div>
              <h2 className="mt-1.5 font-display text-xl font-bold sm:text-2xl">
                MetroFlow AI command center
              </h2>
              <p className="mt-1 text-sm text-white/85">
                Monitoring passenger flow, crowd density and scheduling across{" "}
                <strong>{STATION_COUNT_TOTAL} stations</strong> in{" "}
                <strong>{NETWORK_COUNT} networks</strong> — all from ticketing and operational
                data, in real time.
              </p>
            </div>
            <div className="ml-auto flex gap-6">
              <div>
                <div className="tabular font-display text-2xl font-bold">{compact(KPIS.footfallToday)}</div>
                <div className="text-[11px] text-white/70">passengers today</div>
              </div>
              <div>
                <div className="tabular font-display text-2xl font-bold">{openAlerts.length}</div>
                <div className="text-[11px] text-white/70">open alerts</div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Network Load" value={`${KPIS.networkLoad}`} suffix="%" trend={KPIS.networkLoadTrend} invertTrend icon={Gauge} spark={<Sparkline data={[52, 58, 61, 57, 63, 60, 63]} />} />
          <KpiCard label="Active Alerts" value={`${KPIS.activeAlerts}`} icon={AlertTriangle} spark={<Sparkline data={[3, 4, 6, 5, 7, 6, 7]} color="var(--color-crowd-critical)" />} />
          <KpiCard label="On-time Performance" value={`${KPIS.onTime}`} suffix="%" trend={KPIS.onTimeTrend} icon={Activity} spark={<Sparkline data={[86, 87, 85, 88, 87, 88, 88]} color="var(--color-crowd-low)" />} />
          <KpiCard label="Footfall Today" value={compact(KPIS.footfallToday)} trend={KPIS.footfallTrend} icon={Users} spark={<Sparkline data={[3.6, 3.9, 4.0, 3.8, 4.2, 4.1, 4.2]} />} />
        </div>

        {/* passengers + gauge/actions */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel className="lg:col-span-2" title="Passengers over time" subtitle="Volume by range — from ticketing data">
            <PassengerTrend
              initial={PASSENGERS_BY_HOUR.map((r) => ({ label: r.hour, passengers: r.passengers }))}
            />
          </Panel>

          <Panel title="Network occupancy">
            <div className="flex flex-col items-center">
              <DonutGauge value={63} label="avg occupancy" color="var(--color-brand)" />
              <div className="mt-2 grid w-full grid-cols-3 gap-2">
                {QUICK.map((q) => (
                  <Link key={q.label} href={q.href} className="flex flex-col items-center gap-1.5 rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] py-3 text-[11px] font-medium text-[color:var(--color-ink-2)] hover:border-[color:var(--color-brand)] hover:text-[color:var(--color-brand)]">
                    <q.icon size={18} />
                    {q.label}
                  </Link>
                ))}
              </div>
            </div>
          </Panel>
        </div>

        {/* peak hours */}
        <Panel title="Peak-hour crowd load" subtitle="Rajiv Chowk · hour-by-hour occupancy">
          <PeakHoursGrid data={PEAK_HOURS} />
          <Insight tone="warn">
            08:00–09:00 and 18:00–19:00 hit <strong>Critical</strong> (&gt;90%). Add trains 30 min before each
            window and stage crowd-control staff on the busiest platforms.
          </Insight>
        </Panel>

        {/* heatmap + alerts summary */}
        <div className="grid gap-6 lg:grid-cols-12">
          <Panel className="lg:col-span-7" title="Congestion heatmap" subtitle="Station × hour — congestion probability">
            <Heatmap rows={heatmap.rows} cols={heatmap.cols} values={heatmap.values} />
            <Insight>
              Darker cells = higher congestion probability. The <strong>18:00 column</strong> is hottest
              network-wide; Rajiv Chowk and New Delhi are the stations to watch.
            </Insight>
          </Panel>
          <Panel
            className="lg:col-span-5"
            title="Recent alerts"
            subtitle={`${openAlerts.length} open`}
            actions={
              <Link href="/dashboard/alerts" className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--color-brand)] hover:underline">
                View all <ArrowRight size={13} />
              </Link>
            }
          >
            <AlertRail alerts={openAlerts.slice(0, 3)} />
          </Panel>
        </div>

        {/* distribution + top stations */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Crowd-level distribution" subtitle="Share of station-hours">
            <HBars data={CROWD_DISTRIBUTION.map((d) => ({ label: d.level, value: d.count, color: CROWD[d.level].color }))} />
            <Insight tone="good">
              ~84% of station-hours are Low/Medium — the network runs comfortably most of the time. Focus
              effort on the ~1% Critical hours where it matters.
            </Insight>
          </Panel>
          <Panel title="Top footfall stations" subtitle="90-day totals" actions={
            <Link href="/dashboard/stations" className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--color-brand)] hover:underline">
              All stations <ArrowRight size={13} />
            </Link>
          }>
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
