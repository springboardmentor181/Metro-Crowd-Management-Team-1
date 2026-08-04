# MetroFlow — Complete Design System

**Document 4 of 7**
**Status:** Draft for approval
**Derived from:** `website design.png` (HAG — structure/layout language), `dashboard design.png` (SmartHR/Dreams — dashboard anatomy & color story), and the dataviz color method (validated palette).

> ⚠️ **Key approval decision — palette reconciliation.** The two supplied references tell *different* color stories: the website reference is **bold red**; the dashboard reference is **teal + orange**. A product cannot ship two identities. **Recommendation:** adopt the dashboard reference's **deep teal (petrol) + signal orange** as the single MetroFlow identity across *both* halves, and reuse the website reference only for its **layout/structure language** (full-bleed hero, hexagon motif, 3-column feature cards, news timeline, multi-column footer). This unifies the funnel and matches the "command-center / government-enterprise" tone the PRD asks for. **Alternative** kept on the table: keep the website red as a marketing accent. → Confirm at the approval checkpoint.

---

## 1. Brand Identity

**Brand:** MetroFlow
**Tagline (working):** *Move the city. Predict the crowd.*
**Personality:** Intelligent · Reliable · Futuristic · Government-Enterprise-Grade · Data-Driven

**Design principles**
1. **Command-center calm** — dense information, zero visual noise; color earns its place.
2. **State is pre-attentive** — one Low→Critical color language, everywhere, always with an icon + label.
3. **Honest AI** — predictions are labeled *estimated* with confidence; no false precision.
4. **Structure from the website ref, polish from the dashboard ref** — same layout DNA across public site and console.
5. **Accessible by construction** — color is never the only signal; validated palettes; light + dark.

**Logo concept (brief for Doc 7):** a wordmark "MetroFlow" with a mark combining a **metro route node + flow arc** (a stylized interchange dot with a motion tail), optionally seated in the **hexagon** carried over from the website reference. Monochrome, teal, and reversed (white) variants required.

---

## 2. Color System

### 2.1 Brand chrome (UI, not chart series)
| Role | Token | Light | Dark | Usage |
|---|---|---|---|---|
| Primary / Petrol | `--brand-primary` | `#0E4B5A` | `#12303a` | Sidebar, nav, primary buttons, headers |
| Primary-strong | `--brand-primary-900` | `#0A3A46` | `#0A2028` | Active nav, deep surfaces |
| Primary-tint | `--brand-primary-100` | `#E3F0F2` | `#12303a` | Selected rows, badges, wash |
| Accent / Signal orange | `--brand-accent` | `#F26C2E` | `#e35f22` | Primary CTA, highlights, "recommended" |
| Accent-tint | `--brand-accent-100` | `#FDE7DA` | `#3a2318` | Accent wash, hover |
| AI / Electric blue | `--brand-ai` | `#2A78D6` | `#3987e5` | AI/prediction highlights, links |

> Petrol + orange are lifted directly from the dashboard reference; electric blue is the shared "data/AI" accent (also the dataviz sequential + categorical slot-1 hue, so charts and UI stay coherent).

### 2.2 Surfaces & ink (from dataviz chrome tokens)
| Role | Light | Dark |
|---|---|---|
| Page plane | `#F9F9F7` | `#0D0D0D` |
| Card / surface | `#FFFFFF` / `#FCFCFB` | `#1A1A19` |
| Primary ink | `#0B0B0B` | `#FFFFFF` |
| Secondary ink | `#52514E` | `#C3C2B7` |
| Muted (axis/labels) | `#898781` | `#898781` |
| Gridline (hairline) | `#E1E0D9` | `#2C2C2A` |
| Border ring | `rgba(11,11,11,0.10)` | `rgba(255,255,255,0.10)` |

Default dashboard theme = **light** (matches the SmartHR reference). Dark theme is a first-class, separately-stepped variant (not an auto-invert), toggled from the topbar.

