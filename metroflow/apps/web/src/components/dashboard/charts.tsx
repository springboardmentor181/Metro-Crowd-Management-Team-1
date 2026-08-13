"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const AXIS = "var(--color-muted)";
const GRID = "var(--color-hairline)";

const kfmt = (v: number) =>
  Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`;
const SERIES = [
  "var(--color-series-1)", "var(--color-series-2)", "var(--color-series-3)",
  "var(--color-series-4)", "var(--color-series-5)", "var(--color-series-6)",
];

function tip() {
  return {
    contentStyle: {
      background: "var(--color-surface)",
      border: "1px solid var(--color-hairline)",
      borderRadius: 10,
      fontSize: 12,
      color: "var(--color-ink)",
      boxShadow: "var(--shadow-e2)",
    },
    labelStyle: { color: "var(--color-ink-2)", fontWeight: 600 },
    itemStyle: { color: "var(--color-ink)" },
  } as const;
}

/** Passenger-flow area chart with crosshair tooltip. */
export function AreaTrend({
  data,
  xKey,
  series,
  height = 260,
}: {
  data: Record<string, number | string | null>[];
  xKey: string;
  series: { key: string; label: string; color?: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient id={`g-${s.key}`} key={s.key} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color ?? SERIES[i]} stopOpacity={0.3} />
              <stop offset="100%" stopColor={s.color ?? SERIES[i]} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={{ stroke: GRID }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} width={44} tickFormatter={kfmt} />
        <Tooltip {...tip()} />
        {series.map((s, i) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color ?? SERIES[i]}
            strokeWidth={2}
            fill={`url(#g-${s.key})`}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function LineTrend({
  data, xKey, series, height = 240,
}: {
  data: Record<string, number | string | null>[];
  xKey: string;
  series: { key: string; label: string; color?: string; dashed?: boolean }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={{ stroke: GRID }} />
        <YAxis tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} width={44} tickFormatter={kfmt} />
        <Tooltip {...tip()} />
        {series.map((s, i) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.label}
            stroke={s.color ?? SERIES[i]} strokeWidth={2}
            strokeDasharray={s.dashed ? "5 4" : undefined} dot={false} activeDot={{ r: 4 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Vertical bars (footfall / demand). */
export function VBars({
  data, xKey, yKey, height = 260, color = SERIES[0],
}: {
  data: Record<string, number | string | null>[];
  xKey: string; yKey: string; height?: number; color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: AXIS }} tickLine={false} axisLine={{ stroke: GRID }} interval={0} angle={-20} textAnchor="end" height={54} />
        <YAxis tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} width={44} tickFormatter={kfmt} />
        <Tooltip {...tip()} cursor={{ fill: "var(--color-surface-2)" }} />
        <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} maxBarSize={38} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Horizontal distribution bars with per-row colors. */
export function HBars({
  data, height = 240,
}: {
  data: { label: string; value: number; color?: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart layout="vertical" data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} tickFormatter={kfmt} />
        <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: "var(--color-ink-2)" }} tickLine={false} axisLine={false} width={130} />
        <Tooltip {...tip()} cursor={{ fill: "var(--color-surface-2)" }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color ?? SERIES[i % SERIES.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Sparkline({ data, color = "var(--color-accent)" }: { data: number[]; color?: string }) {
  const d = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width={80} height={28}>
      <LineChart data={d}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
