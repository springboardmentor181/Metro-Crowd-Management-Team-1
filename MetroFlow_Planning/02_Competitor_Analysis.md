# MetroFlow — Competitor & Reference System Analysis

**Document 2 of 7**
**Status:** Draft for approval

This document benchmarks MetroFlow against the operational and analytics practice of six leading transit systems and the smart-city platform category, then distills the patterns MetroFlow will adopt or deliberately avoid.

> Scope note: MetroFlow is a **data-only** platform (no CCTV/computer vision). Where competitors rely on CV crowd counting, we note the equivalent AFC/telemetry-based approach MetroFlow uses instead.

---

## 1. Benchmarked Systems

### 1.1 Delhi Metro (DMRC) — India
- **Scale/relevance:** Closest peer to our dataset (Delhi is the largest network in the data — 222 stations, ~1.7M avg daily flow). AFC gate data, smart-card (metro card) + QR + NCMC, and OCC (Operations Control Centre) telemetry.
- **Operator practice:** Centralized OCC with line-wise train tracking, headway control, and passenger information displays. Crowd management is largely manual/staff-driven at stations.
- **Strengths:** Massive real AFC dataset; strong scheduling discipline; NCMC/one-nation-one-card adoption.
- **Gaps MetroFlow targets:** Limited *predictive* crowd analytics surfaced to operators; congestion response is reactive.
- **Adopt:** Indian ticketing model (Smart Card / Token / QR / Monthly Pass; UPI/NCMC/Cash/App) — mirrored exactly in our `ticket_transactions` data, so MetroFlow speaks the local domain natively.

### 1.2 London Underground — Transport for London (TfL)
- **Relevance:** Gold standard for **open transit data** and O-D analytics from Oyster/contactless taps.
- **Operator practice:** RODS/NUMBAT demand studies, load-weighting of journeys, "busy times" guidance to passengers, and a mature open-data ecosystem (Unified API).
- **Strengths:** O-D matrices and load modeling from tap data (no cameras needed) — the exact methodology MetroFlow uses; excellent public data storytelling.
- **Adopt:** Tap-in/tap-out O-D analytics; publishing "quieter travel times"; clean data-viz for public consumption (informs our public website, Doc 6).

### 1.3 Singapore — LTA / SMRT / SimplyGo
- **Relevance:** Benchmark for **AI-driven, sensor-fused operations** and a genuine command-center aesthetic.
- **Operator practice:** Fusion Analytics for Public Transport (FASP), predictive maintenance, real-time crowdedness in the mobile app ("MyTransport"), and dynamic capacity management.
- **Strengths:** Real-time train crowdedness indicators to passengers; predictive operations; polished command dashboards.
- **Adopt:** Passenger-facing crowdedness levels driven by occupancy data (we have `train_occupancy` + `crowd_level`); the "command center" visual tone as our dashboard's north star.

### 1.4 Tokyo — Tokyo Metro / JR East
- **Relevance:** Extreme-density operations; precision scheduling; congestion-rate publishing.
- **Operator practice:** Publishes **car-by-car congestion rates (%)**, promotes off-peak travel, runs tight, high-frequency headways with legendary punctuality.
- **Strengths:** Congestion-rate as a first-class public metric; peak-spreading demand management.
- **Adopt:** Occupancy-percentage as a headline metric (our `occupancy_percentage`, 0–150 range); peak-spreading recommendations in scheduling.

### 1.5 New York — MTA
- **Relevance:** Benchmark for **open performance dashboards** and public accountability reporting.
- **Operator practice:** Public MTA performance metrics dashboard (on-time performance, wait assessment, ridership recovery), open data on ridership.
- **Strengths:** Transparent KPI reporting; strong "metrics dashboard" pattern for management/regulators.
- **Adopt:** The public/management KPI-reporting pattern → informs MetroFlow's Analytics module and the public website's "impact stats" section.

### 1.6 Smart-City Mobility Platforms (category)
- **Examples of pattern:** Integrated urban mobility command centers (ITMS/ITS control rooms), traffic-plus-transit fusion, GIS-based network state walls.
- **Strengths:** Map-centric network state; multi-source fusion; incident/alert workflows; role-based operator consoles.
- **Adopt:** Map/schematic-first network state; severity-ranked alert rail; role-based access (Admin vs Operator).

