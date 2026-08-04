import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Palette, Gauge, User, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Card";
import { NotificationSettings } from "@/components/dashboard/NotificationSettings";
import { getSession } from "@/lib/current-user";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await getSession();

  return (
    <>
      <PageHeader title="Settings" subtitle="Notifications, appearance and operational preferences" />
      <div className="grid max-w-3xl gap-6 p-5 lg:p-8">
        {/* link to profile (no duplicated form here) */}
        <Link
          href="/dashboard/profile"
          className="card flex items-center gap-3 p-4 transition-colors hover:border-[color:var(--color-brand)]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[color:var(--color-brand)] to-[color:var(--color-ai)] text-sm font-bold text-white">
            {(session?.name ?? "Op").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
          </span>
          <div className="flex-1">
            <div className="text-sm font-medium">{session?.name}</div>
            <div className="text-xs text-[color:var(--color-muted)]">
              {session?.role} · manage your profile
            </div>
          </div>
          <User size={16} className="text-[color:var(--color-muted)]" />
          <ChevronRight size={16} className="text-[color:var(--color-muted)]" />
        </Link>

        {/* NOTIFICATIONS */}
        <section id="notifications" className="scroll-mt-20">
          <Panel
            title={<span className="inline-flex items-center gap-2"><Bell size={16} /> Notifications</span>}
            subtitle="Choose which alerts you receive and how"
          >
            <NotificationSettings />
          </Panel>
        </section>

        {/* APPEARANCE */}
        <Panel title={<span className="inline-flex items-center gap-2"><Palette size={16} /> Appearance</span>}>
          <p className="text-sm text-[color:var(--color-ink-2)]">
            Switch between light and dark themes using the toggle in the top bar. The dashboard is
            optimized for control-room displays in both modes.
          </p>
        </Panel>

        {/* OPERATIONS (admin) */}
        {session?.role === "admin" && (
          <Panel title={<span className="inline-flex items-center gap-2"><Gauge size={16} /> Realtime replay</span>} subtitle="Admin only">
            <div className="space-y-4">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Replay speed</span>
                <select className="w-full max-w-xs rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] px-3 py-2.5 text-sm outline-none focus:border-[color:var(--color-brand)]">
                  <option>1× (real time)</option>
                  <option>60× (1 min = 1 hr)</option>
                  <option defaultChecked>3600× (1 sec = 1 hr)</option>
                </select>
              </label>
              <p className="text-xs text-[color:var(--color-muted)]">
                MetroFlow streams the historical dataset on a simulated clock to drive live
                monitoring and alerts.
              </p>
            </div>
          </Panel>
        )}
      </div>
    </>
  );
}
