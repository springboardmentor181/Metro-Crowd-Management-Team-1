"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Activity, CalendarClock, BrainCircuit,
  AlertTriangle, BarChart3, Users, Settings, Train,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LogoWordmark } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/session";

type Item = { label: string; href: string; icon: LucideIcon; admin?: boolean };
type Group = { title: string; items: Item[] };

const GROUPS: Group[] = [
  {
    title: "Main",
    items: [{ label: "Overview", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Monitoring",
    items: [
      { label: "Crowd Monitoring", href: "/dashboard/crowd", icon: Activity },
      { label: "Scheduling", href: "/dashboard/scheduling", icon: CalendarClock },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { label: "AI Prediction", href: "/dashboard/prediction", icon: BrainCircuit },
      { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Alerts", href: "/dashboard/alerts", icon: AlertTriangle },
      { label: "Users", href: "/dashboard/users", icon: Users, admin: true },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export function Sidebar({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <aside className="flex h-full w-64 flex-col bg-[color:var(--color-brand-900)] text-white">
      <div className="flex h-16 items-center gap-2 px-5">
        <LogoWordmark variant="reversed" />
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {GROUPS.map((g) => {
          const items = g.items.filter((i) => !i.admin || role === "admin");
          if (!items.length) return null;
          return (
            <div key={g.title}>
              <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                {g.title}
              </div>
              <ul className="space-y-0.5">
                {items.map((i) => {
                  const active =
                    i.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(i.href);
                  return (
                    <li key={i.href}>
                      <Link
                        href={i.href}
                        onClick={onNavigate}
                        className={cn(
                          "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-white/10 text-white"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        {active && (
                          <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-[color:var(--color-accent)]" />
                        )}
                        <i.icon size={18} />
                        {i.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4 text-xs text-white/50">
        <span className="inline-flex items-center gap-1.5">
          <Train size={13} /> Delhi Metro · Live replay
        </span>
      </div>
    </aside>
  );
}
