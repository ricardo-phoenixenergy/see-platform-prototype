# SEE Platform — High-Fidelity Prototype Build Plan

**Project:** Sustainable Energy Ecosystem (SEE) — Demo Prototype
**Owner:** Phoenix Energy Solutions / MW-GS Pty Ltd
**Build agent:** Claude Code
**Status:** Ready for execution
**Last updated:** May 2026

---

## How to use this plan

This is the **master orchestration document**. It tells Claude Code what to build, in what order, and where to find the detail it needs. Each section links to a focused detail file.

**Reading order for Claude Code:**

1. Read this file top to bottom — get the full picture.
2. Read `01_ARCHITECTURE.md` — understand the stack and structural decisions.
3. Read `02_DESIGN_SYSTEM.md` — internalise the brand brief before writing any UI.
4. Read `03_DATA_MODEL.md` — understand the Prisma schema before any feature work.
5. Read `08_COMMUNICATIONS.md` before starting M4 — the project workspace shell must accommodate the comms pane from the start; building it in M4.5 without planning the layout makes M4 work need rework.
6. For each milestone in the **Build Sequence** below, read the linked detail file before starting work on that milestone.

**Operating principles for the build:**

- **Brand discipline is non-negotiable.** The brand brief (`/mnt/project/SEE_Brand_Identity_Direction_v1.md`) is the source of truth for every visual decision. When in doubt, check the brief.
- **Type safety end-to-end.** TypeScript strict mode, Zod for runtime validation, Prisma for DB types. No `any`. No `as any` casts without a comment explaining why.
- **Server Components by default.** Use Client Components only where interactivity is required.
- **One feature, one branch, one PR.** Each milestone in the Build Sequence is one PR.
- **Tests on critical paths.** Vitest + Playwright. See `07_TESTING.md`.
- **Polish is a feature.** This is a demo prototype for investors. Empty states, loading states, micro-interactions matter as much as core flows.

---

## What we are building

A **high-fidelity, fully interactive web prototype** of the SEE Platform — a B2B operating system for renewable energy project development in Southern Africa. The prototype must convince three audiences in a live demo:

| Audience | What they need to see |
|---|---|
| **Investors** | A polished, real-feeling product with a coherent narrative — "this is what we're funding." |
| **Contractors / EPCs** | Genuine product depth — the workflows they would actually use day-to-day. |
| **Platform partners** | Ecosystem mechanics — how marketplace, verification, and O&M flows connect. |

The **Contractor (EPC) experience is the hero** and gets the deepest polish. The other three roles (Service Provider, End-Client, Platform Admin) are fully functional but tuned to support the demo narrative rather than every possible workflow.

---

## Scope

**All six phases of the proposal are represented**, but the depth varies. The principle: every screen and feature called out in `SEE_Platform_Scope.pdf` and `S_E_E__Journey_1.pdf` has *some* presence in the prototype; hero flows get production-shaped depth, others get representative depth.

| Phase | Capability | Prototype depth |
|---|---|---|
| **Phase 1** | Auth, KYC, Company Profile, Projects, Milestones, Compliance | **Deep** (hero) |
| **Phase 2** | AI Verification Agent, 3rd Party Expert, Tier System, Gold Standard cert | **Deep** (hero differentiator) |
| **Phase 3** | Service Marketplace + Hardware Marketplace | **Functional** (browse, RFQ, job card lifecycle) |
| **Phase 4** | EFT + PayFast payment rails, Token Economy, Wallet, Reseller commissions | **Deep** (commercial model is core to demo credibility) |
| **Phase 5** | O&M Monitoring, Multi-brand data ingestion, EPC + Client dashboards, Licensing paywall | **Deep** (paywall + activation is a demo moment) |
| **Phase 6** | SEE.AI Assistant, NewsFeed, Prescriptive Maintenance, Project Valuation, Upsell intelligence | **Mixed** (real AI for chat; stubbed for cards/alerts) |

