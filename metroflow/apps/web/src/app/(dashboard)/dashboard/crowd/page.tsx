import type { Metadata } from "next";
import Link from "next/link";
import { Activity, Users, TrendingUp, TriangleAlert, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Panel, TimeToggle } from "@/components/dashboard/Card";
import { AreaTrend } from "@/components/dashboard/charts";
import { Heatmap } from "@/components/dashboard/Heatmap";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { Insight } from "@/components/dashboard/Insight";
import { getPassengersByHour, getHeatmap } from "@/lib/live-data";
import { STATIONS } from "@/lib/stations";
import { compact } from "@/lib/utils";

export const metadata: Metadata = { title: "Crowd Monitoring" };

export default async function CrowdPage() {
  const [pbh, heatmap] = await Promise.all([getPassengersByHour(), getHeatmap()]);
  const INOUT = pbh.map((r) => ({
    hour: r.hour,
    inflow: Math.round(r.passengers * 0.52),
    outflow: Math.round(r.passengers * 0.48),
  }));
  const rows = [...STATIONS].sort((a, b) => b.occupancy - a.occupancy).slice(0, 8);
  const criticalNow = STATIONS.filter((s) => s.level === "Critical").length;
  const avgOcc = Math.round(STATIONS.reduce((a, s) => a + s.occupancy, 0) / STATIONS.length);

  return (
    <>
      <PageHeader title="Crowd Monitoring" subtitle="Passenger density, congestion and inflow/outflow" live actions={<TimeToggle active="1D" />} />
      <div className="space-y-6 p-5 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Avg density" value={`${avgOcc}`} suffix="%" icon={Activity} trend={-2.1} invertTrend />
          <KpiCard label="Stations Critical now" value={`${criticalNow}`} icon={TriangleAlert} />
          <KpiCard label="Monitored stations" value={`${STATIONS.length}`} icon={Users} />
          <KpiCard label="Peak inflow/hr" value={compact(Math.max(...INOUT.map((r) => r.inflow)) * 1000)} icon={TrendingUp} trend={4.2} />
        </div>

        <Panel title="Inflow vs outflow" subtitle="Passengers per hour (thousands)">
          <AreaTrend
            data={INOUT}
            xKey="hour"
            series={[
              { key: "inflow", label: "Inflow", color: "var(--color-series-1)" },
              { key: "outflow", label: "Outflow", color: "var(--color-series-2)" },
            ]}
          />
          <Insight>
            Inflow leads outflow in the morning (people entering the network) and reverses in the
            evening. The widening gap around 09:00 signals platforms filling faster than they clear.
          </Insight>
        </Panel>

        <Panel title="Congestion heatmap" subtitle="Station × hour — congestion probability">
          <Heatmap rows={heatmap.rows} cols={heatmap.cols} values={heatmap.values} />
          <Insight tone="warn">
            Read across a row to see a station&apos;s worst hours; read down a column to compare stations at
            the same time. Darkest cells cluster at 18:00 — prioritize those for extra trains.
          </Insight>
        </Panel>

        <Panel
          title="Station status"
          subtitle="Live crowd level by station"
          actions={
            <Link href="/dashboard/stations" className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--color-brand)] hover:underline">
              All {STATIONS.length} stations <ArrowRight size={13} />
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[color:var(--color-hairline)] text-left text-xs text-[color:var(--color-muted)]">
                  <th className="pb-2 font-medium">Station</th>
                  <th className="pb-2 font-medium">Network / Line</th>
                  <th className="pb-2 font-medium">Occupancy</th>
                  <th className="pb-2 font-medium">Footfall</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} className="border-b border-[color:var(--color-hairline)] last:border-0">
                    <td className="py-3 font-medium">{s.name}</td>
                    <td className="py-3 text-[color:var(--color-ink-2)]">
                      <div className="text-xs">{s.metro}</div>
                      <div className="text-[11px] text-[color:var(--color-muted)]">{s.line}</div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[color:var(--color-surface-2)]">
                          <div className="h-full rounded-full bg-[color:var(--color-brand)]" style={{ width: `${s.occupancy}%` }} />
                        </div>
                        <span className="tabular text-xs">{s.occupancy}%</span>
                      </div>
                    </td>
                    <td className="py-3 tabular">{compact(s.footfall)}</td>
                    <td className="py-3"><StatusChip level={s.level} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}
