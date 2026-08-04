import type { Metadata } from "next";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Card";
import { VBars, HBars } from "@/components/dashboard/charts";
import { Insight } from "@/components/dashboard/Insight";
import {
  getCityFlow, getCongestedLines, getTopFootfall, getCrowdDistribution, getTicketTypes,
} from "@/lib/live-data";
import { CROWD } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const [CITY_FLOW, CONGESTED_LINES, TOP_FOOTFALL, CROWD_DISTRIBUTION, TICKETS] =
    await Promise.all([
      getCityFlow(), getCongestedLines(), getTopFootfall(), getCrowdDistribution(), getTicketTypes(),
    ]);
  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Passenger traffic, station performance and operational insights"
        actions={
          <button className="inline-flex items-center gap-1.5 rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] px-3 py-1.5 text-sm font-medium hover:bg-[color:var(--color-surface-2)]">
            <Download size={15} /> Export
          </button>
        }
      />
      <div className="space-y-6 p-5 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="City average daily flow" subtitle="Passengers per day">
            <VBars data={CITY_FLOW} xKey="city" yKey="flow" color="var(--color-series-1)" />
            <Insight>
              Delhi carries ~1.7M daily — nearly double Mumbai. Capacity planning and staffing should be
              weighted to the top three cities, which together move over 3.3M passengers a day.
            </Insight>
          </Panel>
          <Panel title="Most congested corridors" subtitle="% station-hours High or Critical">
            <HBars data={CONGESTED_LINES.map((l) => ({ label: l.line, value: l.pct, color: "var(--color-series-2)" }))} />
            <Insight tone="warn">
              The Blue/Magenta interchange tops congestion at 22.7%. Interchange corridors carry
              transfer surges — target them first for added frequency.
            </Insight>
          </Panel>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Top footfall stations" subtitle="90-day totals">
            <VBars
              data={TOP_FOOTFALL.map((s) => ({ station: s.station.length > 12 ? s.station.slice(0, 11) + "…" : s.station, footfall: s.footfall }))}
              xKey="station" yKey="footfall" color="var(--color-series-3)"
            />
          </Panel>
          <Panel title="Ticket type distribution" subtitle="Transactions">
            <HBars data={TICKETS.map((t, i) => ({ label: t.label, value: t.value, color: `var(--color-series-${i + 1})` }))} />
          </Panel>
        </div>

        <Panel title="Crowd-level distribution" subtitle="Share of station-hours across the network">
          <HBars
            data={CROWD_DISTRIBUTION.map((d) => ({ label: d.level, value: d.count, color: CROWD[d.level].color }))}
            height={180}
          />
        </Panel>
      </div>
    </>
  );
}
