/** Radial occupancy gauge (SVG donut). */
export function DonutGauge({
  value,
  label,
  color = "var(--color-brand)",
  size = 132,
}: {
  value: number; // 0-100
  label?: string;
  color?: string;
  size?: number;
}) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(100, value) / 100);
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-hairline)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="-mt-[85px] mb-[50px] text-center">
        <div className="tabular font-display text-2xl font-bold">{value}%</div>
        {label && <div className="text-[11px] text-[color:var(--color-muted)]">{label}</div>}
      </div>
    </div>
  );
}
