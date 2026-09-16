import type { Metadata } from "next";
import { CalendarClock, Clock, TrendingDown, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Panel } from "@/components/dashboard/Card";
import { HBars } from "@/components/dashboard/charts";
import { SchedulingRecos } from "@/components/dashboard/SchedulingRecos";
import { getScheduleRecos, getServiceStatus } from "@/lib/live-data";
import { getSession } from "@/lib/current-user";

export const metadata: Metadata = { title: "Scheduling" };

export default async function SchedulingPage() {
  const [session, SCHEDULE_RECOS, SERVICE_STATUS] = await Promise.all([
    getSession(), getScheduleRecos(), getServiceStatus(),
  ]);
  const isAdmin = session?.role === "admin";

  return (
    <>
      <PageHeader title="Scheduling Management" subtitle="Frequency optimization, delay handling and AI recommendations" />
      <div className="space-y-6 p-5 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Avg delay" value="4.28" suffix="min" icon={Clock} trend={-3.1} invertTrend />
          <KpiCard label="On-time" value="88" suffix="%" icon={CalendarClock} trend={0.6} />
          <KpiCard label="Open recommendations" value={`${SCHEDULE_RECOS.length}`} icon={Sparkles} />
          <KpiCard label="Delay reduction (est.)" value="12" suffix="%" icon={TrendingDown} trend={12} />
        </div>

        <Panel
          title="AI frequency recommendations"
          subtitle={isAdmin ? "Apply to update the operating schedule" : "Operators can propose; admins apply"}
        >
          <SchedulingRecos recos={SCHEDULE_RECOS} isAdmin={isAdmin} />
        </Panel>

        <Panel title="Service status" subtitle="Train operations (90-day)">
          <HBars
            data={SERVICE_STATUS.map((s) => ({
              label: s.status,
              value: s.count,
              color:
                s.status === "Running" ? "var(--color-crowd-low)" :
                s.status === "Delayed" ? "var(--color-crowd-medium)" :
                "var(--color-crowd-critical)",
            }))}
            height={180}
          />
        </Panel>
      </div>
    </>
  );
}
