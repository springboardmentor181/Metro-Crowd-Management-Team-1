import { CheckCircle2, CircleDot, TriangleAlert, OctagonAlert, Siren } from "lucide-react";
import { CROWD, type CrowdLevel } from "@/lib/utils";
import { cn } from "@/lib/utils";

const ICON: Record<CrowdLevel, typeof CheckCircle2> = {
  Low: CheckCircle2,
  Medium: CircleDot,
  High: TriangleAlert,
  Critical: OctagonAlert,
  Emergency: Siren,
};

/** Crowd status is ALWAYS color + icon + label (Doc 04 §2.3 — never color alone). */
export function StatusChip({
  level,
  className,
  size = "md",
}: {
  level: CrowdLevel;
  className?: string;
  size?: "sm" | "md";
}) {
  const c = CROWD[level];
  const Icon = ICON[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        className
      )}
      style={{ color: c.color, background: c.bg }}
    >
      <Icon size={size === "sm" ? 12 : 14} />
      {c.label}
    </span>
  );
}
