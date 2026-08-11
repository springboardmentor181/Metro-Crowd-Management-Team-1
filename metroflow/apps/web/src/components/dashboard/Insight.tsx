import { Lightbulb } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Operator insight caption — a plain-language "what this means / what to do"
 * note under a chart so operators can read the data at a glance.
 */
export function Insight({
  children,
  tone = "info",
  className,
}: {
  children: ReactNode;
  tone?: "info" | "warn" | "good";
  className?: string;
}) {
  const color =
    tone === "warn"
      ? "var(--color-crowd-high)"
      : tone === "good"
      ? "var(--color-crowd-low)"
      : "var(--color-ai)";
  return (
    <div
      className={cn(
        "mt-3 flex items-start gap-2 rounded-[var(--radius-card)] border px-3 py-2 text-xs leading-relaxed",
        className
      )}
      style={{ borderColor: "var(--color-hairline)", background: "var(--color-surface-2)" }}
    >
      <Lightbulb size={14} className="mt-0.5 shrink-0" style={{ color }} />
      <span className="text-[color:var(--color-ink-2)]">{children}</span>
    </div>
  );
}