See `04_FEATURE_SPEC.md` for the screen-by-screen specification.

---

## Technical decisions (locked in)

| Layer | Choice | Why |
|---|---|---|
| **Framework** | Next.js 15 (App Router) + TypeScript strict | Required by brief; SSR; Vercel-native. |
| **Styling** | Tailwind CSS + Radix UI primitives | Maximum design control; matches brand brief's restraint philosophy. No off-the-shelf component library. |
| **Database** | Vercel Postgres (managed) | Free at prototype scale; production-shaped; trivial deploy. |
| **ORM** | Prisma | Type-safe; ergonomic; standard for this stack. |
| **Auth** | Auth.js v5 (NextAuth) | Real sessions, real role-based access. Credentials provider for demo; Google/Microsoft scaffolded. |
| **AI** | Anthropic Claude SDK | SEE.AI Assistant only; other AI features are stubbed. See `06_AI_INTEGRATION.md`. |
| **Forms** | React Hook Form + Zod | Type-safe forms; same Zod schemas for API validation. |
| **Server state** | TanStack Query (React Query) | Caching, optimistic updates, refetch logic. |
| **Charts** | Recharts | O&M monitoring dashboards; performance curves. |
| **Animation** | Framer Motion | Polish moments — tier progression, milestone state changes, verification "thinking" animations. |
| **File handling** | UploadThing or Vercel Blob | KYC docs, milestone artefacts. Real upload, real storage. |
| **Email** | Resend (test mode) | Verification emails, milestone notifications. Real provider, test mode for demos. |
| **Deployment** | Vercel | Zero-config; preview deployments per PR. |
| **CI** | GitHub Actions | Lint + typecheck + test on PR. |
| **Monitoring** | Sentry (optional) | Set up but disabled for demo unless requested. |

The complete dependency list, project structure, and architectural decisions are in `01_ARCHITECTURE.md`.

---

## Build Sequence

The build is sequenced into **twelve milestones**. Each milestone is a self-contained PR that produces something visible. Earlier milestones unblock later ones — do not skip ahead.

### M0 — Foundation (Project Setup)

**Goal:** A bootable Next.js project with the full toolchain, branded landing page, and CI green.

**Deliverables:**
- Next.js 15 + TypeScript strict + Tailwind + Radix scaffolded
- Brand tokens implemented in Tailwind config (see `02_DESIGN_SYSTEM.md`)
- ESLint + Prettier + Husky pre-commit
- GitHub Actions CI (lint, typecheck, build)
- Vercel deployment connected
- Postgres provisioned, Prisma initialised
- Landing page rendered at `/` with the canonical SEE wordmark and tagline ("the operating system for energy project developers"). Restrained, off-white background, top-left wordmark, single CTA — per `02_DESIGN_SYSTEM.md` §8.1.

**Detail:** `01_ARCHITECTURE.md`, `02_DESIGN_SYSTEM.md`

---

### M1 — Data Model & Seed

**Goal:** Full Prisma schema, migrations applied, seed data populating a realistic platform state.

**Deliverables:**
- Complete `schema.prisma` covering all entities across all six phases (see `03_DATA_MODEL.md`)
- Initial migration applied to Vercel Postgres
- **Vercel Blob provisioned and connected** (`BLOB_READ_WRITE_TOKEN` set)
- **Seed assets uploaded** — ~20 demo PDFs, logos, hardware images uploaded to Blob on first seed (see `05_SEED_DATA.md` §Demo files)
- `prisma/seed.ts` populating: 4 user roles, 3 contractor companies, 12–15 projects across stages, milestone templates, 8 service providers, 30+ hardware listings, O&M data for 5 sites, token balances, news items — all referencing real Blob URLs
- `npm run db:reset` script for clean demo state
- `npm run db:seed:demo` for the curated demo dataset

