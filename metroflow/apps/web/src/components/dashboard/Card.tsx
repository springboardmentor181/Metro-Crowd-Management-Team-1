import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Panel({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("card", className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 border-b border-[color:var(--color-hairline)] px-5 py-3.5">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-[color:var(--color-ink)]">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-[color:var(--color-muted)]">
                {subtitle}
              </p>
            )}
          </div>
          {actions}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function TimeToggle({ active = "1D" }: { active?: string }) {
  const opts = ["1H", "1D", "1W", "1M"];
  return (
    <div className="inline-flex rounded-full border border-[color:var(--color-hairline)] p-0.5 text-xs">
      {opts.map((o) => (
        <button
          key={o}
          className={cn(
            "rounded-full px-2.5 py-1 font-medium transition-colors",
            o === active
              ? "bg-[color:var(--color-brand)] text-white"
              : "text-[color:var(--color-ink-2)] hover:bg-[color:var(--color-surface-2)]"
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
