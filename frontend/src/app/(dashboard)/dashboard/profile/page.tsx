import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Shield, Network, Clock, Settings } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Card";
import { getSession } from "@/lib/current-user";

export const metadata: Metadata = { title: "Your profile" };

export default async function ProfilePage() {
  const session = await getSession();
  const initials = (session?.name ?? "Op")
    .split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  const meta = [
    { icon: Mail, label: "Email", value: session?.email ?? "—" },
    { icon: Shield, label: "Role", value: session?.role ?? "operator" },
    { icon: Network, label: "Assigned network", value: session?.network ?? "All networks" },
    { icon: Clock, label: "Shift", value: "Day · 06:00–14:00" },
  ];

  return (
    <>
      <PageHeader title="Your profile" subtitle="Account details and access" />
      <div className="grid max-w-4xl gap-6 p-5 lg:p-8">
        <Panel title="Profile">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[color:var(--color-brand)] to-[color:var(--color-ai)] text-2xl font-bold text-white">
              {initials}
            </span>
            <div>
              <div className="font-display text-2xl font-bold">{session?.name}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[color:var(--color-brand-100)] px-2.5 py-0.5 text-xs font-semibold uppercase text-[color:var(--color-brand)]">
                  {session?.role}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-crowd-low)]/12 px-2.5 py-0.5 text-xs font-medium text-[color:var(--color-crowd-low)]">
                  ● Active
                </span>
              </div>
            </div>
            <Link
              href="/dashboard/settings"
              className="mt-2 inline-flex items-center gap-1.5 rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] px-3 py-2 text-sm font-medium hover:border-[color:var(--color-brand)] hover:text-[color:var(--color-brand)] sm:ml-auto sm:mt-0"
            >
              <Settings size={15} /> Edit in settings
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {meta.map((m) => (
              <div key={m.label} className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-surface-2)] p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-card)] bg-[color:var(--color-surface)] text-[color:var(--color-ink-2)]">
                  <m.icon size={17} />
                </span>
                <div>
                  <div className="text-xs text-[color:var(--color-muted)]">{m.label}</div>
                  <div className="text-sm font-medium capitalize">{m.value}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Activity">
          <ul className="space-y-3 text-sm">
            {[
              ["Acknowledged overcrowding alert at Rajiv Chowk", "2 hours ago"],
              ["Applied schedule recommendation — Blue Line 07:00–10:00", "5 hours ago"],
              ["Exported analytics report (city flow)", "yesterday"],
            ].map(([a, t]) => (
              <li key={a} className="flex items-center justify-between border-b border-[color:var(--color-hairline)] pb-2 last:border-0">
                <span className="text-[color:var(--color-ink-2)]">{a}</span>
                <span className="text-xs text-[color:var(--color-muted)]">{t}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
