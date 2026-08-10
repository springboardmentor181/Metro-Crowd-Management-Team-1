import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "accent" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius-card)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-plane)] disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-[color:var(--color-brand)] text-white hover:bg-[color:var(--color-brand-900)]",
  accent:
    "bg-[color:var(--color-accent)] text-white hover:bg-[color:var(--color-accent-600)]",
  ghost:
    "bg-transparent text-[color:var(--color-ink)] hover:bg-[color:var(--color-brand-100)]",
  outline:
    "border border-[color:var(--color-hairline)] bg-transparent text-[color:var(--color-ink)] hover:bg-[color:var(--color-surface-2)]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

type ButtonProps = {
  variant?: Variant;
  size?: Size;
} & (
  | ({ href: string } & ComponentProps<typeof Link>)
  | ({ href?: undefined } & ComponentProps<"button">)
);

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  const classes = cn(base, variants[variant], sizes[size], className);
  if ("href" in props && props.href) {
    return <Link className={classes} {...(props as ComponentProps<typeof Link>)} />;
  }
  return <button className={classes} {...(props as ComponentProps<"button">)} />;
}
