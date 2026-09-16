import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CalendarClock,
  ShieldCheck,
  Users,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/marketing/Reveal";
import { StatCounter } from "@/components/marketing/StatCounter";
import { LogoMark } from "@/components/brand/Logo";

const MODULES = [
  { icon: Activity, label: "Crowd", href: "/features#crowd" },
  { icon: CalendarClock, label: "Scheduling", href: "/features#scheduling" },
  { icon: BrainCircuit, label: "Prediction", href: "/ai" },
  { icon: AlertTriangle, label: "Alerts", href: "/features#alerts" },
  { icon: BarChart3, label: "Analytics", href: "/features#analytics" },
];

const FEATURES = [
  {
    img: "/assets/img/station-interior.png",
    title: "Data-only crowd monitoring",
    body: "Estimate station density and congestion from ticketing, entry/exit and occupancy data — no cameras, no CCTV, privacy-preserving by design.",
    href: "/features#crowd",
  },
  {
    img: "/assets/img/ai-viz.png",
    title: "AI demand forecasting",
    body: "Predict passenger demand and crowd levels hour-ahead with XGBoost models trained on 90 days of real network patterns, festivals and weather.",
    href: "/ai",
  },
  {
    img: "/assets/img/illustration-flow.png",
    title: "Smart scheduling",
    body: "Get prescriptive train-frequency recommendations with an optimization score — reduce delays and overcrowding during peak hours.",
    href: "/features#scheduling",
  },
];

const HOW = [
  {
    icon: Users,
    title: "Ingest operational data",
    body: "Ticketing, smart-card taps, entry/exit records, train occupancy and schedule logs flow into one spine.",
  },
  {
    icon: BrainCircuit,
    title: "AI predicts density & demand",
    body: "Models forecast crowd level, passenger count and congestion probability per station and hour — labeled with confidence.",
  },
  {
    icon: CalendarClock,
    title: "Prescriptive scheduling out",
    body: "The platform recommends headway changes and raises alerts before overcrowding happens — not after.",
  },
];

const STATS = [
  { value: 725, suffix: "", label: "Stations monitored" },
  { value: 17, suffix: "", label: "Metro networks" },
  { value: 571540, suffix: "", label: "Operational records" },
  { value: 4, suffix: "-class", label: "Crowd AI model" },
];

