import type { Metadata } from "next";
import { MapPinned, Train, Building2, AlertOctagon } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Panel } from "@/components/dashboard/Card";
import { StationsExplorer } from "@/components/dashboard/StationsExplorer";
import { STATIONS, STATION_COUNT_TOTAL, NETWORK_COUNT } from "@/lib/stations";

export const metadata: Metadata = { title: "Stations" };

export default function StationsPage() {
  const monitored = STATIONS.length;
  const critical = STATIONS.filter((s) => s.level === "Critical").length;
  const interchanges = STATIONS.filter((s) => s.interchange).length;

  return (
    <>
      <PageHeader
        title="Stations"
        subtitle={`${STATION_COUNT_TOTAL} stations across ${NETWORK_COUNT} networks — monitor crowd, occupancy and footfall`}
        live
      />
      <div className="space-y-6 p-5 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Total stations" value={`${STATION_COUNT_TOTAL}`} icon={MapPinned} />
          <KpiCard label="Actively monitored" value={`${monitored}`} icon={Train} />
          <KpiCard label="Interchanges" value={`${interchanges}`} icon={Building2} />
          <KpiCard label="Critical now" value={`${critical}`} icon={AlertOctagon} />
        </div>

        <Panel title="Station directory" subtitle="Search and filter live crowd status by network and level">
          <StationsExplorer />
        </Panel>
      </div>
    </>
  );
}
