import type { Metadata } from "next";
import { AlertTriangle, Clock, Siren } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Panel } from "@/components/dashboard/Card";
import { AlertRail } from "@/components/dashboard/AlertRail";
import { ALERTS } from "@/lib/mock-data";
import { getSession } from "@/lib/current-user";

export const metadata: Metadata = { title: "Alerts" };

const FILTERS = ["All", "Overcrowding", "Delay", "Emergency"];

export default async function AlertsPage() {
  const session = await getSession();
  const open = ALERTS.filter((a) => a.status === "open").length;

  return (
    <>
      <PageHeader title="Alerts & Notifications" subtitle="Severity-ranked operational alerts" live />
      <div className="space-y-6 p-5 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label="Open alerts" value={`${open}`} icon={AlertTriangle} />
          <KpiCard label="Delays" value="2" icon={Clock} />
          <KpiCard label="Emergencies" value="0" icon={Siren} />
        </div>

        {session?.role === "admin" && (
          <Panel title="Emergency broadcast" subtitle="Admin only — push to stations & channels">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                placeholder="Broadcast message to selected stations…"
                className="flex-1 rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] px-3 py-2.5 text-sm outline-none focus:border-[color:var(--color-crowd-critical)]"
              />
              <button className="rounded-[var(--radius-card)] bg-[color:var(--color-crowd-critical)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90">
                Broadcast
              </button>
            </div>
          </Panel>
        )}

        <Panel
          title="All alerts"
          actions={
            <div className="flex gap-1">
              {FILTERS.map((f, i) => (
                <button
                  key={f}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    i === 0
                      ? "bg-[color:var(--color-brand)] text-white"
                      : "text-[color:var(--color-ink-2)] hover:bg-[color:var(--color-surface-2)]"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          }
        >
          <AlertRail alerts={ALERTS} />
        </Panel>
      </div>
    </>
  );
}
