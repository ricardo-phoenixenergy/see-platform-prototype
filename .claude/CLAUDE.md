# SEE Platform

## What this is

A high-fidelity, fully interactive web prototype of the **SEE Platform** — a B2B operating system for renewable energy project development in Southern Africa. Joint venture between MW-GS Pty Ltd and Phoenix Energy Solutions.

The prototype must convince three audiences in live demos: **investors** (this is what we're funding), **contractors/EPCs** (this is the workflow you'd actually use), **platform partners** (this is how the ecosystem connects).

The hero role is **Contractor (EPC)**. The other three roles (Service Provider, End-Client, Platform Admin) are fully functional but tuned to support the demo narrative.

---

## The plan — read in this order

The build plan lives in `docs/plan/`. **Read these files at the start of every new session** unless you're confident they're already in context:

1. `docs/plan/BUILD_PLAN.md` — master orchestrator; defines the 12 milestones
2. `docs/plan/01_ARCHITECTURE.md` — stack, structure, file uploads, conventions
3. `docs/plan/02_DESIGN_SYSTEM.md` — brand discipline (non-negotiable)
4. `docs/plan/03_DATA_MODEL.md` — Prisma schema

**Before starting M4 (Project Management), also read** `docs/plan/08_COMMUNICATIONS.md` — the project workspace shell must accommodate the comms pane from the start.

**Per-milestone detail files** to consult when starting that milestone's work:
- `04_FEATURE_SPEC.md` — screen-by-screen specification
- `05_SEED_DATA.md` — canonical demo dataset
- `06_AI_INTEGRATION.md` — SEE.AI Assistant and stubbed AI features
- `07_TESTING.md` — test strategy, polish checklist, demo dry-run
- `08_COMMUNICATIONS.md` — Slack-style project comms (M4.5)
- `09_PAYMENTS_AND_LICENSING.md` — EFT + PayFast + O&M licensing + Enterprise tier (M9)

**Source materials** from Phoenix/MW-GS are in `docs/source-materials/`. Treat the plan files as authoritative; source materials are background only.

**Architecture decisions** made during the build are in `docs/decisions/`. Read the index entries below when relevant.

---

## Current milestone

> **Currently working on:** M0 — Foundation
> **Last completed:** (none — fresh repo)
> **Next:** M1 — Data Model & Seed

*Keep this updated as you progress. This single line orients every new session.*

---

## Operating principles (non-negotiable)

These come from `BUILD_PLAN.md` and apply across every milestone:

- **TypeScript strict.** No `any`. No `as any` casts without a comment explaining why.
- **Server Components default.** Add `'use client'` only when interactivity is required; document why at the top of the file.
- **One milestone = one PR.** Do not blur milestone boundaries.
- **Brand discipline is non-negotiable.** When in doubt, re-read `02_DESIGN_SYSTEM.md`.
- **Tests on critical paths.** Vitest for logic, Playwright for the demo flow. See `07_TESTING.md`.
- **Polish is a feature.** Empty states, loading states, micro-interactions matter as much as core flows. The prototype is a live demo, not an MVP.
- **Stop and report at milestone boundaries.** Do not auto-advance from one milestone to the next without explicit confirmation.

---

## Brand reject tests

Run these against every UI decision. If any answer is wrong, redo:

- Is there green, yellow, orange, or any sunshine palette? → **Reject.**
- Are there solar panels, turbines, batteries, leaves, sun rays anywhere? → **Reject.**
- Is the font Inter? → **Reject** (Phoenix uses it; use IBM Plex Sans).
- Are there gradients on primary surfaces? → **Reject.**
- Are there exclamation marks in microcopy? → **Reject.**
- Are there urgency cues ("NEW!", "TRY NOW", starbursts, ribbons)? → **Reject.**
- Could this plausibly be a Phoenix sub-brand? → **Reject.**
- Does it sit alongside Vanta, Stripe, Linear, Mercury without looking out of place? → **Ship.**

The accent colour (deep electric blue, `#3E5BEA`) is **precious** — use it sparingly. Primary CTAs are `ink-900`, not accent. Reserve accent for true emphasis (active states, focus rings, the one or two key moments per screen).

---

## Tech stack (locked)

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript 5 strict
- **Styling:** Tailwind CSS + Radix UI primitives + CVA + tailwind-merge (no shadcn copy-paste)
- **Database:** Vercel Postgres + Prisma 5
- **Auth:** Auth.js v5 (NextAuth) — credentials + Google/Microsoft scaffolded
- **AI:** `@anthropic-ai/sdk` (model: `claude-sonnet-4-20250514`)
- **State:** TanStack Query (server), React Hook Form + Zod (forms), Zustand (cross-cutting UI only)
- **Charts:** Recharts
- **Animation:** Framer Motion (deliberate, not decorative)
- **Files:** Vercel Blob via direct-to-Blob pre-signed URLs (see `01_ARCHITECTURE.md` §"File uploads")
- **Email:** Resend (test mode)
- **Icons:** Lucide React
- **Deploy:** Vercel

See `01_ARCHITECTURE.md` for the full project structure, conventions, env vars, and CI/CD.

---

## Demo narrative (essential context)

The seed data tells a coherent story. Internalise this before working on any feature — it affects what "looks right" in every screen.