### 2.3 Status colors — Crowd Density ramp (FIXED, never re-themed) ✅ validated
The single most important ramp. Maps the dataset's `crowd_density_level` / `crowd_level` to the dataviz status palette. **Always rendered with an icon + text label — never color alone** (this is the validated mitigation; the ramp intentionally reads as an ordered scale, not a categorical series).

| Crowd level (data) | Role | Hex | Icon | Meaning |
|---|---|---|---|---|
| **Low** | good | `#0CA30C` | ● check-circle | Comfortable |
| **Medium** | warning | `#FAB219` | ◐ dot | Filling up |
| **High** | serious | `#EC835A` | ▲ triangle | Crowded |
| **Critical** | critical | `#D03B3B` | ■ octagon | Overcrowded — act |
| **Emergency** (ops state) | reserved | `#8B1A1A` | ✖ siren | Incident / evacuation |

*Validator note:* checked as ordered status + WCAG text, not as a categorical set. On white cards, Medium & High sit below 3:1 contrast **by design** → the icon+label pairing is the required relief; never place these as bare color swatches.

### 2.4 Chart series palette — categorical (FIXED order, never cycled) ✅ validated (all checks pass)
For distinguishing metros, lines, ticket types, payment methods, etc. Assign in this order; a 9th category folds into "Other" or a facet.

| Slot | Hue | Light | Dark |
|---|---|---|---|
| 1 | blue | `#2A78D6` | `#3987E5` |
| 2 | orange | `#EB6834` | `#D95926` |
| 3 | aqua | `#1BAF7A` | `#199E70` |
| 4 | yellow | `#EDA100` | `#C98500` |
| 5 | magenta | `#E87BA4` | `#D55181` |
| 6 | green | `#008300` | `#008300` |
| 7 | violet | `#4A3AA7` | `#9085E9` |
| 8 | red | `#E34948` | `#E66767` |

**Scatter/choropleth/small-multiple caps:** only the **first 3 slots** clear the all-pairs floor — past three, facet or fold to "Other."

### 2.5 Sequential ramp — magnitude (heatmaps, congestion time×space) ✅
Single hue **blue**, light→dark (near-zero recedes to surface). Congestion heatmap (hour × station/line) uses this; a second simultaneous sequential context uses orange as its own one-hue ramp.

`#CDE2FB → #9EC5F4 → #6DA7EC → #3987E5 → #256ABF → #184F95 → #0D366B`

### 2.6 Diverging ramp — polarity (e.g. actual vs recommended headway, above/below normal demand)
**blue ↔ red**, neutral gray midpoint (`#F0EFEC` light / `#383835` dark). Equal steps per arm.

### 2.7 Color usage rules (non-negotiable)
- Crowd status color **always** with icon + label.
- Series color follows the **entity**, never its rank; a filter that drops a series never repaints survivors.
- **One y-axis per chart** — never dual-axis. Two scales → two charts or index to a common base.
- Status colors are reserved — never reused as "series 4."
- Text stays in ink tokens; the colored mark beside it carries identity.

---

## 3. Typography System

