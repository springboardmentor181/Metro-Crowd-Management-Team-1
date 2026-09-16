# MetroFlow — UI Screen Specifications

**Document 6 of 7**
**Status:** Draft for approval
**References:** `website design.png` (layout DNA for public site), `dashboard design.png` (pixel-level anatomy for console). Design tokens/components from Doc 4.

Notation: `[ ]` = component (Doc 4 §5–6). Layouts are desktop-first (≥1280px) with responsive notes.

---

## PART 1 — PUBLIC WEBSITE

### W0. Global chrome
- `[Navbar]` sticky, transparent-over-hero → solid petrol on scroll. Logo · nav (Platform · Features · AI · Impact · Contact) · **[Enter Dashboard]** accent-orange → `/login`.
- `[Footer]` multi-column (Platform / Company / Resources / Contact) on light plane + deep-petrol copyright bar. *(Structure = website ref footer.)*
- Max content width 1200px; section vertical rhythm 96px desktop / 56px mobile.

### W1. Landing / Home
| Region | Spec |
|---|---|
| Hero | Full-bleed petrol gradient + metro-train image (right/bleed). Display H1 *"Move the city. Predict the crowd."* + subcopy + `[Button primary]` "Enter Dashboard" + ghost "See how it works". Hex badge accent (ref motif). Optional ambient bg video. |
| Module hex-nav | Row of hexagon tiles (ref's product selector) → Crowd · Scheduling · Prediction · Alerts · Analytics; hover lifts, click scrolls to section. |
| Feature cards (3-col) | Image/illustration-topped cards: "Data-only crowd monitoring", "AI demand forecasting", "Smart scheduling". Each: title + 2-line copy + "Learn more →". *(= ref 3-card band.)* |
| How-it-works (AI band) | Alternating image/text rows: (1) ticketing/sensor data in → (2) AI predicts density & demand → (3) prescriptive schedule out. Emphasize **no cameras**. |
| Impact stats band | Petrol band, tabular count-up: **725** stations · **17** networks · **571K** records · **4-class** crowd AI. |
| Updates timeline | Hexagon-date news row (ref) → milestones / product updates. |
| CTA band | Accent band "Enter the command center" → `/login`. |
| Footer | W0. |
- Responsive: hero stacks; hex-nav wraps to 2 rows; 3-col → 1-col.

### W2. Features / Platform (detail page)
Per-module deep sections (Crowd, Scheduling, Prediction, Alerts, Analytics), each: heading, screenshot/illustration, bullet capabilities, mini KPI. Reuses feature-card + AI-band components.

### W3. AI / Technology page
Explains models (XGBoost/RF, optional LSTM), data-only approach, privacy stance, accuracy framing. Diagram of the AI pipeline (Doc 5 §4).

### W4. Contact / Request-access
Simple form (name, org, role, message) → Supabase Storage/table; success + toast. (Marketing lead capture.)

---

## PART 2 — AUTHENTICATION

### A1. Login
Split layout: left petrol panel with brand + tagline + subtle metro/line motif; right white card `[Input]` email, password, `[Button primary]` Sign in, "Forgot password", link to Sign up. Supabase Auth. Error inline. Redirects role-aware to dashboard.

### A2. Signup
Same shell; fields name, email, password, role request (defaults Operator; Admin by invite/approval). Email verification via Supabase.

### A3. Forgot / Reset password
Supabase recovery flow; minimal centered card.

*(Auth pages echo the reference template's auth section; branded to MetroFlow.)*

---

## PART 3 — AI OPERATIONS DASHBOARD

### D0. Dashboard shell (every screen) — **pixel-match to dashboard ref**
```
┌─────────────┬───────────────────────────────────────────────────────────┐
│ [Sidebar]   │ [Topbar]  search · [Network/Line selector] · fullscreen ·  │
│  logo       │           alerts🔔(n) · msgs · theme · [avatar▾]           │
│  ─────────  ├───────────────────────────────────────────────────────────┤
│ MAIN        │  Breadcrumb · Page title · page actions                    │
│  Overview   │                                                            │
│ MONITORING  │  ┌── page content grid (12-col, 24px gutter) ──────────┐   │
│  Crowd      │  │                                                      │   │
│  Stations   │  │                                                      │   │
│  Scheduling │  │                                                      │   │
│ AI          │  │                                                      │   │
│  Prediction │  │                                                      │   │
│  Analytics  │  │                                                      │   │
│ SYSTEM      │  │                                                      │   │
│  Alerts     │  └──────────────────────────────────────────────────────┘  │
│  Users(adm) │                                                            │
│  Settings   │                                                            │
└─────────────┴───────────────────────────────────────────────────────────┘
```
Sidebar sectioned + collapsible; active item = accent left-bar + petrol tint. Topbar right cluster per ref. Content = card grid.

### D1. Overview (command center) — the flagship screen
| Row | Content (component ← ref widget) |
|---|---|
| KPI strip (4× `[KPI card]`) | **Network Load %** (sparkline) · **Active Alerts** (count, severity color) · **On-time %** (delay-derived) · **Footfall Today** (trend Δ). ← ref top card row. |
| Row 2 | Left (8-col): `[Area chart + crosshair]` passengers over time (today vs typical). Right (4-col): `[Donut/dot]` network occupancy + `[Quick actions]` (broadcast alert, adjust frequency, export). |
| Row 3 | `[Peak-hours progress grid]` — hour-by-hour crowd load, color-coded Low/Med/High/Critical. ← ref "Peak Hours" grid (flagship reuse). |
| Row 4 | Left: `[Heatmap]` congestion hour × line (sequential blue). Right: `[Alert rail]` top open alerts. ← ref heatmap + list. |
| Row 5 | `[Horizontal bars]` crowd-level distribution · `[Bar chart]` top footfall stations. |

### D2. Crowd Monitoring
- Filters row: network · line · station · date/time · `[1H/1D/1W/1M]`.
- `[KPI cards]`: current density, stations Critical now, avg occupancy, inflow vs outflow.
- `[Area/line]` inflow vs outflow over time (two series, categorical slots 1&2, legend + direct labels).
- `[Heatmap]` station × hour congestion (flagship).
- `[Data table]` stations with live crowd status chip, occupancy %, entry/exit, trend; row → station drill-in.
- Station drill-in (D2a): single-station detail — occupancy gauge, hourly profile, nearby context (`external_factors`), recent alerts.

### D3. Scheduling Management
- `[Data table]` schedules by line × time-slot: current freq, **recommended freq**, passenger demand, delay probability, `optimization_score` as a confidence meter.
- `[AI recommendation card]` list: "↑ Blue Line 07–10h: 4→3 min (score 89)" with Apply/Dismiss (writes `schedule_recommendations`, audited).
- `[Bar/line]` delay by line/hour; service-status distribution (`Running/Delayed/Cancelled`).
- Delay management panel: `train_operations` filtered to Delayed, avg delay, worst corridors.

### D4. AI Prediction
- Predict panel: choose station + horizon → `[AI recommendation card]` shows predicted **crowd level** (status chip), **demand count**, **congestion probability**, **confidence**; labeled *AI · estimated · model vX*.
- `[Line]` forecast vs actual (actual solid, forecast dashed, confidence band).
- `[Bar]` feature-importance (from RF/XGBoost) — "what drives this prediction" (trust/explainability).
- Traffic pattern analysis: O-D highlights, most congested lines (precomputed), seasonal/festival impact.

### D5. Alerts & Notifications
- `[Alert rail]`/table severity-ranked: type icon + severity chip + station/line + message + time + `[ack]`.
- Filters: type (overcrowding/delay/emergency), severity, status (open/ack/resolved), network.
- Emergency broadcast composer (Admin): message + target stations/lines → push (Realtime) + external channels stub (email/SMS/PA per PRD external integrations).
- Realtime: new alerts animate in (respecting reduced-motion).

### D6. Analytics Dashboard
- Report tiles: top/bottom footfall stations, city avg daily flow, stations by metro/category/state, ticket-type & payment-method distribution, revenue (avg fare × volume), congestion by line.
- `[Bar]`/`[Horizontal bars]`/`[Donut]` per above; `[Heatmap]` demand by city × day-type.
- Date-range control; **Export** (CSV/PDF → Supabase Storage).
- Performance-metrics section: model accuracy, API latency, delay-reduction (ties to PRD metrics).

### D7. User Management (Admin only)
- `[Data table]` users: name, email, role chip, assigned network, status, last active; invite, edit role, deactivate.
- Role guard: Operators cannot reach D7 (RLS + route guard).

### D8. Profile & Settings
- Profile: avatar (Supabase Storage), name, role, assigned network.
- Settings: theme (light/dark), notification prefs, realtime replay speed (admin), density toggle.

---

## 4. Responsive & States (all dashboard screens)
- ≥1280 full grid; 768–1279 sidebar collapses to icons, cards 2-col; <768 sidebar → drawer, cards 1-col, tables → horizontal scroll within `overflow-x` container.
- Every data widget ships **loading (skeleton)**, **empty (illustration)**, **error (inline + retry)** states (assets in Doc 7).
- Charts: crosshair/tooltip on line/area, per-cell hover on heatmap, per-mark hover on bars; legend for ≥2 series; table-view fallback for heatmap (accessibility).

---

## 5. Screen Inventory (for build tracking — post-approval)
Website: W1 Home, W2 Features, W3 AI, W4 Contact. Auth: A1 Login, A2 Signup, A3 Reset.
Dashboard: D1 Overview, D2 Crowd (+D2a drill-in), D3 Scheduling, D4 AI Prediction, D5 Alerts, D6 Analytics, D7 Users, D8 Profile/Settings.
**Total: 4 + 3 + 9 = 16 primary screens.**

## 6. Open UI Decisions (approval)
1. Map on Overview/Crowd: interactive geo map (react-leaflet/maplibre) vs stylized line-schematic. *(Recommend schematic + optional geo toggle.)*
2. Heatmap library: Recharts custom cells vs D3 layer. *(Recommend Recharts custom cells first.)*
3. Default landing after login: Overview (recommended) vs role-specific (Operator→Crowd).
