import type { Metadata } from "next";
import Image from "next/image";
import { BrainCircuit, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Card";
import { LineTrend, HBars } from "@/components/dashboard/charts";
import { StatusChip } from "@/components/dashboard/StatusChip";
import { PASSENGERS_BY_HOUR } from "@/lib/mock-data";

export const metadata: Metadata = { title: "AI Prediction" };

const FORECAST = PASSENGERS_BY_HOUR.slice(8).map((r, i) => ({
  hour: r.hour,
  actual: i < 5 ? r.passengers : null,
  forecast: Math.round(r.passengers * (0.98 + (i % 3) * 0.02)),
}));

const FEATURES = [
  { label: "Hour of day", value: 9.8 },
  { label: "Passenger vol.", value: 8.5 },
  { label: "Station ID", value: 7.2 },
  { label: "Weather", value: 5.1 },
  { label: "Delay history", value: 4.3 },
];

export default function PredictionPage() {
  return (
    <>
      <PageHeader title="AI Prediction" subtitle="Crowd, demand and congestion forecasting — labeled estimated with confidence" />
      <div className="space-y-6 p-5 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel className="lg:col-span-1" title="Predict crowd" subtitle="Rajiv Chowk · next hour">
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ai)]">
                <Sparkles size={13} /> AI · estimated · v1.0.0
              </span>
              <StatusChip level="High" />
              <div>
                <div className="tabular font-display text-4xl font-bold">18,240</div>
                <div className="text-xs text-[color:var(--color-muted)]">predicted passengers</div>
              </div>
              <div className="grid w-full grid-cols-2 gap-2 pt-2">
                <div className="rounded-[var(--radius-card)] bg-[color:var(--color-surface-2)] p-3">
                  <div className="tabular text-lg font-bold">0.72</div>
                  <div className="text-[11px] text-[color:var(--color-muted)]">congestion prob.</div>
                </div>
                <div className="rounded-[var(--radius-card)] bg-[color:var(--color-surface-2)] p-3">
                  <div className="tabular text-lg font-bold text-[color:var(--color-crowd-low)]">88%</div>
                  <div className="text-[11px] text-[color:var(--color-muted)]">confidence</div>
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="lg:col-span-2" title="Demand forecast" subtitle="Actual vs forecast — passengers (thousands)">
            <LineTrend
              data={FORECAST}
              xKey="hour"
              series={[
                { key: "actual", label: "Actual", color: "var(--color-series-1)" },
                { key: "forecast", label: "Forecast", color: "var(--color-series-2)", dashed: true },
              ]}
            />
          </Panel>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Feature importance" subtitle="What drives this prediction (XGBoost)">
            <HBars
              data={FEATURES.map((f) => ({ label: f.label, value: f.value, color: "var(--color-ai)" }))}
              height={220}
            />
          </Panel>
          <Panel title="Model pipeline" subtitle="Dataset → features → model → prediction">
            <div className="overflow-hidden rounded-[var(--radius-card)]">
              <Image src="/assets/img/ai-pipeline.png" alt="AI model pipeline" width={800} height={600} className="h-auto w-full" />
            </div>
          </Panel>
        </div>

        <div className="flex items-center gap-2 rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-surface-2)] p-4 text-sm text-[color:var(--color-ink-2)]">
          <BrainCircuit size={18} className="text-[color:var(--color-ai)]" />
          Predictions are estimated from ticketing and operational data — no cameras. Every value ships with a confidence score.
        </div>
      </div>
    </>
  );
}
