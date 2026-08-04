"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, X, Sparkles } from "lucide-react";
import { STATIONS, STATION_COUNT_TOTAL, NETWORK_COUNT } from "@/lib/stations";
import { ALERTS, KPIS, PEAK_HOURS, TOP_FOOTFALL, CONGESTED_LINES } from "@/lib/mock-data";
import { compact } from "@/lib/utils";

type Msg = { role: "bot" | "user"; text: string };

const GREETING =
  "Hi, I'm MetroBot 👋 — your MetroFlow assistant. Ask me about crowd levels, busy stations, alerts, peak hours or scheduling.";

const SUGGESTIONS = [
  "Which stations are most crowded?",
  "How many active alerts?",
  "When are the peak hours?",
  "Busiest station today?",
  "What is MetroFlow?",
];

function answer(q: string): string {
  const s = q.toLowerCase();
  const open = ALERTS.filter((a) => a.status === "open");

  if (/what is metroflow|about metroflow|what.*platform/.test(s))
    return `MetroFlow is a privacy-preserving AI command center for metro operators. It monitors passenger flow, predicts crowd density and optimizes train scheduling — using only ticketing and operational data, no cameras. It currently covers ${STATION_COUNT_TOTAL} stations across ${NETWORK_COUNT} networks.`;

  if (/crowd|congest|busy|packed/.test(s) && !/station/.test(s)) {
    const crit = STATIONS.filter((x) => x.level === "Critical").slice(0, 3).map((x) => x.name);
    const line = CONGESTED_LINES[0];
    return `Right now ${crit.length ? crit.join(", ") : "no stations"} are at Critical crowding. The most congested corridor is the ${line.line} (${line.pct}% of station-hours High/Critical). I'd recommend adding train frequency there during peak.`;
  }

  if (/most crowded|which station|crowded station|high crowd/.test(s)) {
    const top = STATIONS.filter((x) => x.level === "Critical" || x.level === "High")
      .slice(0, 4)
      .map((x) => `${x.name} (${x.level}, ${x.occupancy}%)`);
    return `Most crowded stations: ${top.join("; ")}.`;
  }

  if (/alert|emergency|warning/.test(s))
    return `There are ${open.length} open alerts. Highest: ${open[0]?.station} — ${open[0]?.message}. Open the Alerts page to acknowledge them.`;

  if (/peak|rush|busy hour|when.*busy/.test(s)) {
    const criticalHours = PEAK_HOURS.filter((p) => p.level === "Critical").map((p) => p.hour);
    return `Peak crowding hits around ${criticalHours.join(" and ")}. Network-wide the morning peak is ~09:00 and the evening peak ~19:00. Deploy extra trains ~30 min before each.`;
  }

  if (/busiest|top station|footfall|highest/.test(s)) {
    const t = TOP_FOOTFALL[0];
    return `Busiest station by 90-day footfall is ${t.station} (${t.metro}) with ${compact(t.footfall)} passengers.`;
  }

  if (/how many station|number of station|station count/.test(s))
    return `MetroFlow tracks ${STATION_COUNT_TOTAL} stations across ${NETWORK_COUNT} metro networks. ${STATIONS.length} are actively monitored on your dashboard.`;

  if (/schedule|frequency|headway|train/.test(s))
    return `The Scheduling module recommends headway changes with an optimization score. For example, Blue Line 07:00–10:00 is recommended to go 4→3 min (score 89). Apply it from the Scheduling page.`;

  if (/on.?time|delay|punctual/.test(s))
    return `On-time performance is ${KPIS.onTime}%. Average delay across the network is about 4.3 minutes; most delays cluster on interchange-heavy corridors.`;

  if (/network load|occupancy|load/.test(s))
    return `Current network load is ${KPIS.networkLoad}% with ${compact(KPIS.footfallToday)} passengers today.`;

  if (/help|what can you|hello|hi\b|hey/.test(s))
    return "I can help with: crowd levels, busiest stations, open alerts, peak hours, on-time performance, and scheduling recommendations. Try one of the suggestions below.";

  return "I can answer questions about crowd levels, stations, alerts, peak hours, scheduling and network performance. Try one of the suggested questions below.";
}

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "bot", text: GREETING }]);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  function send(text: string) {
    const q = text.trim();
    if (!q) return;
    setMsgs((m) => [...m, { role: "user", text: q }, { role: "bot", text: answer(q) }]);
    setInput("");
  }

  return (
    <>
      {/* launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open MetroBot assistant"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[var(--shadow-e3)] transition-transform hover:scale-105"
        style={{ background: "linear-gradient(135deg,var(--color-brand),var(--color-ai))" }}
      >
        {open ? <X size={22} /> : <Bot size={24} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-40 flex h-[30rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] shadow-[var(--shadow-e3)]">
          <div
            className="flex items-center gap-2 px-4 py-3 text-white"
            style={{ background: "linear-gradient(135deg,var(--color-brand),var(--color-ai))" }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <Bot size={18} />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold">MetroBot</div>
              <div className="text-[11px] text-white/80">AI assistant · online</div>
            </div>
            <Sparkles size={15} className="ml-auto text-white/80" />
          </div>

          <div ref={bodyRef} className="flex-1 space-y-3 overflow-y-auto bg-[color:var(--color-surface-2)] p-3">
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-sm bg-[color:var(--color-brand)] px-3 py-2 text-xs text-white"
                      : "max-w-[85%] rounded-2xl rounded-bl-sm border border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] px-3 py-2 text-xs text-[color:var(--color-ink)]"
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}
            {msgs.length <= 1 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    onClick={() => send(sug)}
                    className="rounded-full border border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] px-2.5 py-1 text-[11px] text-[color:var(--color-ink-2)] hover:border-[color:var(--color-brand)] hover:text-[color:var(--color-brand)]"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-[color:var(--color-hairline)] p-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask MetroBot…"
              className="flex-1 rounded-full border border-[color:var(--color-hairline)] bg-[color:var(--color-surface-2)] px-3 py-2 text-xs outline-none focus:border-[color:var(--color-brand)]"
            />
            <button
              type="submit"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--color-brand)] text-white hover:bg-[color:var(--color-brand-900)]"
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