**Detail:** `03_DATA_MODEL.md`, `05_SEED_DATA.md`, `01_ARCHITECTURE.md` §File uploads

---

### M2 — Authentication & Role-Based Routing

**Goal:** Real auth with four functional roles, session management, role-based route protection.

**Deliverables:**
- Auth.js v5 with credentials provider; demo users seeded with passwords
- Google/Microsoft OAuth scaffolded (env-disabled by default)
- Email verification flow (Resend test mode)
- Role-based middleware: `/contractor/*`, `/service-provider/*`, `/client/*`, `/admin/*`
- Role-switching mechanism for demos: a single user can have multiple role memberships (Service Provider per spec is a Contractor + SP)
- Login page, registration page, email verification page — all branded per `02_DESIGN_SYSTEM.md`
- **`<FileUploader>` reusable component** built (per `01_ARCHITECTURE.md` §File uploads §Client implementation) — needed for KYC and reused throughout
- **`/api/upload/sign` and `/api/upload/finalize` endpoints** built
- KYC workflow scaffold using `<FileUploader>` (multi-step form, document upload to Blob, "pending review" state)

**Detail:** `04_FEATURE_SPEC.md` §Auth, `01_ARCHITECTURE.md` §Auth, `01_ARCHITECTURE.md` §File uploads

---

### M3 — Contractor Hero Flow: Dashboard & Company Profile

**Goal:** The Unified Contractor Dashboard and Company Profile module — the first thing an EPC sees when they log in.

**Deliverables:**
- Main Dashboard (`/contractor`) with all six widgets per Scope §Contractor 2.a:
  - Stats overview (Pipeline, Financials, Portfolio Size)
  - Upcoming Calendar Events
  - Plant Notifications (Operational, Prescriptive, Maintenance — stubbed AI)
  - AI Suggestions cards (stubbed)
  - Milestone Watch
  - Company Profile Generator (button → mocked PDF download)
- AI NewsFeed sidebar (pre-curated SA renewable energy headlines, rotating)
- Tasks / To-Do list
- Company Profile module: KYC management view, compliance documents, BEEE, licenses, bank details, profile settings
- Tier badge prominent in header (Bronze/Silver/Gold/Platinum)
- Token balance prominent in header

**Detail:** `04_FEATURE_SPEC.md` §Contractor Dashboard

---

### M4 — Contractor Hero Flow: Project Management System

**Goal:** The Project Management System — the platform's central nervous system. This is the deepest single module in the prototype.

**Deliverables:**
- Projects Grid (`/contractor/projects`) — filterable card view per Scope §Contractor 2.b
- Project Initialisation wizard ("New Project") — Intake Form with Client/Site/Technical/Commercial inputs
- Logic Engine (server-side): selects correct milestone template based on Project Type × System Size × Deal Structure
- Individual Project Workspace with three tabs:
  - **Tab A — Overview & Configuration**: editable project metadata, deal structure, client info, site info, client needs
  - **Tab B — Milestones**: the milestone tracker with hard gates, mandatory submissions, optional supporting docs, "Get Service" bridge to marketplace, validation/version-control cycle, status visibility
  - **Tab C — O&M & Monitoring**: unlocks only when Project Stage = Operational (see M8)
- Quick Upload flow for existing projects (+1,000 tokens, drives tier progression)
- Milestone submission flow: upload artefact → enters Admin queue → status changes (Submitted → Under Review → Approved/Rejected with feedback)
- Document version history per artefact

**Detail:** `04_FEATURE_SPEC.md` §Project Management, `03_DATA_MODEL.md` §Milestones

---

### M4.5 — Project Communications (Slack-style)

**Goal:** Per-project comms workspaces with channels, threads, mentions, attachments — replacing fragmented email/WhatsApp/Slack with a single audit-trailed location for every project conversation.

