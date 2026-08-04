"use client";

import { useState } from "react";
import { Bell, Menu, Search, ChevronDown, LogOut, User, Settings } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { signOutAction } from "@/lib/auth-actions";
import type { Session } from "@/lib/session";

const NETWORKS = ["Delhi Metro", "Mumbai Metro", "Bengaluru Metro", "All networks"];

export function Topbar({
  session,
  onMenu,
}: {
  session: Session;
  onMenu?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = session.name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] px-4">
      <button
        onClick={onMenu}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[color:var(--color-ink-2)] hover:bg-[color:var(--color-surface-2)] lg:hidden"
        aria-label="Menu"
      >
        <Menu size={20} />
      </button>

      <div className="hidden items-center gap-2 rounded-full border border-[color:var(--color-hairline)] bg-[color:var(--color-surface-2)] px-3 py-1.5 text-sm text-[color:var(--color-muted)] sm:flex">
        <Search size={15} />
        <input
          placeholder="Search stations, lines…"
          className="w-40 bg-transparent outline-none placeholder:text-[color:var(--color-muted)]"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <select
          defaultValue={session.role === "admin" ? "All networks" : "Delhi Metro"}
          className="hidden rounded-full border border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] px-3 py-1.5 text-xs font-medium outline-none sm:block"
        >
          {NETWORKS.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>

        <Link
          href="/dashboard/alerts"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--color-ink-2)] hover:bg-[color:var(--color-surface-2)]"
          aria-label="Alerts"
        >
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[color:var(--color-crowd-critical)]" />
        </Link>

        <ThemeToggle />

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-[color:var(--color-surface-2)]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--color-brand)] text-xs font-bold text-white">
              {initials}
            </span>
            <ChevronDown size={14} className="text-[color:var(--color-muted)]" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] shadow-[var(--shadow-e3)]">
              <div className="border-b border-[color:var(--color-hairline)] px-4 py-3">
                <div className="text-sm font-medium">{session.name}</div>
                <div className="text-xs text-[color:var(--color-muted)]">{session.email}</div>
                <span className="mt-1.5 inline-block rounded-full bg-[color:var(--color-brand-100)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[color:var(--color-brand)]">
                  {session.role}
                </span>
              </div>
              <Link href="/dashboard/settings" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[color:var(--color-surface-2)]">
                <User size={15} /> Profile
              </Link>
              <Link href="/dashboard/settings" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[color:var(--color-surface-2)]">
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
