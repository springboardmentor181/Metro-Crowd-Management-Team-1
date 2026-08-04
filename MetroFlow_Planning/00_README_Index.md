# MetroFlow — Research & Planning Package

**AI-Powered Metro Crowd Management & Smart Scheduling Platform**
**Phase:** Research → Analysis → Design → Asset Planning → **⏸ AWAITING APPROVAL** → Development
**Status:** No code, no components, no database tables, no models trained. Planning only.

This folder contains the seven deliverables required before development begins.

## Documents
| # | Document | File | Covers |
|---|----------|------|--------|
| 1 | Research Report | [01_Research_Report.md](01_Research_Report.md) | Smart-transportation & AI research, model landscape, conclusions |
| 2 | Competitor Analysis | [02_Competitor_Analysis.md](02_Competitor_Analysis.md) | Delhi/London/Singapore/Tokyo/NY + smart-city, capability matrix, positioning |
| 3 | Dataset Analysis | [03_Dataset_Analysis.md](03_Dataset_Analysis.md) | 8-file schema, data dictionary, quality, AI feasibility, preprocessing |
| 4 | Design System | [04_Design_System.md](04_Design_System.md) | Brand, **validated** color/status palettes, type, components |
| 5 | Application Architecture | [05_Application_Architecture.md](05_Application_Architecture.md) | System diagram, modules, logical data model, AI pipeline, stack, APIs |
| 6 | UI Screen Specifications | [06_UI_Screen_Specifications.md](06_UI_Screen_Specifications.md) | 16 screens (website + auth + dashboard), pixel-match to refs |
| 7 | Asset Requirements | [07_Asset_Requirements.md](07_Asset_Requirements.md) | Every image/video asset, specs, priority, workflow |

## Phase 1 — Architecture Documents (added after approval)
| # | Document | File | Covers |
|---|----------|------|--------|
| 08 | Database Schema & ER Diagram | [08_Database_Schema.md](08_Database_Schema.md) | **Canonical** tables/columns, ER diagram, indexes, DDL reference, RLS summary |
| 09 | FastAPI Backend Architecture | [09_Backend_Architecture.md](09_Backend_Architecture.md) | Layering, services/repos, auth flow, realtime, replay engine, jobs |
| 10 | AI/ML Architecture | [10_AI_ML_Architecture.md](10_AI_ML_Architecture.md) | Model portfolio, pipeline, training, eval, versioning, inference, scheduler |
| 11 | API Documentation | [11_API_Documentation.md](11_API_Documentation.md) | **Canonical** REST + WebSocket contract, schemas, error codes |
| 12 | Project Folder Structure | [12_Project_Folder_Structure.md](12_Project_Folder_Structure.md) | Monorepo: web / api / ai / infra / data |
| 13 | System Architecture Diagram | [13_System_Architecture_Diagram.md](13_System_Architecture_Diagram.md) | Component + data-flow + deployment diagrams |
| 14 | Sequence Diagrams | [14_Sequence_Diagrams.md](14_Sequence_Diagrams.md) | Login, prediction, alert, scheduling, replay |
| 15 | User Journey Maps | [15_User_Journey_Maps.md](15_User_Journey_Maps.md) | Visitor / Operator / Admin journeys |
| 16 | Docker & Deployment | [16_Docker_Deployment_Architecture.md](16_Docker_Deployment_Architecture.md) | Containers, compose, AWS/Azure, CI/CD |
| 17 | Environment Variables | [17_Environment_Variables.md](17_Environment_Variables.md) | All env vars per service, secret handling |
| 18 | Testing Strategy | [18_Testing_Strategy.md](18_Testing_Strategy.md) | Unit / integration / E2E / AI / RBAC matrix |
| 19 | Security & RLS Policy | [19_Security_and_RLS_Policy.md](19_Security_and_RLS_Policy.md) | Auth, RLS policies, roles, STRIDE |
| 20 | Performance Optimization | [20_Performance_Optimization_Plan.md](20_Performance_Optimization_Plan.md) | Targets, caching, DB, inference, realtime |
| 21 | Risk & Assumptions | [21_Risk_and_Assumptions.md](21_Risk_and_Assumptions.md) | Assumptions, risk register, dependencies |
| — | Image Generation Prompts | [07b_Image_Generation_Prompts.md](07b_Image_Generation_Prompts.md) | Ready-to-paste prompts per asset |
| — | Postman Collection | [MetroFlow.postman_collection.json](MetroFlow.postman_collection.json) | Importable API collection (v2.1) |

## Grounding facts (verified from the repo)
- **Dataset:** 571,540 records · 8 relational CSVs · 725 stations · 17 metros · 23 cities · 90 days (Oct–Dec 2024) · **15/15 quality checks pass** · ML targets pre-computed.
- **Design references identified:** `website design.png` = HAG (layout DNA) · `dashboard design.png` = SmartHR/Dreams (dashboard anatomy, teal+orange).
- **Palettes validated** against the dataviz method (categorical series ✅; crowd-density status ramp = ordered status, icon+label required).

## ✅ Approval Checkpoint — decisions (confirmed 2026-07-31)
1. **Palette reconciliation** (Doc 4): ✅ **Teal + orange** single identity across website + dashboard; website ref reused for layout structure only.
2. **Realtime** (Doc 5): ✅ **Replay engine** on a simulated, speed-adjustable clock.
3. **Backend split** (Doc 5): ✅ **Supabase + FastAPI hybrid** (Supabase = auth/DB/realtime/storage; FastAPI = AI/ML + heavy analytics + replay).
4. **AI scope for milestones** (Doc 1): ✅ default **XGBoost + Random Forest** primary, LSTM/Prophet optional (unless changed).
5. **Scheduler** (Doc 5): ✅ default interpretable **rules+regression** recommender (unless changed).
6. **Assets** (Doc 7): ✅ **User will provide assets.** Development waits on asset delivery per the PRD workflow.

## ⏸ Current gate before Development
Awaiting **user-provided assets** (see Doc 7 §F priorities). On delivery: analyze fit/resolution/licensing + color-grade → final design sign-off → begin development.

## Next steps after assets + final sign-off
Frontend dev → Supabase auth → database setup → dashboard → AI integration → Docker + cloud deploy (per PRD milestones).