**Deliverables:**
- Schema: `ProjectWorkspace`, `Channel`, `ChannelMembership`, `Message`, `MessageReaction` + relations to existing models
- Auto-creation hooks: ProjectWorkspace on project create; milestone threads on milestone instantiate
- Default channels (`#general`, `#site-updates`, `#client`, `#admin`) on project creation; auto-membership for contractor team + admins
- Channel UI inside project workspace (sidebar + timeline + member list)
- Markdown composer with @-mentions, #-channel-refs, drag-drop attachments (re-using `<FileUploader>`)
- Threads (drawer UI, reply composer)
- Reactions (emoji toggle)
- Polling: 3s active channel, 15s sidebar + inbox
- Global inbox panel in topbar (mentions + unread across all projects)
- Cmd+K search includes message results
- System messages auto-post on milestone state changes, submissions, approvals
- Service Provider auto-join milestone thread as GUEST when JobCard active; transition to OBSERVER on completion
- Client invite flow (contractor invites client user → joins `#client` only)
- Seed data: Project Alpha workspace pre-populated with ~80 messages across channels including the rejected-EIA conversation, Auto-Gold marketplace flows, current mentions

**Detail:** `08_COMMUNICATIONS.md`

---

### M5 — Verification Engine & Tier Progression

**Goal:** The Phase 2 differentiator — AI Verification Agent, 3rd Party Expert Verification, Tier System, Gold Standard certificate.

**Deliverables:**
- AI Verification Agent: when a contractor submits a milestone artefact, they can pay 1,000 tokens for AI verification — animated 2–4s "analysing..." state, then a stubbed pass/fail with detailed feedback (see `06_AI_INTEGRATION.md`)
- 3rd Party Expert Verification: 10,000 tokens → goes to expert queue → expert dashboard (admin role can act as expert for demo) → colour-coded quality rating
- Auto-Gold verification: milestones acquired through marketplace Service Providers are automatically marked Gold
- Tier Rules Engine: Bronze → Silver → Gold → Platinum based on compliant project count
- Tier badge visualisation across the platform
- Tier-gated feature access (e.g., leads section locked until Silver)
- Cashback rate display per tier
- Gold Standard Certificate generation (mocked PDF) when all milestones validated
- Tier progression animation when threshold crossed (Framer Motion)

**Detail:** `04_FEATURE_SPEC.md` §Verification, `06_AI_INTEGRATION.md` §Verification

---

### M6 — Admin Role: Governance & Verification Queue

**Goal:** The Platform Admin / Superuser role — governance, KYC approval, milestone review, template configuration.

**Deliverables:**
- Super User Dashboard (`/admin`) — system-wide stats, queue counts
- KYC Approval Queue — review CIPC, VAT, Director ID; approve/reject/request more info
- Milestone Submission Review Portal — view submitted artefacts (PDF viewer), annotate, approve/reject with feedback
- Milestone Template Configuration — drag-and-drop template builder (basic version: list-and-form, full drag-drop is stretch)
- Rules Engine UI: IF Project Size > 1MW THEN include "Grid Impact Study"
- Template versioning (Version X for active projects; Version Y for new projects)
- User Management: list, search, role assignment, tier upgrade/downgrade
- Notifications Engine config
- Financial & Escrow Manager view (read-only for prototype)
- Dispute Resolution Center scaffold

**Detail:** `04_FEATURE_SPEC.md` §Admin

---

### M7 — Marketplaces: Services + Hardware

**Goal:** Phase 3 — both marketplaces functional with the RFQ-to-Job-Card lifecycle.

**Deliverables:**

**Service Marketplace:**
- Service Provider directory with 5 categories (Structural & Civils, Pr. Engineering, Legal, Logistics & Plant Hire, Finance & Insurance)
- "Get Service" bridge from Milestone — pre-fills RFQ linked to specific milestone
- RFQ creation flow
- Service Provider role: Opportunity Board, Job Cards Dashboard (Kanban: Bids Submitted / Active / Pending Review / Completed & Paid), Individual Job Card view
- RFQ → Bid → Acceptance → Escrow Lock → Job Card conversion (per Scope §Service Providers 2.f)
- Granular project access for SPs (Least Privilege: SP sees only relevant project data)
- Deliverable upload back to the linked milestone (auto-Gold)
- Contextual chat per job card
- Reviews per Service Provider

