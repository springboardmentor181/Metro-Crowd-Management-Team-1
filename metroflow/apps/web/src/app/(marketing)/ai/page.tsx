import type { Metadata } from "next";
import { ShieldCheck, GitBranch, Gauge, TrendingUp } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";
import metrics from "@/lib/model-metrics.json";

export const metadata: Metadata = { title: "AI & Technology" };

const STATS = [
  { value: `${(metrics.crowd_classifier.xgboost.accuracy * 100).toFixed(1)}%`, label: "Crowd accuracy" },
  { value: `${metrics.crowd_classifier.xgboost.macro_f1}`, label: "Macro-F1" },
  { value: `${metrics.demand_regressor.r2}`, label: "Demand R²" },
  { value: `${metrics.rows_total.toLocaleString()}`, label: "Training rows" },
];

const MODELS = [
  {
    icon: Gauge,
    name: "Crowd classifier",
    algo: "XGBoost · Random Forest",
    desc: "Predicts next-hour crowd level (Low / Medium / High / Critical) per station, weighted for the rare Critical class.",
  },
  {
    icon: TrendingUp,
    name: "Demand forecaster",
    algo: "Gradient Boosting",
    desc: "Forecasts passenger counts using lag features, calendar, weather, festivals and events.",
  },
  {
    icon: GitBranch,
    name: "Scheduling recommender",
    algo: "Rules + Regression",
    desc: "Recommends train frequency with an optimization score — interpretable and auditable, never a black box.",
  },
];

export default function AiPage() {
  return (
    <>
      <section className="bg-[color:var(--color-brand-900)] pt-28 pb-16 text-white">
        <div className="container-mf">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
            <ShieldCheck size={14} /> No computer vision · no CCTV
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold sm:text-5xl">
            AI that respects passengers
          </h1>
          <p className="mt-4 max-w-2xl text-white/85">
            MetroFlow estimates crowds from ticketing and operational data — not
            cameras. Every prediction ships with a confidence score and is
            labeled <em>estimated</em>. No false precision.
          </p>
        </div>
      </section>

      <section className="container-mf py-20">
        <Reveal>
          <div className="card overflow-hidden">
            <video className="h-auto w-full" autoPlay muted loop playsInline poster="/assets/img/ai-viz.png">
              <source src="/assets/video/ai-dataviz-anim.mp4" type="video/mp4" />
            </video>
          </div>
        </Reveal>

        {/* real trained metrics */}
        <Reveal delay={0.1}>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="card p-5 text-center">
                <div className="font-display text-3xl font-bold text-[color:var(--color-ai)]">{s.value}</div>
                <div className="mt-1 text-xs text-[color:var(--color-ink-2)]">{s.label}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-[color:var(--color-muted)]">
            Live metrics from the XGBoost crowd model, trained on the MetroFlow dataset with a time-based split.
          </p>
        </Reveal>
      </section>

      <section className="container-mf pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {MODELS.map((m, i) => (
            <Reveal key={m.name} delay={i * 0.1}>
              <div className="card h-full p-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-card)] bg-[color:var(--color-ai)]/10 text-[color:var(--color-ai)]">
                  <m.icon size={22} />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{m.name}</h3>
                <div className="text-xs font-medium uppercase tracking-wide text-[color:var(--color-accent)]">
                  {m.algo}
                </div>
                <p className="mt-3 text-sm text-[color:var(--color-ink-2)]">
                  {m.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
