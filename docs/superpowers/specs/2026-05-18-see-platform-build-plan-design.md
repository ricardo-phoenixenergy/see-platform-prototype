# SEE Platform — Phased Build Plan Design

**Date:** 2026-05-18
**Status:** Approved — ready for implementation planning
**Next step:** Invoke `writing-plans` skill to produce the implementation plan

---

## Context

This document captures the agreed build execution strategy for the SEE Platform prototype. The underlying feature scope, tech stack, and milestone definitions remain as specified in `docs/plan/BUILD_PLAN.md` and its companion files. This design governs *how* that scope is executed — phasing, review gates, execution model, and plugin strategy.

**Goal:** A fully demo-ready prototype across all 4 roles and 6 platform phases, built as fast as possible via solo Claude Code with parallel subagents.

---

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Phase grouping | 6 demo-able clusters | Each gate ends with a working, showable product slice |
| Within-phase execution | Parallel subagents where milestones are independent | Fastest path to demo-ready; clean context per subagent |
| Foundation phases | Sequential (M0–M4) | Everything depends on schema, auth, and the contractor shell |
| Testing strategy | Unit tests for critical logic + demo-path verification at gates + full Playwright e2e in Phase 6 | Avoids slow coverage theatre on unstable screens |
| Demo scope | All 6 phases complete before showing to users | Feedback needed on full product, not a slice |
| Timeline | No fixed date — optimise for speed | |

---

## Phase Structure

### Phase 1 — Shell, Data & Auth
**Milestones:** M0 → M1 → M2 (sequential)
**Execution:** Single session, strictly sequential — each milestone is a prerequisite for the next.

| Milestone | Deliverables |
|---|---|
| M0 Foundation | Next.js 15 scaffold, Tailwind + Radix, brand tokens, IBM Plex Sans, ESLint/Prettier/Husky, GitHub Actions CI, Vercel deploy, branded landing page |
| M1 Data Model & Seed | Full Prisma schema (all phases), Vercel Postgres + Blob provisioned, seed script with demo dataset (Marcus/Lerato/Sipho/Erin, 12–15 projects, O&M data, marketplace listings) |
| M2 Auth & Role Routing | Auth.js v5 credentials, 4 role-based route groups, one-click demo login card, KYC scaffold, `<FileUploader>` component, `/api/upload/sign` + `/api/upload/finalize` |

**Review gate:** Login as all 4 demo users (one-click). Branded shell and role-appropriate skeleton dashboard render for each. Seed data visible in DB. File upload flow functional end-to-end.

**Plugins:**
- `sequential-thinking` — schema design decisions, auth middleware architecture
- `context7` — Next.js 15 App Router, Auth.js v5, Prisma 5, Vercel Blob
- `frontend-design` — landing page, login page

---

### Phase 2 — Contractor Hero Flow
**Milestones:** M3 → M4 (sequential)
**Execution:** Single session. M4 (project workspace) depends on M3's layout shell and navigation.

| Milestone | Deliverables |
|---|---|
| M3 Dashboard | Unified Contractor Dashboard (6 widgets), AI NewsFeed sidebar, tier badge + token balance in header, Company Profile module |
| M4 Project Management | Projects grid, New Project wizard + Logic Engine, Project Workspace (Overview / Milestones / O&M tabs), milestone tracker with hard gates, submission flow (upload → Under Review → Approved/Rejected), document version history |

**Review gate:** Marcus logs in → dashboard widgets populated from seed. Opens Project Alpha → milestone tracker renders correctly with mixed states from seed. Submits a milestone artefact → status transitions to Under Review.

**Plugins:**
- `sequential-thinking` — milestone Logic Engine (template selection by project type × size × deal structure), tier rules engine
- `context7` — TanStack Query v5, React Hook Form + Zod, Framer Motion
- `frontend-design` — dashboard widgets, project workspace, milestone tracker UI

**Unit tests:** Milestone template selection logic (`lib/milestone-templates.ts`), tier rules engine (`lib/tier-rules.ts`), token earning/spending calculations (`lib/tokens.ts`).

---

### Phase 3 — Governance Layer
**Milestones:** M4.5 → [M5 ‖ M6] (M4.5 sequential first, then M5 + M6 parallel)
**Execution:** M4.5 (comms schema + workspace) must land first — M5 and M6 both reference the comms models. Once M4.5 is merged, spawn two subagents in parallel.