**Hardware Marketplace:**
- Browse by category (Solar Panels, Batteries, Inverters, Generators, Accessories)
- Product detail pages
- Cart + checkout flow (PayFast simulated — see M9)
- Token allocation to reduce cash cost (Discovery Miles model)
- Affiliate-link fallback for non-partnered suppliers
- Cashback tokens earned by tier on purchase

**Detail:** `04_FEATURE_SPEC.md` §Marketplaces

---

### M8 — End-Client Role: O&M Monitoring & Plant Dashboards

**Goal:** Phase 5 — End-Client onboarding, plant dashboards, O&M scheduling. One polished site, rest representative.

**Deliverables:**
- End-Client onboarding flow (handover doc repository, access control)
- Plant Dashboard (site level): real-time-ish chart (replay seeded data), SoC %, Production kWh, performance vs irradiance
- Portfolio Dashboard (multi-site for clients with >1 site)
- O&M Schedule & History: create events, link to calendar, attach reports/invoices, share via email
- Handover Document Repository
- Multi-brand data normalisation simulation: tabs for WEG / Victron / SunSynk / Deye showing identical normalised view
- O&M License tier badge (Basic / Premium / AI)
- For "AI License" sites: Prescriptive Maintenance alerts (stubbed: "Inverter error 404 at Site Z — schedule technician")

**Detail:** `04_FEATURE_SPEC.md` §End-Client, `05_SEED_DATA.md` §O&M

---

### M9 — Payments, Licensing & Wallet

**Goal:** The full commercial substrate — EFT and PayFast rails, invoicing, O&M licensing with reseller commissions, wallet showing fiat + tokens + commission earnings.

**Deliverables:**

**Payments (two rails):**
- EFT flow end-to-end: invoice issued → banking details + reference shown → POP upload → admin reconciliation → status updates
- PayFast flow: mock gateway redirect, success/failure handling, real-time status
- Demo Mode bypass: EFT auto-reconciles after 5s for live demo speed
- Payment state machine with proper transitions and edge cases (expired, disputed)
- Admin Reconciliation Queue UI (similar pattern to KYC Queue)

**Invoicing:**
- Invoice generation on payment-required actions (license activation, escrow deposit, hardware order, etc.)
- Invoice list per role (incoming/outgoing for company-to-company, just incoming for platform invoices)
- In-app HTML invoice view (SARS-compliant tax invoice layout)
- "Download PDF" button mocked
- Sequential invoice numbering per issuer

**O&M Licensing (replaces simple OmContract):**
- `OmLicense` schema with viewer type (EPC vs CLIENT) and licensee company
- Three tiers (Basic / Premium / AI) per viewer type
- Three commercial flows: EPC sells to client (with commission + bundled EPC view), EPC self-licenses, both license independently
- License paywall designs on EPC's Tab C and Client's Plant Dashboard
- License activation flow: pick tier → invoice → pay → activate
- License sale flow (EPC initiates): pick tier + price → propose to client → client accepts → invoice → client pays → commissions credit + both dashboards activate
- License activation animation (the demo moment — paywall dissolves, dashboard reveals)
- Monthly renewal scaffolding (manual trigger in admin for demo)
- Lapse + reactivation states

**Reseller / Commission Engine:**
- `LicenseCommission` records per license per month
- EPC's "Reseller" view in their Wallet showing recurring commission earnings, licenses sold, upsell opportunities
- Commission payout queue for admin (monthly batch, mark as paid via EFT)

