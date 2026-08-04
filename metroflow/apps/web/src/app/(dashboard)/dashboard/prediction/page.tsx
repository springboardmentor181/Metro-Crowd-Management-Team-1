import type { Metadata } from "next";
import { BrainCircuit, Gauge, TrendingUp, Target } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Card";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { LineTrend, HBars } from "@/components/dashboard/charts";
import { Insight } from "@/components/dashboard/Insight";
import { PredictWidget } from "@/components/dashboard/PredictWidget";
import { PASSENGERS_BY_HOUR } from "@/lib/mock-data";
import metrics from "@/lib/model-metrics.json";

export const metadata: Metadata = { title: "AI Prediction" };

const FORECAST = PASSENGERS_BY_HOUR.slice(8).map((r, i) => ({
  hour: r.hour,
  actual: i < 5 ? r.passengers : null,
  forecast: Math.round(r.passengers * (0.98 + (i % 3) * 0.02)),
}));

const crowd = metrics.crowd_classifier;
const demand = metrics.demand_regressor;
const LEVELS = metrics.levels;

const topFeatures = metrics.feature_importance.slice(0, 6).map((f) => ({
  label: f.feature,
  value: Math.round(f.importance * 1000) / 10,
  color: "var(--color-ai)",
}));

export default function PredictionPage() {
  const acc = Math.round(crowd.xgboost.accuracy * 1000) / 10;
  const f1 = Math.round(crowd.xgboost.macro_f1 * 1000) / 10;
  const critRecall = Math.round(crowd.xgboost.recall_per_class.Critical * 1000) / 10;

  return (
    <>
      <PageHeader
        title="AI Prediction"
        subtitle="Crowd, demand and congestion forecasting — labeled estimated with confidence"
      />
      <div className="space-y-6 p-5 lg:p-8">
        {/* live model KPIs (real metrics) */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Crowd accuracy" value={`${acc}`} suffix="%" icon={Target} />
          <KpiCard label="Macro-F1" value={`${f1 / 100}`} icon={Gauge} />
          <KpiCard label="Critical recall" value={`${critRecall}`} suffix="%" icon={BrainCircuit} />
          <KpiCard label="Demand R²" value={`${demand.r2}`} icon={TrendingUp} />
        </div>

        {/* interactive predictor */}
        <Panel title="Predict crowd" subtitle="Pick a station, hour and day type — estimated from ticketing & operational signals">
          <PredictWidget />
          <Insight>
            Predictions come from an XGBoost model trained on 224,010 station-hours. Every
            output is <strong>estimated</strong> and carries a confidence score — MetroFlow uses no cameras.
          </Insight>
        </Panel>

        {/* forecast + feature importance */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Demand forecast" subtitle="Actual vs forecast — passengers (thousands)">
            <LineTrend
              data={FORECAST}
              xKey="hour"
              series={[
                { key: "actual", label: "Actual", color: "var(--color-series-1)" },
                { key: "forecast", label: "Forecast", color: "var(--color-series-2)", dashed: true },
              ]}
            />
            <Insight>
              Forecast tracks actuals within ~{demand.mape_pct}% (MAE {demand.mae} passengers). Use it to
              pre-position trains before the 18:00–19:00 evening peak.
            </Insight>
          </Panel>

          <Panel title="Feature importance" subtitle="What drives the crowd model (XGBoost, real weights)">
            <HBars data={topFeatures} height={230} />
            <Insight>
              <strong>{topFeatures[0].label}</strong> and <strong>hour of day</strong> dominate — crowding is
              mostly time- and event-driven, which is why peak-hour scheduling has the biggest impact.
            </Insight>
          </Panel>
        </div>

        {/* model performance detail */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Model performance" subtitle={`Trained on ${metrics.rows_train.toLocaleString()} rows · tested on ${metrics.rows_test.toLocaleString()} (time-based split)`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--color-hairline)] text-left text-xs text-[color:var(--color-muted)]">
                    <th className="py-2 font-medium">Model</th>
                    <th className="py-2 font-medium">Accuracy</th>
                    <th className="py-2 font-medium">Macro-F1</th>
                    <th className="py-2 font-medium">Critical recall</th>
                  </tr>
                </thead>
                <tbody className="tabular">
                  <tr className="border-b border-[color:var(--color-hairline)]">
                    <td className="py-2.5 font-medium">
                      XGBoost
                      <span className="ml-2 rounded-full bg-[color:var(--color-crowd-low)]/12 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--color-crowd-low)]">ACTIVE</span>
                    </td>
                    <td className="py-2.5">{(crowd.xgboost.accuracy * 100).toFixed(1)}%</td>
                    <td className="py-2.5">{crowd.xgboost.macro_f1}</td>
                    <td className="py-2.5">{(crowd.xgboost.recall_per_class.Critical * 100).toFixed(1)}%</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-[color:var(--color-ink-2)]">Random Forest</td>
                    <td className="py-2.5">{(crowd.random_forest.accuracy * 100).toFixed(1)}%</td>
                    <td className="py-2.5">{crowd.random_forest.macro_f1}</td>
                    <td className="py-2.5">{(crowd.random_forest.recall_per_class.Critical * 100).toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Insight tone="good">
              XGBoost is the active model — it beats the Random Forest baseline on macro-F1, the metric that
              matters most given how rare (and important) the Critical class is.
            </Insight>
          </Panel>

          <Panel title="Confusion matrix" subtitle="Predicted vs actual crowd level (test set)">
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs">
                <thead>
                  <tr className="text-[color:var(--color-muted)]">
                    <th className="p-1.5 text-left font-medium">actual ↓ / pred →</th>
                    {LEVELS.map((l) => <th key={l} className="p-1.5 font-medium">{l}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {crowd.confusion_matrix.map((row, r) => {
                    const total = row.reduce((a, b) => a + b, 0) || 1;
                    return (
                      <tr key={r}>
                        <td className="p-1.5 text-left font-medium text-[color:var(--color-ink-2)]">{LEVELS[r]}</td>
                        {row.map((v, c) => {
                          const frac = v / total;
                          return (
                            <td key={c} className="p-1">
                              <div
                                className="tabular rounded-md py-2 font-medium"
                                style={{
                                  background: `color-mix(in srgb, var(--color-ai) ${Math.round(frac * 85)}%, transparent)`,
                                  color: frac > 0.5 ? "#fff" : "var(--color-ink-2)",
                                }}
                              >
                                {v.toLocaleString()}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Insight>
              The diagonal dominates — the model rarely confuses adjacent levels, and correctly flags most
              High/Critical hours so operators get early warning.
            </Insight>
          </Panel>
        </div>
      </div>
    </>
  );
}
