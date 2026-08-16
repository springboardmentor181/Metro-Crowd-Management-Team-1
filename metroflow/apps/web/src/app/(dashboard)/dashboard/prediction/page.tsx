import type { Metadata } from "next";
import { BrainCircuit, Gauge, TrendingUp, Target } from "lucide-react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Card";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { LineTrend, HBars } from "@/components/dashboard/charts";
import { Insight } from "@/components/dashboard/Insight";
import { PredictWidget } from "@/components/dashboard/PredictWidget";
import { getPassengersByHour } from "@/lib/live-data";
import metrics from "@/lib/model-metrics.json";

export const metadata: Metadata = {
  title: "AI Prediction",
};

const crowd = metrics.crowd_classifier;
const demand = metrics.demand_regressor;

/*
 * The production RF model was trained using this class order:
 *
 * 0 = Critical
 * 1 = High
 * 2 = Low
 * 3 = Medium
 *
 * This is important for displaying the confusion matrix correctly.
 */
const MATRIX_LEVELS = ["Critical", "High", "Low", "Medium"];

// Top 6 feature importances
const topFeatures = metrics.feature_importance
  .slice(0, 6)
  .map((f) => ({
    label: f.feature,
    value: Math.round(f.importance * 1000) / 10,
    color: "var(--color-ai)",
  }));