**Wallet upgrades:**
- Fiat balance: incoming payments held in custody, outgoing commission payouts
- Token balance: existing
- Commission tab: recurring earnings, upcoming payouts
- Transaction history: unified across all three (tokens, fiat, commissions)

**Hardware checkout (revised from M7):**
- Rail choice on checkout: EFT default for ≥R10k, PayFast default for <R10k
- Token discount applies to either rail
- EFT-funded orders move to PENDING_PAYMENT → reconciliation → PAID → SHIPPED

**Service marketplace escrow (revised from M7):**
- Escrow now uses Invoice + Payment pattern
- Bid acceptance issues escrow invoice to contractor
- On payment confirmed: escrow funded, JobCard activates
- On job completion + acceptance: escrow released, SP payout queued

**Banking details:**
- Platform bank account configurable by admin
- Surfaces on EFT instructions modal and invoice PDFs

**Enterprise tier (sales-led product line):**
- Schema: `EnterpriseLicense`, `EnterpriseProjectScope`, `EnterpriseIntegration`, `EnterpriseSeat`, `EnterpriseUsageRecord`
- Admin's Enterprise Accounts management UI: overview, license detail (overview / projects / integrations / seats / usage / invoices / notes), activation wizard
- Spaza Holdings promoted to Enterprise client in seed (with 4 internal seats, 3 active integrations, custom dashboard config, 8 months of history)
- Spaza's Enterprise dashboard: custom widget renderer (`<EnterpriseDashboard>`) consuming layout config
- Co-branded topbar (`SEE × SPAZA HOLDINGS`)
- Role-gated widget visibility (Admin / Finance / Ops / Viewer)
- Enterprise client's Operations / Reports / Integrations / Admin sections (only Operations + Admin built fully; Reports and Integrations are scaffolded)
- Integration management UI: API keys (mocked), webhook list, scheduled export configs, inbound feed status (all visual; no real endpoints)
- Enterprise itemised invoices (base + seats + integrations + usage)
- EPC's view of Enterprise clients: Enterprise badge replaces tier badge, no "Sell to client" CTA, negotiated commission visible in Reseller tab
- Scope addition flow (admin adds project to Enterprise scope, immediately propagates)

**Detail:** `09_PAYMENTS_AND_LICENSING.md`

---

### M10 — SEE.AI Assistant (Real AI) + Polish Pass

**Goal:** Phase 6 — the real AI assistant, plus a global polish pass before demo readiness.

**Deliverables:**

**SEE.AI Assistant:**
- Persistent chat widget bottom-right of every authenticated screen
- Real integration with Anthropic Claude SDK
- System prompt loads user context: role, current project, tier, token balance, recent milestones
- Server-side tool calls: `get_project_details`, `list_projects_at_risk`, `summarise_milestone_status`, `recommend_service_provider`, `generate_company_profile_draft`
- Conversation history persisted per user
- Multi-language support: dropdown for English / Afrikaans / Zulu / Portuguese (Claude handles natively)
- Voice mode scaffolded but disabled
- See `06_AI_INTEGRATION.md` for full prompt design

**Other Phase 6 features (stubbed):**
- Project Valuation tool: "Sell My Project" — AI evaluates and produces a valuation (canned outputs per project)
- WEG product recommendations on hardware browse
- Proposal generation (mocked PDF download)

**Polish Pass:**
- Empty states for every list/grid (designed, not default)
- Loading states for every async action (skeletons, not spinners)
- Error states for every form (inline, not toast-only)
- Keyboard navigation across all major flows
- Accessibility audit: WCAG AA contrast, focus rings, ARIA labels
- Page transition animations
- Demo Mode toggle: pre-scripted moments (milestone auto-approves 30s after submission, tier progression triggers on demand)
- Reset Demo Data button in admin panel
- Mobile/tablet responsive QA across all screens

**Detail:** `06_AI_INTEGRATION.md`, `07_TESTING.md` §Polish checklist

---

## What is explicitly out of scope

