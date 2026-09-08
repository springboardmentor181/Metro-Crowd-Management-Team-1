import type { Metadata } from "next";
import { AlertTriangle, Clock, Siren } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Panel } from "@/components/dashboard/Card";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { EmergencyBroadcast } from "@/components/dashboard/EmergencyBroadcast";
import { getAlerts } from "@/lib/live-data";
import { getSession } from "@/lib/current-user";

export const metadata: Metadata = { title: "Alerts" };

export default async function AlertsPage() {
  const [session, alerts] = await Promise.all([getSession(), getAlerts()]);
  const open = alerts.filter((a) => a.status === "open").length;
  const delays = alerts.filter((a) => a.type === "delay").length;
  const emergencies = alerts.filter((a) => a.type === "emergency").length;

  return (
    <>
      <PageHeader title="Alerts & Notifications" subtitle="Severity-ranked operational alerts" live />
      <div className="space-y-6 p-5 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label="Open alerts" value={`${open}`} icon={AlertTriangle} />
          <KpiCard label="Delays" value={`${delays}`} icon={Clock} />
          <KpiCard label="Emergencies" value={`${emergencies}`} icon={Siren} />
        </div>

        {session?.role === "admin" && (
          <Panel title="Emergency broadcast" subtitle="Admin only — push to stations & channels">
            <EmergencyBroadcast />
          </Panel>
        )}

        <Panel title="All alerts">
          <AlertsPanel showFilters />
        </Panel>
      </div>
    </>
  );
}
