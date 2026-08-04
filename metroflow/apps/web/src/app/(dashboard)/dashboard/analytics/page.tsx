import type { Metadata } from "next";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Card";
import { VBars, HBars } from "@/components/dashboard/charts";
import { CITY_FLOW, CONGESTED_LINES, TOP_FOOTFALL, CROWD_DISTRIBUTION } from "@/lib/mock-data";
import { CROWD } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics" };

const TICKETS = [
  { label: "Smart Card", value: 28765 },
  { label: "QR Ticket", value: 18080 },
  { label: "Token", value: 11672 },
  { label: "Monthly Pass", value: 6483 },
];

export default function AnalyticsPage() {
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
          </Panel>
          <Panel title="Most congested corridors" subtitle="% station-hours High or Critical">
            <HBars data={CONGESTED_LINES.map((l) => ({ label: l.line, value: l.pct, color: "var(--color-series-2)" }))} />
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