These come up in the source documents but are **not** built in the prototype:

- Real KYC verification against CIPC/SARS APIs (mocked)
- Real PDF generation for Company Profile, Gold Standard cert, O&M reports (mocked — button + "downloading..." animation, no real file)
- Real PayFast integration (mocked checkout)
- Real inverter API integration (WEG/Victron/SunSynk/Deye — replayed seed data)
- Real document analysis for AI Verification (canned results per document type)
- Email deliverability beyond Resend test mode
- SMS notifications
- Push notifications
- The actual APEX Suite modules (Echo, Quantum, Zenith, Prism, Vector, Forge) — referenced conceptually only
- Production-grade security audit (NextAuth defaults; demo-grade only)
- Real escrow / banking integration

These are all in the proposal's six-phase build, not the prototype.

---

## Demo readiness checklist

Before declaring the prototype demo-ready, all of the following must be true:

- [ ] Every screen called out in `04_FEATURE_SPEC.md` is reachable from navigation
- [ ] Every role has a populated, polished dashboard
- [ ] Seed data tells a coherent story: 12–15 projects across stages, 3 contractor companies at different tiers, active milestone reviews, populated marketplaces, live O&M data on 1 site
- [ ] Demo Mode toggle works (pre-scripted moments trigger correctly)
- [ ] SEE.AI Assistant answers contextually about the demo data
- [ ] Reset Demo Data button returns to canonical seed state
- [ ] All four roles can be logged into via the demo login page (one click each, no password typing during demo)
- [ ] Mobile/tablet responsive verified on iPad Pro and iPhone 15
- [ ] No console errors during a full demo run-through
- [ ] Vercel production deployment live at a memorable URL
- [ ] Founder dry-run completed end-to-end without "this is a prototype" caveats

---

## Detail file index

| File | Contents |
|---|---|
| `01_ARCHITECTURE.md` | Stack, project structure, conventions, file uploads, environment variables, deployment |
| `02_DESIGN_SYSTEM.md` | Brand tokens, typography, component patterns, the Vanta/Stripe/Linear discipline |
| `03_DATA_MODEL.md` | Complete Prisma schema, entity relationships, enums, key indexes |
| `04_FEATURE_SPEC.md` | Screen-by-screen specification for every milestone |
| `05_SEED_DATA.md` | The canonical demo dataset — projects, users, milestones, marketplace listings, message history, license states |
| `06_AI_INTEGRATION.md` | SEE.AI Assistant prompt design, tool calls, stubbed AI patterns |
| `07_TESTING.md` | Test strategy, critical-path tests, polish checklist, demo dry-run script |
| `08_COMMUNICATIONS.md` | Project comms — channels, threads, mentions, attachments, milestone-thread integration |
| `09_PAYMENTS_AND_LICENSING.md` | EFT + PayFast rails, invoicing, O&M licensing with reseller commissions, paywalls |

---

## A note on the brand brief

The brand identity direction (`/mnt/project/SEE_Brand_Identity_Direction_v1.md`) is unusual in its insistence on what *not* to do. Internalise this before writing any UI:

- **No green.** Every renewable energy brand uses green. SEE doesn't.
- **No yellow / orange / sunshine palette.**
- **No teal in the dominant range** (Phoenix territory).
- **No copper at saturated levels** (Phoenix territory).
- **No gradients in primary surfaces.**
- **No literal eye iconography** for the logo.
- **No solar panels, turbines, batteries, leaves, sunshine** anywhere.
- **No hexagons** as a tech-cliché visual element.
- **No Inter font** (Phoenix uses it) — use Söhne, Geist, IBM Plex Sans, or Aktiv Grotesk.

The brand reads as **infrastructure software**, not energy company. The visual reference set is Vanta, Stripe, Linear, Mercury — not Octopus Energy or Sunrun. Restraint is the brand.

See `02_DESIGN_SYSTEM.md` for the productionised system.
