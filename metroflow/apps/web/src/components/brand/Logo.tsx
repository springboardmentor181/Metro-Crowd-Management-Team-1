import { cn } from "@/lib/utils";

type Variant = "brand" | "mono" | "reversed";

/**
 * MetroFlow logo mark — hexagon + transit node with a flow tail.
 * Recreated as vector to match the supplied logo art (Doc 07 A1/A2).
 */
export function LogoMark({
  className,
  variant = "brand",
  title = "MetroFlow",
}: {
  className?: string;
  variant?: Variant;
  title?: string;
}) {
  const hex =
    variant === "reversed" ? "#ffffff" : variant === "mono" ? "currentColor" : "var(--color-brand)";
  const flow =
    variant === "reversed" ? "#ffffff" : variant === "mono" ? "currentColor" : "var(--color-accent)";
  const node = variant === "brand" ? "var(--color-brand)" : hex;

  return (
    <svg
      viewBox="0 0 120 110"
      className={cn("h-8 w-8", className)}
      role="img"
      aria-label={title}
      fill="none"
    >
      <title>{title}</title>
      {/* hexagon */}
      <path
        d="M32 8 H88 L116 55 L88 102 H32 L4 55 Z"
        stroke={hex}
        strokeWidth="8"
        strokeLinejoin="round"
      />
      {/* node dot */}
      <circle cx="40" cy="62" r="8" fill={node} />
      {/* flow tail */}
      <path
        d="M40 62 H58 C74 62 70 40 92 40"
        stroke={flow}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LogoWordmark({
  className,
  variant = "brand",
  showMark = true,
}: {
  className?: string;
  variant?: Variant;
  showMark?: boolean;
}) {
  const textColor =
    variant === "reversed" ? "text-white" : "text-[color:var(--color-ink)]";
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {showMark && <LogoMark variant={variant} className="h-7 w-7" />}
      <span
        className={cn(
          "font-display text-xl font-bold tracking-tight",
          textColor
        )}
      >
        Metro<span className="text-[color:var(--color-accent)]">Flow</span>
      </span>
    </span>
  );
}
