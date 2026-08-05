"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell, Menu, Search, ChevronDown, LogOut, User, Settings,
  AlertTriangle, Clock, Siren, SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { signOutAction } from "@/lib/auth-actions";
import type { Session } from "@/lib/session";
import { getAlerts, type ApiAlert } from "@/lib/api";
import { NETWORKS } from "@/lib/stations";
import { CROWD, type CrowdLevel } from "@/lib/utils";

const NETWORK_OPTIONS = ["All networks", ...NETWORKS];
const TYPE_ICON = { overcrowding: AlertTriangle, delay: Clock, emergency: Siren };

export function Topbar({ session, onMenu }: { session: Session; onMenu?: () => void }) {
  const [menu, setMenu] = useState<null | "profile" | "notif">(null);
  const [openAlerts, setOpenAlerts] = useState<ApiAlert[]>([]);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const initials = session.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  useEffect(() => {
    getAlerts().then((r) => {
      if (r) setOpenAlerts(r.alerts.filter((a) => a.status === "open"));
    });
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenu(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] px-4">
      <button onClick={onMenu} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[color:var(--color-ink-2)] hover:bg-[color:var(--color-surface-2)] lg:hidden" aria-label="Menu">
        <Menu size={20} />
      </button>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          router.push(`/dashboard/stations${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
        }}
        className="hidden items-center gap-2 rounded-full border border-[color:var(--color-hairline)] bg-[color:var(--color-surface-2)] px-3 py-1.5 text-sm text-[color:var(--color-muted)] sm:flex"
      >
        <Search size={15} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search stations, lines…"
          className="w-40 bg-transparent text-[color:var(--color-ink)] outline-none placeholder:text-[color:var(--color-muted)]"
        />
      </form>

      <div className="ml-auto flex items-center gap-1.5" ref={ref}>
        <select
          defaultValue="All networks"
          onChange={(e) => {
            const v = e.target.value;
            router.push(
              v === "All networks"
                ? "/dashboard/stations"
                : `/dashboard/stations?network=${encodeURIComponent(v)}`
            );
          }}
          className="hidden max-w-[150px] rounded-full border border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] px-3 py-1.5 text-xs font-medium outline-none sm:block"
        >
          {NETWORK_OPTIONS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        {/* notifications */}
        <div className="relative">
          <button
            onClick={() => setMenu((m) => (m === "notif" ? null : "notif"))}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--color-ink-2)] hover:bg-[color:var(--color-surface-2)]"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {openAlerts.length > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--color-crowd-critical)] px-1 text-[9px] font-bold text-white">
                {openAlerts.length}
              </span>
            )}
          </button>
          {menu === "notif" && (
            <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] shadow-[var(--shadow-e3)]">
              <div className="flex items-center justify-between border-b border-[color:var(--color-hairline)] px-4 py-3">
                <span className="text-sm font-semibold">Notifications</span>
                <span className="rounded-full bg-[color:var(--color-crowd-critical)]/12 px-2 py-0.5 text-[11px] font-medium text-[color:var(--color-crowd-critical)]">
                  {openAlerts.length} new
                </span>
              </div>
              <ul className="max-h-72 divide-y divide-[color:var(--color-hairline)] overflow-y-auto">
                {openAlerts.map((a) => {
                  const Icon = TYPE_ICON[a.type];
                  const c = CROWD[a.severity as CrowdLevel];
                  return (
                    <li key={a.id} className="flex gap-3 px-4 py-3 hover:bg-[color:var(--color-surface-2)]">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: c.bg, color: c.color }}>
                        <Icon size={14} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{a.station}</div>
                        <div className="truncate text-xs text-[color:var(--color-ink-2)]">{a.message}</div>
                      </div>
                      <span className="shrink-0 text-[11px] text-[color:var(--color-muted)]">{a.ago}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="flex items-center justify-between border-t border-[color:var(--color-hairline)] px-4 py-2.5 text-xs">
                <Link href="/dashboard/alerts" onClick={() => setMenu(null)} className="font-medium text-[color:var(--color-brand)] hover:underline">
                  View all alerts
                </Link>
                <Link href="/dashboard/settings#notifications" onClick={() => setMenu(null)} className="inline-flex items-center gap-1 text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]">
                  <SlidersHorizontal size={12} /> Settings
                </Link>
              </div>
            </div>
          )}
        </div>

        <ThemeToggle />

        {/* profile */}
        <div className="relative">
          <button
            onClick={() => setMenu((m) => (m === "profile" ? null : "profile"))}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-[color:var(--color-surface-2)]"
          >
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[color:var(--color-brand)] to-[color:var(--color-ai)] text-xs font-bold text-white">
              {initials}
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[color:var(--color-surface)] bg-[color:var(--color-crowd-low)]" />
            </span>
            <ChevronDown size={14} className="text-[color:var(--color-muted)]" />
          </button>
          {menu === "profile" && (
            <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] shadow-[var(--shadow-e3)]">
              <div className="flex items-center gap-3 border-b border-[color:var(--color-hairline)] px-4 py-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[color:var(--color-brand)] to-[color:var(--color-ai)] text-sm font-bold text-white">
                  {initials}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{session.name}</div>
                  <div className="truncate text-xs text-[color:var(--color-muted)]">{session.email}</div>
                </div>
              </div>
              <div className="px-4 py-2">
                <span className="inline-block rounded-full bg-[color:var(--color-brand-100)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[color:var(--color-brand)]">
                  {session.role} · {session.network ?? "All networks"}
                </span>
              </div>
              <Link href="/dashboard/profile" onClick={() => setMenu(null)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[color:var(--color-surface-2)]">
                <User size={15} /> Your profile
              </Link>
              <Link href="/dashboard/settings" onClick={() => setMenu(null)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[color:var(--color-surface-2)]">
                <Settings size={15} /> Settings
              </Link>
              <form action={signOutAction} className="border-t border-[color:var(--color-hairline)]">
                <button className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[color:var(--color-crowd-critical)] hover:bg-[color:var(--color-surface-2)]">
                  <LogOut size={15} /> Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
