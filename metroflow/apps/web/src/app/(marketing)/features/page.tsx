import Image from "next/image";
import type { Metadata } from "next";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CalendarClock,
  Map,
} from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

export const metadata: Metadata = { title: "Features" };

const MODULES = [
  {
    id: "crowd",
    icon: Activity,
    title: "Crowd Monitoring",
    points: [
      "Passenger density tracking from ticketing & occupancy",
      "Station congestion levels (Low → Critical)",
      "Congestion heatmaps by hour and station",
      "Inflow / outflow analysis",
    ],
    img: "/assets/img/station-interior.png",
  },
  {
    id: "scheduling",
    icon: CalendarClock,
    title: "Scheduling Management",
    points: [
      "Train schedule management by line & slot",
      "Peak-hour frequency optimization",
      "Prescriptive headway recommendations + score",
      "Delay tracking and handling",
    ],
    img: "/assets/img/illustration-flow.png",
  },
  {
    id: "prediction",
    icon: BrainCircuit,
    title: "AI Prediction",
    points: [
      "Crowd density prediction (4-class)",
      "Passenger demand forecasting",
      "Congestion probability scoring",
      "Explainable recommendations",
    ],
    img: "/assets/img/ai-viz.png",
  },
  {
    id: "alerts",
    icon: AlertTriangle,
    title: "Alerts & Notifications",
    points: [
      "Overcrowding alerts",
      "Delay notifications",
      "Emergency announcements",
      "Real-time updates to operators",
    ],
    img: "/assets/img/station-platform.png",
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Analytics Dashboard",
    points: [
      "Passenger traffic analytics",
      "Station performance reports",
      "Operational monitoring",
      "AI prediction insights",
    ],
    img: "/assets/img/dashboard-ref.png",
  },
  {
    id: "network",
    icon: Map,
    title: "Network View",
    points: [
      "Live network-state map",
      "Line & station load, color-coded",
      "Interchange congestion ranking",
      "Multi-network, multi-city",
    ],
    img: "/assets/img/network-map.png",
  },
];

export default function FeaturesPage() {
  return (
    <>
      <section className="bg-[color:var(--color-brand)] pt-28 pb-16 text-white">
        <div className="container-mf">
          <h1 className="font-display text-4xl font-bold sm:text-5xl">
            Everything an operator needs
          </h1>
          <p className="mt-4 max-w-2xl text-white/85">
            Six modules covering monitoring, scheduling, AI prediction, alerts
            and analytics — one privacy-preserving command center.
          </p>
        </div>
      </section>

      <div className="container-mf space-y-24 py-24">
        {MODULES.map((m, i) => (
          <Reveal key={m.id}>
            <section
              id={m.id}
              className={`grid items-center gap-12 lg:grid-cols-2 ${
                i % 2 ? "lg:[&>div:first-child]:order-2" : ""
              }`}
            >
              <div>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-card)] bg-[color:var(--color-brand-100)] text-[color:var(--color-brand)]">
                  <m.icon size={22} />
                </span>
                <h2 className="mt-4 font-display text-3xl font-bold">
                  {m.title}
                </h2>
                <ul className="mt-6 space-y-3">
                  {m.points.map((p) => (
                    <li
                      key={p}
                      className="flex items-start gap-3 text-[color:var(--color-ink-2)]"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-accent)]" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card overflow-hidden">
                <div className="relative h-72">
                  <Image src={m.img} alt={m.title} fill className="object-cover" />
                </div>
              </div>
            </section>
          </Reveal>
        ))}
      </div>
    </>
  );
}
