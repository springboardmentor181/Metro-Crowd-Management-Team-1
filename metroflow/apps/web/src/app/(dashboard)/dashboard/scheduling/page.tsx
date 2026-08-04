import type { Metadata } from "next";
import { CalendarClock, Clock, TrendingDown, ArrowRight, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Panel } from "@/components/dashboard/Card";
import { HBars } from "@/components/dashboard/charts";
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
          <div className="grid gap-4 md:grid-cols-2">
            {SCHEDULE_RECOS.map((r) => {
              const change = r.current !== r.recommended;
              return (
                <div key={r.line + r.slot} className="rounded-[var(--radius-card)] border border-[color:var(--color-ai)]/25 bg-[color:var(--color-ai)]/[0.04] p-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ai)]">
                      <Sparkles size={13} /> AI · estimated
                    </span>
                    <span className="text-xs text-[color:var(--color-muted)]">score {r.score}</span>
                  </div>
                  <h3 className="mt-2 font-semibold">{r.line}</h3>
                  <p className="text-xs text-[color:var(--color-ink-2)]">{r.slot}</p>
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <span className="tabular rounded-md bg-[color:var(--color-surface-2)] px-2 py-1">{r.current} min</span>
                    <ArrowRight size={15} className="text-[color:var(--color-muted)]" />
                    <span className="tabular rounded-md bg-[color:var(--color-accent)]/12 px-2 py-1 font-semibold text-[color:var(--color-accent)]">
                      {r.recommended} min
                    </span>
                    {change ? (
                      <span className="text-xs text-[color:var(--color-crowd-low)]">↑ frequency</span>
                    ) : (
                      <span className="text-xs text-[color:var(--color-muted)]">no change</span>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 rounded-[var(--radius-card)] bg-[color:var(--color-brand)] px-3 py-2 text-xs font-medium text-white hover:bg-[color:var(--color-brand-900)] disabled:opacity-40" disabled={!isAdmin}>
                      {isAdmin ? "Apply" : "Admin only"}
                    </button>
                    <button className="rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] px-3 py-2 text-xs font-medium text-[color:var(--color-ink-2)] hover:bg-[color:var(--color-surface-2)]">
                      {isAdmin ? "Dismiss" : "Propose"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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
