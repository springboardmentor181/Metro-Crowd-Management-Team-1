import type { Metadata } from "next";
import { Activity, Users, TrendingUp, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Panel, TimeToggle } from "@/components/dashboard/Card";
import { AreaTrend } from "@/components/dashboard/charts";
import { Heatmap } from "@/components/dashboard/Heatmap";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { HEATMAP, HEATMAP_STATIONS, HEATMAP_HOURS, PASSENGERS_BY_HOUR, TOP_FOOTFALL } from "@/lib/mock-data";
import { group, type CrowdLevel } from "@/lib/utils";

export const metadata: Metadata = { title: "Crowd Monitoring" };

const INOUT = PASSENGERS_BY_HOUR.map((r) => ({
  hour: r.hour,
  inflow: Math.round(r.passengers * 0.52),
  outflow: Math.round(r.passengers * 0.48),
}));

const STATIONS: { name: string; line: string; occ: number; level: CrowdLevel; inflow: number }[] = [
  { name: "Rajiv Chowk", line: "Blue Line", occ: 98, level: "Critical", inflow: 12480 },
  { name: "Central Secretariat", line: "Yellow Line", occ: 86, level: "High", inflow: 10870 },
  { name: "Kashmere Gate", line: "Red Line", occ: 74, level: "High", inflow: 9240 },
  { name: "New Delhi", line: "Airport Express", occ: 68, level: "High", inflow: 8830 },
  { name: "Hauz Khas", line: "Magenta Line", occ: 47, level: "Medium", inflow: 6120 },
  { name: "Dwarka Sec 21", line: "Blue Line", occ: 33, level: "Low", inflow: 4310 },
];

export default function CrowdPage() {
  return (
    <>
      <PageHeader title="Crowd Monitoring" subtitle="Passenger density, congestion and inflow/outflow" live actions={<TimeToggle active="1D" />} />
      <div className="space-y-6 p-5 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Avg density" value="63" suffix="%" icon={Activity} trend={-2.1} invertTrend />
          <KpiCard label="Stations Critical now" value="3" icon={TriangleAlert} />
          <KpiCard label="Avg occupancy" value="58" suffix="%" icon={Users} trend={1.4} invertTrend />
          <KpiCard label="Peak inflow/hr" value="12.4K" icon={TrendingUp} trend={4.2} />
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
        </Panel>

        <Panel title="Congestion heatmap" subtitle="Station × hour — congestion probability">
          <Heatmap rows={HEATMAP_STATIONS} cols={HEATMAP_HOURS} values={HEATMAP} />
        </Panel>

        <Panel title="Station status" subtitle="Live crowd level by station">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[color:var(--color-hairline)] text-left text-xs text-[color:var(--color-muted)]">
                  <th className="pb-2 font-medium">Station</th>
                  <th className="pb-2 font-medium">Line</th>
                  <th className="pb-2 font-medium">Occupancy</th>
                  <th className="pb-2 font-medium">Inflow/hr</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {STATIONS.map((s) => (
                  <tr key={s.name} className="border-b border-[color:var(--color-hairline)] last:border-0">
                    <td className="py-3 font-medium">{s.name}</td>
                    <td className="py-3 text-[color:var(--color-ink-2)]">{s.line}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[color:var(--color-surface-2)]">
                          <div className="h-full rounded-full bg-[color:var(--color-brand)]" style={{ width: `${s.occ}%` }} />
                        </div>
                        <span className="tabular text-xs">{s.occ}%</span>
                      </div>
                    </td>
                    <td className="py-3 tabular">{group(s.inflow)}</td>
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
