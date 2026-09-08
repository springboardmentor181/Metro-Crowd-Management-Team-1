"use client";

import { useState } from "react";
import { AlertTriangle, Clock, Siren, Mail, Smartphone, Bell, Moon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        on ? "bg-[color:var(--color-brand)]" : "bg-[color:var(--color-hairline)]"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
          on ? "translate-x-[22px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function Row({
  icon: Icon,
  title,
  desc,
  on,
  toggle,
  color,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  on: boolean;
  toggle: () => void;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-card)]"
        style={{ background: "var(--color-surface-2)", color: color ?? "var(--color-ink-2)" }}
      >
        <Icon size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-[color:var(--color-muted)]">{desc}</div>
      </div>
      <Toggle on={on} onClick={toggle} />
    </div>
  );
}

export function NotificationSettings() {
  const [state, setState] = useState({
    overcrowding: true,
    delay: true,
    emergency: true,
    email: false,
    push: true,
    inapp: true,
    quiet: false,
  });
  const [saved, setSaved] = useState(false);
  const set = (k: keyof typeof state) => () => {
    setState((s) => ({ ...s, [k]: !s[k] }));
    setSaved(false);
  };
  function save() {
    try {
      localStorage.setItem("mf_notif_prefs", JSON.stringify(state));
    } catch {
      /* ignore */
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="divide-y divide-[color:var(--color-hairline)]">
      <div className="pb-1">
        <div className="pb-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
          Alert types
        </div>
        <Row icon={AlertTriangle} title="Overcrowding alerts" desc="When a station reaches High or Critical" on={state.overcrowding} toggle={set("overcrowding")} color="var(--color-crowd-high)" />
        <Row icon={Clock} title="Delay notifications" desc="Trains delayed beyond threshold" on={state.delay} toggle={set("delay")} color="var(--color-crowd-medium)" />
        <Row icon={Siren} title="Emergency announcements" desc="Critical incidents & evacuations" on={state.emergency} toggle={set("emergency")} color="var(--color-crowd-critical)" />
      </div>

      <div className="py-1">
        <div className="py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
          Channels
        </div>
        <Row icon={Bell} title="In-app notifications" desc="Show in the dashboard alert rail" on={state.inapp} toggle={set("inapp")} />
        <Row icon={Smartphone} title="Push notifications" desc="Mobile push to on-duty operators" on={state.push} toggle={set("push")} />
        <Row icon={Mail} title="Email digest" desc="Hourly summary of open alerts" on={state.email} toggle={set("email")} />
      </div>

      <div className="pt-1">
        <div className="pt-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
          Do not disturb
        </div>
        <Row icon={Moon} title="Quiet hours (22:00–05:00)" desc="Mute non-emergency alerts overnight" on={state.quiet} toggle={set("quiet")} />
      </div>

      <div className="flex items-center gap-3 pt-4">
        <button
          onClick={save}
          className="rounded-[var(--radius-card)] bg-[color:var(--color-brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--color-brand-900)]"
        >
          Save preferences
        </button>
        {saved && (
          <span className="text-sm font-medium text-[color:var(--color-crowd-low)]">✓ Preferences saved</span>
        )}
      </div>
    </div>
  );
}