Per the dataviz method and government-grade legibility, MetroFlow uses a **UI sans** for the product surface and permits **one display face** for the marketing website hero only (echoing the website reference's strong display headline).

| Role | Font | Notes |
|---|---|---|
| **Product UI (dashboard, all data)** | `Inter`, fallback `system-ui, -apple-system, "Segoe UI", sans-serif` | The workhorse. |
| **Data / numeric** | Inter with `font-variant-numeric: tabular-nums` | KPIs, table columns, axis ticks — vertical alignment. |
| **Website display headline** | `Space Grotesk` (or `Sora`) — geometric, futuristic | Hero only; echoes the ref's bold header. Optional; falls back to Inter. |
| **Body (website)** | Inter | Consistency with product. |

**Type scale (rem, 1rem = 16px):**

| Token | Size / Line | Weight | Use |
|---|---|---|---|
| Display | 3.5 / 1.05 | 700 | Website hero |
| H1 | 2.25 / 1.15 | 700 | Page titles |
| H2 | 1.75 / 1.2 | 600 | Section headers |
| H3 | 1.375 / 1.3 | 600 | Card titles |
| Body-L | 1.125 / 1.6 | 400 | Lead paragraphs |
| Body | 1.0 / 1.6 | 400 | Default |
| Small | 0.875 / 1.5 | 400 | Secondary |
| Caption | 0.75 / 1.4 | 500 | Labels, axis, chips |
| KPI number | 2.0–2.75 | 700 | Stat tiles (tabular-nums) |

---

## 4. Spacing, Radius, Elevation, Motion

**Spacing scale (px):** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 (8px base grid). Dashboard gutter 24; card padding 20–24. *(Matches the airy card spacing of the dashboard reference.)*

**Radius:** `sm 6` · `md 10` (default card/button) · `lg 16` · `pill 999`. The dashboard reference uses soft ~10–12px card radii and pill toggles — adopt.

**Elevation (light):**
- `e0` flat — `border: 1px var(--border)`
- `e1` card — `0 1px 2px rgba(11,11,11,.06), 0 1px 3px rgba(11,11,11,.04)`
- `e2` raised/hover — `0 4px 12px rgba(11,11,11,.08)`
- `e3` popover/modal — `0 12px 32px rgba(11,11,11,.14)`

Shadows are soft and low — command-center software, not glossy consumer app.

**Motion (Framer Motion):** durations 120ms (micro) / 200ms (default) / 320ms (page); easing `cubic-bezier(.2,.7,.2,1)`. Website hero may use a slow ambient parallax; dashboard motion is **restrained** (data must not jitter). Respect `prefers-reduced-motion`.

**Iconography:** `lucide-react` (consistent 1.5px stroke, matches the reference's thin-line icons). Status icons are filled for maximum pre-attentive read.

---

## 5. Component Library — Website (Part 1)

Layout language carried from the website reference; recolored to MetroFlow petrol/orange.

| Component | Spec (from ref, recolored) |
|---|---|
| **Navbar** | Sticky, transparent-over-hero → solid petrol on scroll. Left logo, center nav (Platform · Features · AI · Impact · Contact), right **"Enter Dashboard"** accent-orange button (the auth funnel entry). |
| **Hero** | Full-bleed, angled/gradient petrol background with a **metro-train image** (ref uses a locomotive; we use a modern metro). Display headline + subcopy + primary CTA. Optional hexagon badge accent top-right (ref motif). Optional ambient background video. |
| **Vehicle/feature selector** | Ref's row of **hexagon tiles** → repurposed as "explore modules" hex-nav (Crowd · Scheduling · Prediction · Alerts · Analytics). |
| **Feature cards (3-col)** | Ref's 3 image-topped cards with pin markers → three feature cards (image/illustration + title + copy + "Learn more →"). |
| **AI / how-it-works section** | Alternating image/text bands explaining data-only crowd estimation, forecasting, scheduling. |
| **Impact statistics band** | Petrol band with 3–4 big numbers (725 stations · 17 networks · 571K records · 4-class crowd AI) — tabular-nums, count-up on scroll. |
| **News/updates timeline** | Ref's hexagon-date news row → product updates / milestones timeline. |
| **CTA band** | Full-width accent band: "Enter the command center" → auth. |
| **Footer** | Ref's multi-column footer on light plane + deep petrol copyright bar. Columns: Platform / Company / Resources / Contact + social. |

## 6. Component Library — Dashboard (Part 2)

Anatomy and every widget below is a **direct match to the dashboard reference**, recolored to MetroFlow tokens. Pixel-level fidelity is required (PRD).

| Component | Spec (from ref) |
|---|---|
| **Sidebar** | Fixed left, collapsible, sectioned (MAIN MENU / MONITORING / AI / SYSTEM). Logo top. Active item = accent left-bar + petrol tint (ref pattern). Nested items indented. Collapse toggle. |
| **Topbar** | Search (⌘/), environment/context toggle (ref's Production/Staging → **Network / Line selector**), right cluster: fullscreen, alerts bell w/ count, messages, theme toggle, user avatar. |
| **User profile menu** | Avatar → dropdown (profile, role badge Admin/Operator, settings, sign out). |
| **KPI card** | Title + icon top-right, big tabular number, sub-label, inline **sparkline** (ref's top row). Variant with mini bar-spark. Trend delta chip (↑/↓ + %). |
| **Bar chart card** | Grouped/rounded 4px data-ends, 2px surface gaps, 1H/1D/1W/1M toggle (ref "Storage Usage"). Used for footfall-by-station, revenue-by-type. |
| **Donut / dot-progress** | Ref's "MFA users" dot ring → capacity/occupancy gauges, ticket-type share. |
| **Quick actions grid** | Circular icon buttons (ref) → operator quick actions (broadcast alert, adjust frequency, export report). |
| **Peak-hours progress grid** | Ref's exact color-coded cards (Low/Med/High/Peak, % + progress bar). → **hour-by-hour crowd load per station** — a flagship reuse. |
| **Area chart w/ crosshair tooltip** | Ref's "Login Count" → passenger-count over time; crosshair + tooltip (dataviz interaction spec). |
| **Line/trend card** | Ref's "Usage Trend" → demand trend / forecast (actual solid, forecast dashed). |
| **Horizontal distribution bars** | Ref's "User Roles" → crowd-level distribution, stations-by-category. |
| **Heatmap (time × space)** | Ref's "Integration Errors" grid → **congestion heatmap** hour × station/line, sequential blue ramp, hover tooltip per cell. Flagship reuse. |
| **Alert panel / rail** | Severity-ranked list (icon + label + timestamp + station), acknowledge action; status-colored left border. |
| **AI recommendation card** | Distinct AI-blue accent; shows recommendation (e.g. "↑ frequency Blue Line 07–10h: 4→3 min"), confidence (`optimization_score`), "why" line, Apply/Dismiss. Labeled *AI · estimated*. |
| **Data table** | Sortable, sticky header, status chips, tabular-nums, row hover, pagination; density toggle. Station list, train ops, transactions. |
| **Map / network view** | Station markers colored by crowd status; line schematic; cluster at zoom-out. (Library decision in Doc 5.) |
| **Empty / loading / error states** | Skeletons for cards/tables; illustrated empty states (Doc 7); toast + inline error patterns. |

**Shared primitives:** Button (primary petrol / accent orange CTA / ghost / danger), Input, Select/Combobox, Toggle, Tabs, Badge/Chip (status + neutral), Tooltip, Modal, Drawer, Toast, Breadcrumb, Pagination, Avatar, Skeleton, Segmented time-toggle (1H/1D/1W/1M).

---

## 7. Accessibility & Theming Checklist
- WCAG AA text contrast on all ink; status meaning always icon + label.
- Validated palettes (this doc §2.3–2.6); heatmap has a table-view fallback.
- Keyboard-navigable nav, tables, modals; visible focus ring (2px accent).
- Light + dark both first-class; dark stepped from the same ramps, not auto-inverted.
- `prefers-reduced-motion` honored; charts render without animation when set.

---

## 8. Design Tokens (starter — for build, post-approval)
```css
:root{
  /* brand */
  --brand-primary:#0E4B5A; --brand-primary-900:#0A3A46; --brand-primary-100:#E3F0F2;
  --brand-accent:#F26C2E;  --brand-accent-100:#FDE7DA;  --brand-ai:#2A78D6;
  /* surfaces */
  --plane:#F9F9F7; --surface:#FFFFFF; --surface-2:#FCFCFB;
  --ink:#0B0B0B; --ink-2:#52514E; --muted:#898781;
  --grid:#E1E0D9; --border:rgba(11,11,11,.10);
  /* crowd status */
  --crowd-low:#0CA30C; --crowd-med:#FAB219; --crowd-high:#EC835A;
  --crowd-critical:#D03B3B; --crowd-emergency:#8B1A1A;
  /* radius / space */
  --r-sm:6px; --r-md:10px; --r-lg:16px;
  --s-1:4px; --s-2:8px; --s-3:12px; --s-4:16px; --s-5:24px; --s-6:32px;
}
```
> Tokens shown for approval; not yet wired into any code.