---

## 2. Capability Comparison Matrix

Legend: ● full · ◐ partial · ○ none/manual · ★ MetroFlow target

| Capability | Delhi (DMRC) | London (TfL) | Singapore | Tokyo | NY (MTA) | **MetroFlow (planned)** |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| AFC / ticketing analytics | ● | ● | ● | ● | ● | ★ ● |
| Live network-state map | ● | ● | ● | ● | ◐ | ★ ● |
| Crowd density estimation (data-only) | ◐ | ● | ● | ● | ◐ | ★ ● |
| Passenger-facing crowdedness | ○ | ◐ | ● | ● | ◐ | ★ ◐ (est.) |
| Short-horizon demand forecast | ◐ | ● | ● | ● | ◐ | ★ ● |
| Predictive congestion risk | ○ | ◐ | ● | ◐ | ○ | ★ ● |
| Prescriptive schedule/headway rec. | ◐ | ◐ | ● | ● | ○ | ★ ● |
| Delay prediction | ◐ | ◐ | ● | ● | ◐ | ★ ● |
| Severity-ranked alerting | ● | ● | ● | ● | ● | ★ ● |
| Public performance/KPI reporting | ◐ | ● | ● | ◐ | ● | ★ ● |
| Congestion heatmaps (time × space) | ○ | ◐ | ● | ◐ | ○ | ★ ● |
| **No-CCTV / privacy-preserving** | ◐ | ● | ◐ | ◐ | ◐ | ★ ● (by design) |

**Reading of the matrix:** the leaders (Singapore, Tokyo) win on predictive + prescriptive operations and command-center UX. MetroFlow's realistic ambition is to deliver that *class* of experience on a **data-only, privacy-preserving** basis, tuned to the **Indian metro domain** our dataset represents — a combination none of the individual references fully offer to third-party operators as a product.

---

## 3. Recommended Feature Set for MetroFlow (synthesized)

**Must-have (graded milestones / core product):**
- Live network-state view (map + line/station load), color-coded Low→Critical.
- KPI command strip (network load, active alerts, on-time %, footfall today).
- Crowd density + station congestion monitoring (data-derived).
- Congestion heatmap (hour × station/line).
- Short-horizon demand forecast + peak-hour view.
- Predictive congestion probability per station-hour.
- Prescriptive frequency recommendation with optimization score.
- Delay tracking + delay prediction.
- Severity-ranked alert rail (overcrowding / delay / emergency) + acknowledge.
- Analytics & reports (top/bottom footfall, city/line breakdowns, ridership, revenue).
- Role-based access (Admin / Operator).

**Differentiators (adopt to exceed "student dashboard" bar):**
- Prescriptive (not just descriptive) scheduling.
- Honest "estimated density + confidence" framing (no false precision).
- Public explainer website → command-center funnel (few student projects have both halves polished).
- Indian-domain fidelity (real networks, lines, ticket types, festivals).

**Deliberately excluded:**
- Any CCTV / computer-vision / facial-recognition crowd counting (PRD constraint + privacy).
- Black-box RL scheduler (unauditable for a government-grade tool).

---

## 4. UX Lessons Applied

| Source | Lesson | MetroFlow application |
|--------|--------|----------------------|
| Singapore/Tokyo | Command-center tone, real-time crowdedness | Dashboard visual north star; occupancy as headline KPI |
| TfL | O-D analytics + clear public data-viz | Analytics module + public website stats |
| Tokyo | Congestion % as first-class metric | `occupancy_percentage` front-and-center |
| MTA | Transparent KPI reporting | Analytics/reporting + public "impact" section |
| Smart-city ITMS | Map-first, alert-ranked, role-scoped | Dashboard anatomy (Doc 6) |
| DMRC | Indian ticketing & network reality | Native domain modeling from our dataset |

---

## 5. Positioning Statement

> **MetroFlow is a privacy-preserving AI command center for metro operators** that delivers the predictive and prescriptive operations experience of the world's most advanced transit systems — crowd forecasting, congestion heatmaps, and schedule optimization — **using only the ticketing and operational data authorities already collect, with no cameras.** Built for the Indian metro context, it scales from a single line to a 700-station multi-network view.
