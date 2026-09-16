import type { Metadata } from "next";
import { MapPinned, Network, Building2, MapPin } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Panel } from "@/components/dashboard/Card";
import { StationsExplorer } from "@/components/dashboard/StationsExplorer";
import { STATION_COUNT_TOTAL, NETWORK_COUNT, CITY_COUNT } from "@/lib/stations";

export const metadata: Metadata = { title: "Stations" };

export default function StationsPage() {
  return (
    <>
      <PageHeader
        title="Stations"
        subtitle={`${STATION_COUNT_TOTAL} stations across ${NETWORK_COUNT} networks — search live crowd status`}
        live
      />
      <div className="space-y-6 p-5 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Total stations" value={`${STATION_COUNT_TOTAL}`} icon={MapPinned} />
          <KpiCard label="Metro networks" value={`${NETWORK_COUNT}`} icon={Network} />
          <KpiCard label="Interchanges" value="52" icon={Building2} />
          <KpiCard label="Cities" value={`${CITY_COUNT}`} icon={MapPin} />
        </div>

        <Panel title="Station directory" subtitle="All stations from the database — search and filter by network and crowd level">
          <StationsExplorer />
        </Panel>
      </div>
    </>
  );
}