| Milestone | Deliverables |
|---|---|
| M4.5 Project Comms | ProjectWorkspace schema, Channel/Message/Reaction models, auto-creation hooks, default channels, channel UI, markdown composer, @-mentions, threads, reactions, 3s polling, global inbox, system messages on milestone events, seed data (~80 messages in Project Alpha) |
| M5 Verification Engine | AI Verification Agent (stubbed, animated 2–4s), Expert Verification queue, Auto-Gold flow, Tier Rules Engine, tier badge visualisation, tier-gated access, tier progression animation, Gold Standard cert mock |
| M6 Admin Role | Admin dashboard, KYC approval queue, Milestone submission review portal (PDF viewer + annotations), Template configuration UI, Rules Engine UI, User management, Financial/Escrow view scaffold |

**Review gate:** Submit a milestone → AI verification animation plays → admin reviews and approves → system message auto-posts to comms milestone thread → tier badge updates. Comms channels navigable within Project Alpha workspace. Admin KYC and milestone queues populated from seed.

**Plugins:**
- `dispatching-parallel-agents` — M5 and M6 as simultaneous subagents after M4.5 lands
- `sequential-thinking` — comms polling architecture, verification state machine
- `context7` — Anthropic SDK (stubbed verification), Framer Motion (tier animation, verification shimmer)
- `frontend-design` — verification animation, admin queues, tier badge, comms channel UI

**Unit tests:** Tier progression rules (compliant project count thresholds), token cost enforcement for AI/Expert verification.

---

### Phase 4 — Marketplaces
**Milestones:** M7a ‖ M7b (fully parallel from the start)
**Execution:** Service Marketplace and Hardware Marketplace are independent modules sharing only the schema (already in DB from Phase 1). Spawn two subagents immediately.

| Milestone | Deliverables |
|---|---|
| M7a Service Marketplace | SP directory (5 categories), "Get Service" bridge from milestone, RFQ creation, SP role dashboard (Opportunity Board + Job Card Kanban), RFQ→Bid→Acceptance→Escrow→Job Card lifecycle, deliverable upload (auto-Gold), SP reviews, contextual chat per job card |
| M7b Hardware Marketplace | Category browse, product detail pages, cart + PayFast mock checkout, token discount (Discovery Miles model), cashback tokens by tier, affiliate-link fallback |

**Review gate:** Contractor posts RFQ from Project Alpha milestone → SP receives on Opportunity Board → SP bids → contractor accepts → Job Card activates → SP uploads deliverable → milestone auto-Gold. Hardware: browse inverters, add to cart, apply token discount, mock checkout completes.

**Plugins:**
- `dispatching-parallel-agents` — M7a + M7b as simultaneous subagents
- `frontend-design` — SP directory, Job Card Kanban, hardware product pages, cart
- `context7` — Recharts (if SP analytics charts added)

---

### Phase 5 — Commercial Substrate
**Milestones:** M8 ‖ M9 (parallel)
**Execution:** M8 (End-Client + O&M) and M9 (Payments + Licensing) are independent — they share project data from the DB but have separate route groups and UI. Spawn two subagents simultaneously.

| Milestone | Deliverables |
|---|---|
| M8 O&M & Client Role | End-Client onboarding, Plant Dashboard (seeded O&M data replayed as charts), Portfolio Dashboard, O&M Schedule + History, Handover doc repository, multi-brand normalisation tabs (WEG/Victron/SunSynk/Deye), O&M license tier badge, Prescriptive Maintenance alerts (Kruger Family Farm AI tier) |
| M9 Payments & Licensing | EFT flow end-to-end (invoice → banking details → POP upload → reconciliation → activation), PayFast mock, Demo Mode 5s bypass, invoicing (SARS-compliant layout), OmLicense (3 tiers × 2 viewer types), license paywall designs, license activation animation, EPC reseller commissions, Wallet upgrades (fiat + tokens + commissions), Enterprise tier (Spaza Holdings), EnterpriseLicense schema + admin UI + custom dashboard, hardware checkout rail logic, service escrow Invoice+Payment pattern |

**Review gate:** EPC proposes Premium O&M license to Durbanville Mall → client accepts → EFT invoice issued → Demo Mode auto-reconciles in 5s → paywall dissolves (Framer Motion animation) → both EPC and client dashboards activate. Switch to Sipho Dlamini → Enterprise dashboard renders with Spaza branding. O&M charts animate with replayed seed data.

**Plugins:**
- `dispatching-parallel-agents` — M8 + M9 as simultaneous subagents
- `sequential-thinking` — payment state machine, commission engine, EFT reference generation, OmLicense mutual exclusivity rules
- `context7` — Recharts (O&M production charts), Framer Motion (paywall dissolution animation)
- `frontend-design` — Enterprise dashboard, license activation moment, plant dashboard, O&M charts

