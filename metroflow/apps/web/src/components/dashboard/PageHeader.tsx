import { Radio } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  live = false,
  actions,
}: {
  title: string;
  subtitle?: string;
  live?: boolean;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] px-5 py-4 lg:px-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-xl font-bold">{title}</h1>
          {live && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-crowd-low)]/12 px-2 py-0.5 text-[11px] font-medium text-[color:var(--color-crowd-low)]">
              <Radio size={11} /> Live
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-0.5 text-sm text-[color:var(--color-ink-2)]">{subtitle}</p>
        )}
      </div>
      {actions}
    </div>
  );
}