export default function HomePage() {
  return (
    <>
      {/* ================= HERO ================= */}
      <section className="relative min-h-[92vh] overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster="/assets/img/hero-station.png"
        >
          <source src="/assets/video/hero-loop.mp4" type="video/mp4" />
        </video>
        {/* left-anchored neutral scrim for text legibility — keeps the video in true color */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        <div className="container-mf relative flex min-h-[92vh] flex-col justify-center pt-24 pb-16">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
              <ShieldCheck size={14} /> No cameras · privacy-preserving AI
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] text-white sm:text-6xl">
              Move the city.
              <br />
              <span className="text-[color:var(--color-accent)]">
                Predict the crowd.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/85">
              MetroFlow is an AI command center for metro operators — real-time
              crowd monitoring, demand forecasting and smart scheduling, built
              entirely from the ticketing and operational data you already
              collect.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/login" variant="accent" size="lg">
                Enter Dashboard <ArrowRight size={18} />
              </Button>
              <Button
                href="/#how"
                size="lg"
                className="border border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                See how it works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= MODULE HEX-NAV ================= */}
      <section id="platform" className="container-mf -mt-14 relative z-10">
        <Reveal>
          <div className="card flex flex-wrap items-center justify-center gap-4 p-6 sm:gap-8">
            {MODULES.map((m) => (
              <Link
                key={m.label}
                href={m.href}
                className="group flex flex-col items-center gap-2"
              >
                <span
                  className="flex h-16 w-16 items-center justify-center bg-[color:var(--color-brand-100)] text-[color:var(--color-brand)] transition-colors group-hover:bg-[color:var(--color-brand)] group-hover:text-white"
                  style={{
                    clipPath:
                      "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)",
                  }}
                >
                  <m.icon size={24} />
                </span>
                <span className="text-sm font-medium text-[color:var(--color-ink-2)] group-hover:text-[color:var(--color-brand)]">
                  {m.label}
                </span>
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ================= FEATURE CARDS ================= */}
      <section className="container-mf py-24">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              One platform for the whole network
            </h2>
            <p className="mt-4 text-[color:var(--color-ink-2)]">
              From a single line to a 700-station multi-network view — monitor,
              predict and optimize from one command center.
            </p>
          </div>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.1}>
              <Link
                href={f.href}
                className="card group block overflow-hidden transition-shadow hover:shadow-[var(--shadow-e2)]"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={f.img}
                    alt={f.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-[color:var(--color-ink-2)]">
                    {f.body}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[color:var(--color-accent)]">
                    Learn more <ArrowRight size={15} />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section
        id="how"
        className="relative overflow-hidden bg-[color:var(--color-surface-2)] py-24"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "url(/assets/img/brand-pattern.png)",
            backgroundSize: "600px",
          }}
        />
        <div className="container-mf relative grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div>
              <span className="text-sm font-semibold uppercase tracking-wide text-[color:var(--color-accent)]">
                How it works
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
                Intelligence from data you already have
              </h2>
              <p className="mt-4 text-[color:var(--color-ink-2)]">
                No new hardware. No surveillance. MetroFlow turns your automatic
                fare collection and train telemetry into predictive operations.
              </p>
              <div className="mt-8 space-y-6">
                {HOW.map((h, i) => (
                  <div key={h.title} className="flex gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-card)] bg-[color:var(--color-brand)] text-white">
                      <h.icon size={20} />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[color:var(--color-muted)]">
                          0{i + 1}
                        </span>
                        <h3 className="font-semibold">{h.title}</h3>
                      </div>
                      <p className="mt-1 text-sm text-[color:var(--color-ink-2)]">
                        {h.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="card overflow-hidden">
              <video
                className="h-auto w-full"
                autoPlay
                muted
                loop
                playsInline
                poster="/assets/img/ai-viz.png"
              >
                <source src="/assets/video/ai-dataviz-anim.mp4" type="video/mp4" />
              </video>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= IMPACT STATS ================= */}
      <section
        id="impact"
        className="relative overflow-hidden bg-[color:var(--color-brand)] py-20 text-white"
      >
        <div className="container-mf">
          <Reveal>
            <h2 className="text-center font-display text-3xl font-bold">
              Built on real network scale
            </h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.08}>
                <div className="text-center">
                  <div className="font-display text-4xl font-bold text-[color:var(--color-accent)] sm:text-5xl">
                    <StatCounter value={s.value} suffix={s.suffix} />
                  </div>
                  <div className="mt-2 text-sm text-white/80">{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="container-mf py-24">
        <Reveal>
          <div className="card relative overflow-hidden bg-[color:var(--color-brand-900)] p-10 text-center sm:p-16">
            <LogoMark
              variant="reversed"
              className="mx-auto h-12 w-12 opacity-90"
            />
            <h2 className="mt-6 font-display text-3xl font-bold text-white sm:text-4xl">
              Enter the command center
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/80">
              Sign in to monitor passenger flow, forecast demand and optimize
              schedules across your metro network in real time.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button href="/login" variant="accent" size="lg">
                Enter Dashboard <ArrowRight size={18} />
              </Button>
              <Button
                href="/contact"
                size="lg"
                className="border border-white/30 bg-transparent text-white hover:bg-white/10"
              >
                Request access
              </Button>
            </div>
            <ul className="mx-auto mt-8 flex max-w-lg flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/70">
              {["No cameras", "Privacy-preserving", "Enterprise-grade"].map(
                (t) => (
                  <li key={t} className="inline-flex items-center gap-1.5">
                    <CheckCircle2
                      size={15}
                      className="text-[color:var(--color-accent)]"
                    />
                    {t}
                  </li>
                )
              )}
            </ul>
          </div>
        </Reveal>
      </section>
    </>
  );
}