- **Marcus Adebayo** runs Adebayo Renewables (Contractor, Silver tier, 12 active projects, 12,400 tokens). He's the hero demo user.
- **Project Alpha** = "Spaza Soweto Retail Solar PPA" — Marcus's flagship project, Construction stage, deliberately mixed milestone states (some approved, some Auto-Gold from marketplace, one currently under admin review, one with an open RFQ). The rejected-then-approved EIA story is a deliberate narrative element of the seed — don't smooth it out.
- **Spaza Holdings** is an **Enterprise client** (not standard). They have a custom dashboard, API integration, scheduled exports, 4 internal seats. Sipho Dlamini lands on the Enterprise dashboard, not the standard portfolio.
- **Durbanville Mall** (Tess de Wet) is a **standard end-client** used for the demo activation moment (Act 3 of the dry-run). She accepts a Premium license proposal via EFT.
- **Spaza Boksburg (Project #3)** is NOT initially in Enterprise scope — it's the Act 4 demo where admin adds it to scope live.
- **Kruger Family Farm** is the AI Prescriptive Maintenance demo (single site, AI tier license active).
- **Manchester Restaurant Group** is the EPC-self-licensed example (Flow B — client didn't want the dashboard).

The 28-step demo dry-run in `07_TESTING.md` is the spine. When in doubt about what should be visible/functional, trace it back to the dry-run.

---

## Things that have caused confusion before

*Empty initially. Add a one-liner every time something goes wrong twice. This list is gold — keep it growing.*

- **`OmContract` does not exist.** It was replaced by `OmLicense` in the schema (per `03_DATA_MODEL.md` and `09_PAYMENTS_AND_LICENSING.md`). Do not reintroduce it.
- **Spaza Holdings is Enterprise, not a standard end-client.** Sipho's login lands on the custom Enterprise dashboard with the four-section sidebar (Operations / Reports / Integrations / Admin), not on `/client/portfolio`.
- **EFT is the primary payment rail, not PayFast.** PayFast is for low-value transactions (<R10k); EFT is the default for everything else. See `09_PAYMENTS_AND_LICENSING.md`.
- **The accent colour is sparingly used.** Primary CTAs are `ink-900`. Resist the temptation to make everything accent-coloured.

---

## Commands you'll need

```bash
# Dev
npm run dev                          # local dev server
npm run db:reset && npm run db:seed:demo   # reset to canonical demo state
npm run db:seed:empty                # minimal seed for "watch me create" demos

# Pre-commit check
npm run lint && npm run typecheck && npm run test:unit

# Tests
npm run test:unit                    # Vitest
npm run test:e2e                     # Playwright

# Database
npx prisma migrate dev               # new migration during dev
npx prisma studio                    # DB browser
```

---

## How to work with me

A few things that make sessions faster and outputs better:

- **Always confirm the current milestone before starting work.** Don't assume — re-read the "Current milestone" line above and ask if it looks stale.
- **Re-read the relevant detail file before any non-trivial work.** Even if you've read it earlier in the session, the spec is the source of truth and re-grounding takes 30 seconds.
- **Propose, then build.** For anything that isn't pure mechanical work (a wiring task, a typo fix), describe what you're about to do in two or three sentences before doing it. This catches misunderstandings cheaply.
- **Update this file when you discover something subtle.** If a piece of the plan is ambiguous, if a decision was made that contradicts an earlier assumption, if a file was renamed — add a note to "Things that have caused confusion before". Future sessions will thank you.
- **Update the "Current milestone" line whenever a milestone completes.** This is the single most useful piece of state in this file.

---

## Architecture decisions made during build

*See `docs/decisions/`. Add a one-line index entry per decision as they're made. Examples of what belongs here:*

- *Choice of PDF library (when implementing the mocked PDF UI)*
- *Specific Pusher/Ably swap timing for production handoff*
- *Any deferred features captured as "post-prototype"*
- *Polling cadence adjustments*
- *Schema migrations that deviate from `03_DATA_MODEL.md`*

*Currently empty — populate as the build progresses.*

---

## What out-of-scope looks like

The plan is deliberate about what's NOT in the prototype. If asked to add any of these, push back and ask whether the plan should be revised first:

- Real KYC verification against CIPC/SARS APIs (mocked)
- Real PDF generation (UI mocked — button + animation, no actual file)
- Real PayFast or bank API integration (PayFast mocked; EFT reconciliation is real flow but no bank API)
- Real inverter API integration (WEG/Victron/SunSynk/Deye — replayed seed data)
- Real document analysis for AI Verification (canned deterministic stubs)
- Real-time WebSocket delivery for comms (polling at 3s — production swaps to Pusher)
- Real commission payout via EFT batch (admin marks paid)
- Real recurring billing scheduler (manual trigger via admin in Demo Mode)
- Email beyond Resend test mode
- SMS, push notifications
- Real escrow integration
- The actual APEX Suite modules (Echo, Quantum, Zenith, Prism, Vector, Forge — referenced conceptually only)

These are all production work — not prototype work.

---

## The point

This is a demo prototype that needs to feel like a product. Every choice — typography weight, animation timing, empty state copy, the precision of the seed narrative — compounds into either "this is convincing" or "this is a demo." Aim for convincing.
