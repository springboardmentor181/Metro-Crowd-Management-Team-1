import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  suffix,
  trend,
  icon: Icon,
  invertTrend = false,
  spark,
}: {
  label: string;
  value: string;
  suffix?: string;
  trend?: number;
  icon: LucideIcon;
  invertTrend?: boolean;
  spark?: React.ReactNode;
}) {
  const good = trend === undefined ? true : invertTrend ? trend < 0 : trend > 0;
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-[color:var(--color-muted)]">
          {label}
        </span>
        <Icon size={16} className="text-[color:var(--color-muted)]" />
      </div>
      <div className="mt-2 flex items-end gap-2">
        <span className="tabular font-display text-3xl font-bold leading-none">
          {value}
        </span>
        {suffix && (
          <span className="pb-0.5 text-sm text-[color:var(--color-ink-2)]">
            {suffix}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between">
        {trend !== undefined ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium",
              good
                ? "text-[color:var(--color-crowd-low)]"
                : "text-[color:var(--color-crowd-critical)]"
            )}
          >
            {trend >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(trend)}%
          </span>
        ) : (
          <span />
        )}
        {spark}
      </div>
    </div>
  );
}