**Unit tests:** Payment rail selection logic (`lib/payments/rail.ts`), invoice reference generation, commission calculation, OmLicense state transitions.

---

### Phase 6 — SEE.AI Assistant + Full Polish Pass
**Milestones:** M10 (sequential, holistic — requires full platform visible)
**Execution:** Single session. Polish requires seeing the whole product — no parallelism here.

| Area | Deliverables |
|---|---|
| SEE.AI Assistant | Persistent chat widget (bottom-right), real Anthropic Claude SDK streaming, system prompt with user context (role, project, tier, tokens, recent milestones), server-side tool calls (`get_project_details`, `list_projects_at_risk`, `summarise_milestone_status`, `recommend_service_provider`, `generate_company_profile_draft`), conversation history per user, multi-language dropdown (EN/AF/ZU/PT) |
| Stubbed Phase 6 features | Project Valuation ("Sell My Project", canned AI output), WEG product recommendations, Proposal generation mock |
| Polish pass | Designed empty states (every list/grid), skeleton loading states (every async surface), inline error states (every form), keyboard navigation, WCAG AA audit, page transition animations, Demo Mode toggle (pre-scripted moments), Reset Demo Data button, mobile/tablet responsive QA (iPad Pro + iPhone 15) |
| E2E tests | Playwright suite scripted from the 28-step demo dry-run in `07_TESTING.md` |

**Review gate (Demo-Ready Sign-off):** Full 28-step dry-run completes without a single "this is a prototype" caveat. SEE.AI answers contextually about Project Alpha, Marcus's tier, and token balance. All 4 roles reachable via one-click demo login. No console errors. Vercel production URL live at a memorable domain.

**Plugins:**
- `context7` — Anthropic SDK (real streaming + tool use), Playwright e2e
- `frontend-design` — chat widget UI, empty states, skeleton states, polish pass
- `superpowers:verification-before-completion` — mandatory before declaring demo-ready

---

## Plugin Strategy Summary

| Plugin | When used | Purpose |
|---|---|---|
| `sequential-thinking` | Complex logic design within a phase | Milestone Logic Engine, payment state machine, comms architecture, tier rules — problems where reasoning steps matter |
| `context7` | Before using any library | Always fetch current docs for Next.js 15, Auth.js v5, Prisma 5, TanStack Query v5, Anthropic SDK, Framer Motion, Recharts, Playwright — never rely on training data for library APIs |
| `frontend-design` | Before every UI milestone | Ensures brand discipline (no green, no gradients, IBM Plex Sans, accent used sparingly) and production-grade visual quality |
| `dispatching-parallel-agents` | Phases 3, 4, 5 | Spawns subagents for truly independent milestones: M5‖M6, M7a‖M7b, M8‖M9 |
| `superpowers:verification-before-completion` | Phase 6 sign-off | Mandatory gate — run demo dry-run, confirm all checklist items before declaring demo-ready |
| `superpowers:systematic-debugging` | Any bug or test failure | Before proposing any fix |
| `superpowers:receiving-code-review` | Phase review gates | When user feedback arrives, process it rigorously before implementing |

---

## Testing Strategy

| Layer | What | When |
|---|---|---|
| Unit tests (Vitest) | Milestone Logic Engine, tier rules, token calculations, payment rail selection, invoice reference generation, commission calculations | Built alongside the logic, in the same session |
| Demo-path verification | Manual run of the phase's key demo flows | At each review gate before proceeding |
| Playwright e2e | Full 28-step dry-run scripted as automated tests | Phase 6 only, once flows are stable |

---

## Review Gate Protocol

At each phase boundary:
1. Claude presents what was built (summary + live demo flows to try)
2. User runs through the gate criteria listed above
3. User provides feedback — adjustments made before Phase N+1 begins
4. Explicit "proceed" confirms the gate is passed

No phase begins until the previous gate is explicitly passed. This is the adjustment mechanism the user requested.

---

## Out of Scope (Unchanged from BUILD_PLAN.md)

Real KYC APIs, real PDF generation, real PayFast integration, real inverter APIs, real document analysis for AI Verification, real-time WebSockets (polling only), real bank API, real commission payouts, SMS/push notifications, APEX Suite modules.

---

## What This Plan Does Not Change

All feature specifications, screen designs, seed data, data model, brand discipline rules, and demo narrative remain exactly as defined in `docs/plan/`. This document governs execution strategy only — not scope.
