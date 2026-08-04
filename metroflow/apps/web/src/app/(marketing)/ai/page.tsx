import Image from "next/image";
import type { Metadata } from "next";
import { ShieldCheck, GitBranch, Gauge, TrendingUp } from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

export const metadata: Metadata = { title: "AI & Technology" };

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
            <Image
              src="/assets/img/ai-pipeline.png"
              alt="AI pipeline: metro dataset, feature engineering, ML prediction model, prediction output"
              width={1200}
              height={900}
              className="h-auto w-full"
            />
          </div>
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
