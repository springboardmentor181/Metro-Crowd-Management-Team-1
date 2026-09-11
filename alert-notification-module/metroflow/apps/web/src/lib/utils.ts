import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format large numbers compactly (e.g. 571540 -> "571.5K"). */
export function compact(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

/** Format an integer with Indian grouping. */
export function group(n: number): string {
  return new Intl.NumberFormat("en-IN").format(n);
}

export type CrowdLevel = "Low" | "Medium" | "High" | "Critical" | "Emergency";

export const CROWD: Record<
  CrowdLevel,
  { label: string; color: string; bg: string }
> = {
  Low: { label: "Low", color: "var(--color-crowd-low)", bg: "rgba(12,163,12,.12)" },
  Medium: { label: "Medium", color: "var(--color-crowd-medium)", bg: "rgba(250,178,25,.14)" },
  High: { label: "High", color: "var(--color-crowd-high)", bg: "rgba(236,131,90,.14)" },
  Critical: { label: "Critical", color: "var(--color-crowd-critical)", bg: "rgba(208,59,59,.14)" },
  Emergency: { label: "Emergency", color: "var(--color-crowd-emergency)", bg: "rgba(139,26,26,.16)" },
};
