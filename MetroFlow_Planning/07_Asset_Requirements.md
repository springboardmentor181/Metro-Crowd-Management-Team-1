# MetroFlow — Required Image & Video Asset Requirements

**Document 7 of 7**
**Status:** Draft for approval — **this is the asset brief the user fulfills before development starts** (per PRD Asset Workflow).

**Global style guide for all assets:** futuristic yet government-enterprise-grade; deep **petrol/teal + signal-orange** palette (Doc 4); Indian metro context (modern driverless-style trains, clean stations); **no CCTV/surveillance imagery** (privacy stance); data/analytics overlays welcome; consistent lighting, no clashing stock look. Deliver web-optimized (WebP/AVIF + PNG/JPG fallback) and, for line-art, **SVG**.

Naming convention: `metroflow_<area>_<name>_<variant>.<ext>` (e.g. `metroflow_web_hero_01.webp`). Place under `/public/assets/…` at build time.

---

## A. Brand & Identity Assets

| # | Asset | Purpose | Style | Format / Size | Qty |
|---|---|---|---|---|---|
| A1 | **Primary logo** | Navbar, dashboard sidebar | Wordmark + metro-node/flow mark, optional hexagon | SVG + PNG @1x/2x | 1 set |
| A2 | Logo variants | Dark bg, mono, favicon, app icon | Reversed white, single-color, 512² icon, 32² favicon | SVG/PNG/ICO | 1 set |
| A3 | Brand pattern/texture | Section backgrounds, hero motif | Subtle line/hex network pattern, low-contrast | SVG (tileable) | 2 |

---

## B. Website Assets (Part 1)

| # | Asset | Purpose | Required style | Resolution | Qty |
|---|---|---|---|---|---|
| B1 | **Hero background image** | W1 hero | Futuristic smart-metro station / modern train, AI-analytics screen accents, petrol tone, cinematic | 1920×1080 (also 2560×1440) | **3 options** |
| B2 | Metro infrastructure images | Feature/how-it-works bands | Modern platforms, trains arriving, interchange hubs, clean & bright | 1600×1000 | 4–6 |
| B3 | AI/data-visualization images | AI band, Technology page | Abstract data/analytics dashboards, prediction charts, network graphs | 1600×1000 | 3 |
| B4 | Smart-city imagery | Impact/urban-mobility band | Aerial city + transit lines, dusk, connected-city feel | 1920×1080 | 2 |
| B5 | Transportation illustrations | Feature cards, empty content | Flat/isometric metro, crowd-flow, scheduling motifs (on-brand) | SVG / 1200×900 | 5–6 |
| B6 | Feature-section graphics | 3-card band + module hex-nav | One icon-illustration per module (Crowd, Scheduling, Prediction, Alerts, Analytics) | SVG | 5 |
| B7 | Iconography set | Nav, features, footer | Thin-line (lucide-style), 1.5px stroke, consistent | SVG sprite | 1 set (~40) |
| B8 | Hexagon module tiles | Website hex-nav (ref motif) | Hexagon frames w/ module glyphs, petrol/orange | SVG | 5 |
| B9 | Update/news thumbnails | Updates timeline | Small on-brand thumbnails / hex date badges | 400×300 / SVG | 3–5 |
| B10 | OG / social share image | Link previews, SEO | Branded 1200×630 with logo + tagline | PNG/JPG 1200×630 | 1 |

---

## C. Dashboard Assets (Part 2)

| # | Asset | Purpose | Required style | Format | Qty |
|---|---|---|---|---|---|
| C1 | **Station / network map graphic** | Overview & Crowd map | Stylized metro line-schematic (Indian networks), node markers colored by crowd status; or geo basemap tiles | SVG (schematic) + map tiles | 1–2 |
| C2 | Metro route-map illustrations | Scheduling / line views | Per-major-network line diagrams (Delhi, Mumbai, Bengaluru…) | SVG | 3–5 |
| C3 | Analytics illustrations | Analytics empty/hero blocks | On-brand chart/insight illustrations | SVG | 3 |
| C4 | User avatars (placeholder set) | Profiles, user table, topbar | Neutral, diverse, on-brand default avatars | PNG/SVG 256² | 6–8 |
| C5 | **Empty-state illustrations** | No-data / no-alerts / no-results | Friendly on-brand line illustrations (e.g. "all clear", "no alerts", "no data yet") | SVG | 5–6 |
| C6 | **Alert / status illustrations** | Alert panels, emergency modal | Overcrowding, delay, emergency, all-clear iconographic art | SVG | 4 |
| C7 | AI-model visualization graphics | AI Prediction page | Model/pipeline diagram, feature-importance motif, confidence gauge art | SVG | 2–3 |
| C8 | Dashboard icon set | Sidebar, KPI cards, actions | Thin-line, matches B7 (crowd, train, schedule, alert, analytics, users…) | SVG sprite | 1 set (~50) |
| C9 | Loading skeleton/spinner | Loading states | Simple branded shimmer/spinner | SVG/Lottie | 1 |

---

## D. Video Assets (optional — specify if used)

| # | Asset | Purpose | Required style | Spec | Qty |
|---|---|---|---|---|---|
| V1 | **Hero background video** | W1 hero (muted loop) | Slow metro arriving / platform flow / abstract data motion, petrol grade, seamless loop | 1920×1080, ≤10s loop, MP4+WebM, <5MB | 1 (+1 alt) |
| V2 | Metro-movement clip | How-it-works / features | Train in motion, time-lapse platform crowd flow (no faces/CCTV) | 1920×1080, 8–15s | 1 |
| V3 | Smart-city animation | Impact band | Animated connected-city / network-lines motion graphic | 1920×1080 or Lottie | 1 |
| V4 | AI data-viz animation | AI/Technology section | Animated charts/prediction/heatmap forming | Lottie/MP4 | 1 |

> If video is not provided, B1/B4 static hero + CSS/Framer ambient motion is an acceptable fallback (noted so development is not blocked).

---

## E. Asset Sourcing Options (for the user)
1. **AI-generated** (recommended for hero/illustrations) — from the style prompts above; fastest, fully on-brand, license-clean.
2. **Licensed stock** (Unsplash/Pexels free, or paid) for photographic metro/city imagery — must be color-graded to the palette.
3. **Custom illustration/icon set** (Figma / icon libraries) for SVGs — best consistency.

---

## F. Priority for First Development Pass
**P0 (blockers):** A1/A2 logo set, B1 hero (1 option), B7/C8 icon sets, C1 map/schematic, C4 avatars, C5 empty states.
**P1:** B2/B3/B5/B6 feature imagery, C6 alert art, B10 OG image.
**P2:** Videos (V1–V4), B4 smart-city, C2 route maps, C7 AI graphics.

---

## G. Asset Workflow (per PRD) — confirmed decision
> **Confirmed 2026-07-31:** the **user will provide** the assets (Option E2, not AI-generation).

1. ✅ This asset brief generated.
2. ⏳ **User provides** required images/videos/assets — start with **P0** in §F. Drop files under `/assets/` (or share) using the naming convention in this doc.
3. ⏳ We analyze provided assets (fit, resolution, licensing, color-grade to palette).
4. ⏳ User approves final design + assets.
5. ⏳ **Development begins.**

> Development does not start until steps 2–4 complete and the approval checkpoint is signed off.
