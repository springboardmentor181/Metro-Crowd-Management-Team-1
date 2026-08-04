/** Congestion heatmap (time × station) — sequential blue ramp (Doc 04 §2.5). */
const RAMP = [
  "#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b",
];

function color(v: number) {
  const idx = Math.min(RAMP.length - 1, Math.floor(v * RAMP.length));
  return RAMP[idx];
}

export function Heatmap({
  rows,
  cols,
  values,
}: {
  rows: string[];
  cols: string[];
  values: number[][];
}) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[520px]">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `120px repeat(${cols.length}, 1fr)` }}
        >
          <div />
          {cols.map((c) => (
            <div key={c} className="pb-1 text-center text-[10px] font-medium text-[color:var(--color-muted)]">
              {c}
            </div>
          ))}
          {rows.map((r, ri) => (
            <div key={r} className="contents">
              <div className="flex items-center pr-2 text-right text-[11px] text-[color:var(--color-ink-2)] justify-end">
                {r}
              </div>
              {cols.map((c, ci) => {
                const v = values[ri][ci];
                return (
                  <div
                    key={c}
                    title={`${r} · ${c}:00 — ${(v * 100).toFixed(0)}% congestion`}
                    className="aspect-[5/3] rounded-[4px] transition-transform hover:scale-[1.08]"
                    style={{ background: color(v) }}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-[color:var(--color-muted)]">
          <span>Low</span>
          <div className="flex h-2 flex-1 max-w-[160px] overflow-hidden rounded-full">
            {RAMP.map((c) => (
              <div key={c} className="flex-1" style={{ background: c }} />
            ))}
          </div>
          <span>Critical</span>
        </div>
      </div>
    </div>
  );
}