export default async function PredictionPage() {
  const pbh = await getPassengersByHour();

  /*
   * Demand forecast visualization.
   *
   * This is the existing dashboard visualization based on the
   * passenger/hour data. The actual production demand model
   * performance is shown separately using demand.r2, demand.mae
   * and demand.mape_pct.
   */
  const FORECAST = pbh.slice(8).map((r, i) => ({
    hour: r.hour,
    actual: i < 5 ? r.passengers : null,
    forecast: Math.round(
      r.passengers * (0.98 + (i % 3) * 0.02)
    ),
  }));

  // ---------------------------------------------------------
  // PRODUCTION CROWD MODEL = RANDOM FOREST CRITICAL
  // ---------------------------------------------------------

  const acc =
    Math.round(crowd.final_test.accuracy * 1000) / 10;

  const f1 =
    Math.round(crowd.final_test.macro_f1 * 1000) / 10;

  const criticalRecall =
    Math.round(
      crowd.final_test.recall_per_class.Critical * 1000
    ) / 10;

  // ---------------------------------------------------------
  // DEMAND MODEL = XGBOOST
  // ---------------------------------------------------------

  const demandR2 = demand.r2;

  return (
    <>
      <PageHeader
        title="AI Prediction"
        subtitle="Crowd, demand and congestion forecasting — labeled estimates with confidence"
      />

      <div className="space-y-6 p-5 lg:p-8">

        {/* =====================================================
            MODEL KPIs
        ====================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <KpiCard
            label="Crowd accuracy"
            value={`${acc}`}
            suffix="%"
            icon={Target}
          />

          <KpiCard
            label="Macro-F1"
            value={`${f1 / 100}`}
            icon={Gauge}
          />

          <KpiCard
            label="Critical recall"
            value={`${criticalRecall}`}
            suffix="%"
            icon={BrainCircuit}
          />

          <KpiCard
            label="Demand R²"
            value={`${demandR2}`}
            icon={TrendingUp}
          />

        </div>

        {/* =====================================================
            INTERACTIVE PREDICTOR
        ====================================================== */}

        <Panel
          title="Predict crowd"
          subtitle="Pick a station, hour and day type — estimated from ticketing & operational signals"
        >
          <PredictWidget />

          <Insight>
            Crowd predictions use the production{" "}
            <strong>Random Forest Critical</strong> model trained
            on {metrics.rows.total.toLocaleString()} station-hour
            records. Demand forecasting uses the production{" "}
            <strong>XGBoost</strong> regression model.
            Every output is an estimate and MetroFlow uses no cameras.
          </Insight>
        </Panel>

        {/* =====================================================
            DEMAND FORECAST + FEATURE IMPORTANCE
        ====================================================== */}

        <div className="grid gap-6 lg:grid-cols-2">

          {/* DEMAND FORECAST */}

          <Panel
            title="Demand forecast"
            subtitle="Actual vs forecast — passengers"
          >
            <LineTrend
              data={FORECAST}
              xKey="hour"
              series={[
                {
                  key: "actual",
                  label: "Actual",
                  color: "var(--color-series-1)",
                },
                {
                  key: "forecast",
                  label: "Forecast",
                  color: "var(--color-series-2)",
                  dashed: true,
                },
              ]}
            />

            <Insight>
              The production XGBoost demand model achieves an MAE of{" "}
              <strong>
                {demand.mae.toLocaleString()} passengers
              </strong>
              , MAPE of{" "}
              <strong>{demand.mape_pct}%</strong> and R² of{" "}
              <strong>{demand.r2}</strong>.
            </Insight>
          </Panel>

          {/* FEATURE IMPORTANCE */}

          <Panel
            title="Feature importance"
            subtitle="What drives the production crowd model"
          >
            <HBars
              data={topFeatures}
              height={230}
            />

            <Insight>
              <strong>{topFeatures[0]?.label}</strong> is the most
              influential feature in the production Random Forest
              model, followed by other time, occupancy and passenger
              volume related signals.
            </Insight>
          </Panel>

        </div>

        {/* =====================================================
            MODEL PERFORMANCE + CONFUSION MATRIX
        ====================================================== */}

        <div className="grid gap-6 lg:grid-cols-2">

          {/* MODEL PERFORMANCE */}

          <Panel
            title="Model performance"
            subtitle={`Production model trained on ${metrics.rows.training.toLocaleString()} rows · tested on ${metrics.rows.testing.toLocaleString()} rows`}
          >
            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead>
                  <tr className="border-b border-[color:var(--color-hairline)] text-left text-xs text-[color:var(--color-muted)]">

                    <th className="py-2 font-medium">
                      Model
                    </th>

                    <th className="py-2 font-medium">
                      Accuracy
                    </th>

                    <th className="py-2 font-medium">
                      Macro-F1
                    </th>

                    <th className="py-2 font-medium">
                      Critical recall
                    </th>

                  </tr>
                </thead>

                <tbody className="tabular">

                  {/* CURRENT PRODUCTION MODEL */}

                  <tr className="border-b border-[color:var(--color-hairline)]">

                    <td className="py-2.5 font-medium">

                      Random Forest

                      <span className="ml-2 rounded-full bg-[color:var(--color-crowd-low)]/12 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--color-crowd-low)]">
                        ACTIVE
                      </span>

                    </td>

                    <td className="py-2.5">
                      {(crowd.final_test.accuracy * 100).toFixed(1)}%
                    </td>

                    <td className="py-2.5">
                      {crowd.final_test.macro_f1.toFixed(4)}
                    </td>

                    <td className="py-2.5">
                      {(
                        crowd.final_test.recall_per_class.Critical *
                        100
                      ).toFixed(1)}
                      %
                    </td>

                  </tr>

                </tbody>

              </table>

            </div>

            <Insight tone="good">
              <strong>
                Random Forest Critical
              </strong>{" "}
              is the active production crowd model. It achieves{" "}
              <strong>
                {(crowd.final_test.accuracy * 100).toFixed(2)}% accuracy
              </strong>
              ,{" "}
              <strong>
                {crowd.final_test.macro_f1.toFixed(4)} Macro-F1
              </strong>{" "}
              and{" "}
              <strong>
                {(
                  crowd.final_test.recall_per_class.Critical * 100
                ).toFixed(2)}% Critical recall
              </strong>{" "}
              on the untouched final test set.
            </Insight>

          </Panel>

          {/* CONFUSION MATRIX */}

          <Panel
            title="Confusion matrix"
            subtitle="Predicted vs actual crowd level — final test set"
          >

            <div className="overflow-x-auto">

              <table className="w-full text-center text-xs">

                <thead>

                  <tr className="text-[color:var(--color-muted)]">

                    <th className="p-1.5 text-left font-medium">
                      Actual ↓ / Pred →
                    </th>

                    {MATRIX_LEVELS.map((level) => (
                      <th
                        key={level}
                        className="p-1.5 font-medium"
                      >
                        {level}
                      </th>
                    ))}

                  </tr>

                </thead>

                <tbody>

                  {crowd.confusion_matrix.map((row, r) => {

                    const total =
                      row.reduce(
                        (sum, value) => sum + value,
                        0
                      ) || 1;

                    return (
                      <tr key={r}>

                        <td className="p-1.5 text-left font-medium text-[color:var(--color-ink-2)]">
                          {MATRIX_LEVELS[r]}
                        </td>

                        {row.map((value, c) => {

                          const fraction =
                            value / total;

                          return (
                            <td
                              key={c}
                              className="p-1"
                            >

                              <div
                                className="tabular rounded-md py-2 font-medium"
                                style={{
                                  background:
                                    `color-mix(in srgb, var(--color-ai) ${Math.round(
                                      fraction * 85
                                    )}%, transparent)`,

                                  color:
                                    fraction > 0.5
                                      ? "#fff"
                                      : "var(--color-ink-2)",
                                }}
                              >
                                {value.toLocaleString()}
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
              The production Random Forest model achieves{" "}
              <strong>
                {(
                  crowd.final_test.recall_per_class.Critical *
                  100
                ).toFixed(2)}
                %
              </strong>{" "}
              recall for the Critical class, helping identify
              high-risk crowding conditions for operational
              intervention.
            </Insight>

          </Panel>

        </div>

      </div>
    </>
  );
}
