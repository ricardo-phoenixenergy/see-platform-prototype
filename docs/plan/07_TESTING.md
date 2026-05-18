# 07 — Testing, Polish & Demo Readiness

This file covers three things: the test strategy (what's tested, how, and why), the polish checklist (the things that aren't bugs but make the prototype feel real), and the demo dry-run script (a literal walkthrough the founders use to verify demo-readiness).

The principle: **the prototype isn't done when it works; it's done when it survives a live demo without anyone needing to apologise for it.**

---

## Test strategy

This is a prototype, not a production system. The test pyramid is intentionally light at the bottom (no exhaustive unit coverage), heavy at critical paths (E2E for the demo flow), and zero at infrastructure (no load tests, no chaos engineering).

**What we test:**
- Critical demo paths via Playwright E2E
- Pure business logic via Vitest unit tests (milestone template selection, tier progression rules, token transaction math)
- Type safety via TypeScript strict
- API contracts via Zod at runtime + inferred types at compile time

**What we don't test:**
- UI component snapshots (too brittle; the design will iterate)
- 100% coverage on Server Actions (rely on E2E)
- Auth.js internals (trust the library)
- Anthropic SDK behaviour (mock at boundary)

### Vitest (unit)

Configuration: `vitest.config.ts` with `jsdom` environment for component tests, `node` for server logic.

```
tests/unit/
├── milestone-templates.test.ts    # Logic engine: template selection by inputs
├── tier-rules.test.ts             # Tier progression thresholds
├── tokens.test.ts                 # Earn/spend math, balance constraints
├── permissions.test.ts            # Role-based access helpers
├── verification-stubs.test.ts     # Deterministic stub outputs are stable
└── components/
    ├── tier-badge.test.tsx        # Renders correct colour per tier
    └── empty-state.test.tsx       # Renders with required props
```

**Coverage target:** the logic files above ≥ 80%. UI components: smoke-test render only.

**Run:** `npm run test:unit` — must pass in CI.

### Playwright (E2E)

Configuration: `playwright.config.ts` with three browsers (chromium, webkit, firefox), runs against a deployed preview URL or local dev server.

Tests live in `tests/e2e/` organised by user journey, not by screen:

```
tests/e2e/
├── auth.spec.ts                       # Sign in via demo button, sign out
├── contractor-onboarding.spec.ts      # Register → KYC → first project
├── contractor-hero-flow.spec.ts       # The full demo path (see "Demo flow E2E" below)
├── service-provider-flow.spec.ts      # Bid → win → deliver → review
├── client-monitoring.spec.ts          # Plant dashboard renders, brand-tabs work
├── admin-governance.spec.ts           # KYC approval, milestone review, template edit
├── communications.spec.ts             # Send message, thread reply, @-mention, search
├── payments-and-licensing.spec.ts     # EFT flow end-to-end, license activation, paywall states
├── enterprise.spec.ts                 # Enterprise dashboard renders, role-gated widgets, scope expansion
└── ai-chat.spec.ts                    # SEE.AI responds (mocks Anthropic boundary)
```

**Demo flow E2E** (`contractor-hero-flow.spec.ts`) is the most important test in the suite. It walks the exact path the founder will demo:

```ts
test('contractor hero demo flow', async ({ page }) => {
  // 1. Login as Marcus
  await page.goto('/login')
  await page.click('text=Marcus Adebayo')
  await expect(page).toHaveURL('/contractor')

  // 2. Dashboard renders with seeded widgets
  await expect(page.getByTestId('stats-projects')).toContainText('12')
  await expect(page.getByTestId('milestone-watch')).toBeVisible()

  // 3. Navigate to hero project
  await page.click('text=Projects')
  await page.click('text=Spaza Soweto Retail Solar PPA')

  // 4. Tab B milestones — the rejected EIA story
  await page.click('role=tab[name=Milestones]')
  await expect(page.getByTestId('milestone-eia')).toContainText('Approved')
  await page.click('text=EIA Report')
  await expect(page.getByTestId('version-history')).toContainText('v1')
  await expect(page.getByTestId('version-history')).toContainText('v2')

  // 5. AI Verification on the electrical milestone
  await page.click('text=Electrical installation')
  await page.click('text=Verify with AI')
  await page.click('text=Confirm (1,000 tokens)')
  await expect(page.getByTestId('ai-verification-progress')).toBeVisible()
  await expect(page.getByTestId('ai-verification-result')).toBeVisible({ timeout: 15000 })

  // 6. SEE.AI chat
  await page.click('[aria-label="Open SEE.AI"]')
  await page.fill('textarea[name="message"]', 'Which of my projects are at risk?')
  await page.press('textarea[name="message"]', 'Enter')
  await expect(page.getByTestId('ai-response')).toContainText('Project Alpha', { timeout: 20000 })
})
```

**Run cadence:**
- PR CI: unit tests only (fast)
- Nightly schedule: full E2E suite against staging preview
- Pre-demo: full E2E against production URL

### Type checking and lint

```
npm run lint        # ESLint + Prettier check
npm run typecheck   # tsc --noEmit
npm run test:unit   # Vitest
npm run test:e2e    # Playwright (local dev server)
npm run build       # next build (catches build-time issues)
```

All five must pass for a PR to merge.

---

## Polish checklist

These are the things the **Polish Pass in M10** addresses. They don't break the build; they make the difference between "demo prototype" and "this feels like a product."

### Universal (every screen)

- [ ] Page has a designed loading state (skeleton, not spinner)
- [ ] Page has a designed empty state (illustration + heading + body + action)
- [ ] Page has a designed error state (inline, with retry where possible)
- [ ] Page renders correctly at 375px (iPhone SE), 768px (iPad), 1024px (iPad landscape), 1440px (desktop)
- [ ] Page has no console errors or warnings in production build
- [ ] Page has no layout shift on load (CLS = 0)
- [ ] Page has a sensible `<title>` and `<meta description>`
- [ ] Page is keyboard-navigable end-to-end (tab order, focus rings, no traps)
- [ ] No placeholder text used as a label
- [ ] No "lorem ipsum" anywhere
- [ ] No "TODO" or "FIXME" visible to users
- [ ] All dates are formatted consistently (relative for recent, absolute for older)
- [ ] All monetary values formatted as "R 1,234,567" (SA convention)
- [ ] All capacity values formatted as "1.2 MW" or "480 kW" (no kilowatts spelled out)

### Forms (every form)

- [ ] Labels above inputs (not placeholder-as-label)
- [ ] Inline validation errors below fields (red text, no toast unless async)
- [ ] Submit button disabled while submitting, with inline spinner
- [ ] Successful submission either navigates away or shows inline success state
- [ ] Required fields marked with subtle indicator (asterisk in `ink-500`, never red)
- [ ] Helper text below input where useful (in `ink-500 text-xs`)
- [ ] Errors are specific ("Email is not in valid format" not "Invalid input")
- [ ] All inputs have correct `autocomplete` attributes
- [ ] Numeric inputs use `inputMode="decimal"` on mobile

### Tables and lists

- [ ] Empty state when no data
- [ ] Skeleton rows while loading
- [ ] Pagination or "load more" if > 25 rows
- [ ] Sortable columns indicate sort direction (chevron icon)
- [ ] Filter state persists in URL query params (deep-linkable)
- [ ] Selected rows have a subtle indicator (left border accent, not background)

### Buttons and interactive elements

- [ ] Hover state on every clickable element
- [ ] Disabled state visually distinct (opacity-40, cursor-not-allowed)
- [ ] Loading state for any button triggering async action (inline spinner replaces icon)
- [ ] Focus ring visible on keyboard navigation
- [ ] Touch target ≥ 44×44px on mobile

### Specific moments worth polishing

These are the demo "wow" moments. Spend extra time here.

- [ ] **Tier progression animation** (Bronze → Silver crossing) — Framer Motion spring, the tier badge upgrades with a brief celebration. Single moment, not over-done.
- [ ] **AI Verification "analysing" sequence** — 6–8s of progressive log lines, shimmer bar, then result reveal with subtle scale-in. Pacing matters; this is the differentiator.
- [ ] **Milestone approval stamp** — when admin approves a submission, a subtle "Approved" stamp animation appears on the milestone card.
- [ ] **SEE.AI first response** — the streaming feels real; the dots animate, then markdown appears character-by-character (or token-by-token, matching the stream).
- [ ] **Dashboard number animation** — on first load, the stats numbers count up from 0 to their value over 600ms (use `useMotionValue` + spring).
- [ ] **Plant dashboard live indicator** — a subtle "live" pulse dot in the corner, refreshing chart data every 5s in demo mode.
- [ ] **Reset Demo Data confirmation** — when admin resets, a full-page overlay with "Resetting demo state..." (2s, fake), then redirect to dashboard with toast "Demo reset complete."
- [ ] **New message arrival in comms** — slide-up animation (200ms), subtle accent flash on the channel sidebar if the message is from another user.
- [ ] **@-mention notification** — the global inbox badge pulses briefly when a new mention arrives via polling.
- [ ] **Milestone thread system messages** — visually distinct from human messages (accent left border, no avatar, "system" badge), animate in on first appearance.
- [ ] **License activation reveal** — paywall lock icon morphs to unlock (300ms), paywall fades, dashboard skeleton fades in, then charts render. ~1.2s total. The single biggest "wow" moment after AI Verification.
- [ ] **EFT instructions modal** — banking details, reference, amount visually distinct. Copy buttons for each (account number, reference). One-click "I've made the payment" leads to POP upload.
- [ ] **Commission credit notification** — appears with a subtle accent flash on the wallet icon in the sidebar; clicking shows the Reseller tab.
- [ ] **Enterprise dashboard transition** — when Sipho logs in, the entire shell shifts subtly (co-branded topbar, narrower sidebar with 4 items, layout reflows to the custom widget grid). The transition shouldn't feel like a different app — same SEE typography, same neutrals, just composed differently.
- [ ] **Enterprise scope addition** — when admin adds a project to an Enterprise scope, the change should propagate visibly in any other open tab within a few seconds (polling cadence). For demo purposes a "data refreshed" toast on the affected dashboards is acceptable; production would use websockets.

### Accessibility audit

- [ ] All interactive elements have accessible names (aria-label or visible text)
- [ ] All form inputs have associated labels
- [ ] Modals trap focus correctly (Radix handles this by default — verify)
- [ ] Modals close on Escape
- [ ] Skip-to-content link at top of page
- [ ] WCAG AA contrast on all text/background combinations (run axe-core via Playwright)
- [ ] Charts have accessible alternatives (data table on hover or behind a toggle)
- [ ] Icons-only buttons have aria-label
- [ ] Forms are completable using screen reader

### Performance pass

- [ ] Lighthouse Performance ≥ 90 on contractor dashboard
- [ ] No image without `next/image` (with explicit width/height)
- [ ] Fonts subset and self-hosted via `next/font/local`
- [ ] No render-blocking third-party scripts
- [ ] Server Components used for above-the-fold content
- [ ] TanStack Query has sensible staleTime to avoid unnecessary refetches
- [ ] Recharts components lazy-loaded (they're heavy)

---

## Demo dry-run script

The literal walkthrough used to verify demo-readiness. Founders run this end-to-end before any live demo. If any step doesn't feel right, fix it before showing anyone.

**Setup:**
- Open the production demo URL in a fresh browser session (or incognito)
- Have a second tab ready with the admin login for the "switch role" moments
- Demo Mode toggle: ON (auto-approvals enabled for narration)

### Act 1 — The pitch (3 min)

**Step 1.** Open landing page (`/`).
*What to look for:* off-white, restrained, wordmark top-left, hero sentence, single CTA. No green anywhere. No solar imagery. Generous whitespace.
*Narrate:* "SEE is the operating system for energy project developers. Stripe-like positioning — infrastructure software, not energy company."

**Step 2.** Click "Sign in" → land on `/login`.
*What to look for:* clean form, Demo Users card below.

**Step 3.** Click "Marcus Adebayo — Contractor (Silver Tier)" demo button.
*What to look for:* one-click sign-in, lands on `/contractor` instantly. No password prompt.

### Act 2 — Contractor hero flow (8 min)

**Step 4.** Land on contractor dashboard.
*What to look for:*
- Stats row: 12 active projects, 4.7 MW capacity, 12,400 tokens, Silver tier
- Numbers count up smoothly on first load
- Pipeline + milestone watch on left
- AI Newsfeed on right with SA renewable energy headlines
- AI Suggestions populated
- Tier badge visible in sidebar (Silver) with progress to Gold
*Narrate:* "This is what an EPC sees first thing. Pipeline status, what needs attention, what's happening in the market."

**Step 5.** Hover the SEE.AI floating button (bottom right). Open it.
*What to look for:* panel slides up smoothly, "SEE.AI" header, clean chat surface.

**Step 6.** Type: "Which of my projects are at risk?"
*What to look for:* streaming response begins within 2s. Real Claude API. Tool call fires to `list_projects_at_risk`. Response mentions Project Alpha and Polokwane specifically.
*Narrate:* "Real AI — Claude under the hood. Context-aware. It knows my portfolio."

**Step 7.** Close the chat. Navigate to Projects.
*What to look for:* grid renders with 12 projects. Hero project (Spaza Soweto Retail Solar PPA) is the first card. Project cards use procedural abstract patterns, not stock photos.

**Step 8.** Click "Spaza Soweto Retail Solar PPA."
*What to look for:* project workspace, Tab A (Overview) opens by default. Project metadata visible. "Sell My Project" button visible (it's a PPA).

**Step 9.** Click "Milestones" tab.
*What to look for:*
- Top: "12 of 23 milestones complete · Currently in Construction phase"
- Vertical timeline grouped by phase
- Development phase: 5 milestones, all approved (one shows v1 rejected + v2 approved in version history)
- Financing phase: 3 approved (one has GOLD badge from expert verification)
- Construction phase: 2 approved (Auto-Gold from marketplace), 1 submitted-under-review, 1 in-progress with RFQ posted, rest locked
- Commissioning phase: all locked

**Step 10.** Click "EIA Report" (approved with rejection history).
*What to look for:* expanded view shows version history. v1 rejected with admin feedback annotations on PDF. v2 approved.
*Narrate:* "Every submission is versioned. When something gets rejected, the contractor sees exactly why — feedback is annotated directly on the PDF. This is the audit trail banks and insurers want."

**Step 11.** Click "Electrical installation" (currently in-progress).
*What to look for:* upload zone, "Verify with AI (1,000 tokens)" button, "Get Expert Verification (10,000 tokens)" button.

**Step 12.** Click "Verify with AI." Confirm.
*What to look for:* full-screen overlay, shimmering progress bar, log lines appearing one by one ("Parsing document structure...", etc.). 6–8 seconds total. Then result reveals with findings list — some checkmarks, some warnings.
*Narrate:* "This is Phase 2's differentiator. AI verification of compliance docs. No other platform does this."

**Step 13.** Close the verification result. Click "Get Service" on the BESS integration milestone.
*What to look for:* modal opens with pre-filled RFQ — category, scope, budget, deadline. The milestone context is already filled in.
*Narrate:* "Need an outside expert for this milestone? Post an RFQ in one click. Anyone hired through the marketplace gets Auto-Gold verification — saves the contractor time and tokens."

**Step 13a.** Close the RFQ modal. Click the comms icon on the Electrical Installation milestone card.
*What to look for:* right-pane comms expands to show `#electrical-installation` thread. Pinned status card at top shows current submission state. Below: system messages from the submission/review cycle, plus a recent @-mention from Marcus to Naledi about the panel schedule. Composer at the bottom.
*Narrate:* "Every milestone has its own conversation thread. Submissions, reviews, mentions — all in one place. Service providers we invite into this thread see only the milestone they're working on, never the financials or client channel."

**Step 13b.** Type a quick reply in the composer and send. Observe within 3 seconds: the message appears in the timeline.
*What to look for:* smooth message appearance, accurate timestamp, your avatar. (Polling cadence — looks real-time in a demo.)

**Step 13c.** Open the topbar Global Inbox icon (envelope).
*What to look for:* panel showing mentions + unread channels across all Marcus's projects. The "Naledi confirm panel schedule" mention is at the top.
*Narrate:* "One inbox for every project conversation across the portfolio. Replaces the dozen Slack workspaces and email threads an EPC currently lives in."

**Step 13d.** Close the inbox. Open cmd+K (or click the search bar). Type "engineer stamp".
*What to look for:* Messages result group shows the EIA rejection feedback message. Click → jumps directly to that message in the EIA thread.
*Narrate:* "Search runs across everything you have access to. The audit trail banks want is just here, by default."

### Act 3 — The ecosystem & commercial model (10 min)

**Step 14.** Navigate to Marketplace. Browse hardware.
*What to look for:* category nav, product grid, WEG inverters have subtle "Recommended" badge. Token discount slider visible on product detail.

**Step 15.** Navigate to Service Center. Show active RFQs and Job Cards (Kanban).
*What to look for:* Mokoena Structural has an active job (Bryanston civil works). Past completed jobs from Project Alpha visible.

**Step 15a.** Navigate back to Projects. Click "Durbanville Retail" (a recently-commissioned project owned by Durbanville Mall — a standard end-client, not Enterprise).
*What to look for:* Tab A (Overview) shows project metadata. Project Stage: Operational. Just commissioned 3 weeks ago.

**Step 15b.** Click Tab C (O&M & Monitoring).
*What to look for:* Paywall screen. Lock icon. "O&M Monitoring is licensed." Two CTAs visible: "Sell to client" (primary, accent) and "Activate for own use" (ghost). Below: three-tier comparison cards (Basic R 350/mo, Premium R 850/mo, AI R 1,800/mo).
*Narrate:* "Once a project is operational, the dashboard is licensed. The EPC has two paths here. They can pay for it themselves to manage the asset — or, the platform-encouraged path, they can sell it to the client and earn a commission."

**Step 15c.** Click "Sell to client". Modal opens.
*What to look for:* three-step flow. Step 1: tier selection (Premium tier highlighted as recommended for retail use case). Step 2: sale price (default = R 850/month). Commission preview: "You'll earn R 170/month."
*Narrate:* "EPCs become resellers. They pitch the dashboard to their client, the platform handles the invoice and reconciliation, the EPC earns recurring commission — and gets their own EPC view bundled in at no extra cost. This is how O&M becomes a revenue stream rather than a cost."

**Step 15d.** Complete the modal (skip the message field or use a one-liner). Click "Send proposal."
*What to look for:* modal closes. Toast: "Proposal sent to Durbanville Mall." The paywall now shows "Proposal pending with client." Notification fires.

**Step 15e.** Open a second tab (or use the role switcher). Log in as the Durbanville Mall account (a standard end-client demo user — added to seed).
*What to look for:* lands on standard end-client portfolio (one site). Notification bell shows new mention. Click → "License proposal from Adebayo Renewables for Durbanville Retail."

**Step 15f.** Open the proposal. Accept it.
*What to look for:* invoice generated. EFT instructions modal opens with banking details (FNB account, branch code, reference like "SEE-INV-0142-A8K2-2026"). POP upload zone. Amount highlighted: R 850.
*Narrate:* "Real SA B2B reality — most serious payments happen via EFT. The platform generates a reference, the client EFTs the amount, uploads proof of payment, admin reconciles against the bank statement."

**Step 15g.** (As Durbanville Mall) Upload any dummy PDF as proof of payment. Submit.
*What to look for:* status now "Awaiting Reconciliation." Toast confirms.

**Step 15h.** Switch to admin tab (Erin's login). Open Reconciliation Queue.
*What to look for:* the new payment is at the top of the queue. POP file viewable. Reference and amount displayed for cross-checking.
*Narrate:* "Admin sees this. They cross-check against the bank statement, enter the bank reference, approve. In production this connects to bank APIs to auto-match."

**Step 15i.** (As Erin) Approve the payment.
*What to look for:* status updates to PAID. Behind the scenes, the license activates. Notifications fire for both Marcus and Durbanville Mall.
*(In Demo Mode, steps 15h-15i are skipped — auto-reconciliation triggers 5 seconds after step 15g.)*

**Step 15j.** Switch back to Durbanville Mall's tab. Navigate to the Durbanville Retail site dashboard.
*What to look for:* the activation animation plays. Lock icon transforms to unlock, paywall dissolves, dashboard skeleton fades in, then charts and data populate. Toast: "Premium License activated for Durbanville Retail."
*Narrate:* "Client sees their dashboard. The investment is now visible — generation, savings, alerts, everything they need."

**Step 15k.** Switch to Marcus's tab. Navigate to Durbanville Retail → Tab C.
*What to look for:* the EPC view of the same site is now live. Different layout — portfolio-management focus. Commission card shows "Earning R 170/month." Wallet badge shows new commission credit.
*Narrate:* "And Marcus, the EPC, sees his version. Different dashboard — same data. Plus the commission credit. He just turned a service obligation into a recurring revenue line."

**Step 16.** Sign out. Sign in as Lerato Mokoena (Service Provider).
*What to look for:* land on `/service-provider`. Different dashboard — opportunity board, job cards.

**Step 17.** Click Opportunity Board.
*What to look for:* RFQs visible including Project Alpha BESS integration. Bid submission flow available.

**Step 18.** Sign out. Sign in as Sipho Dlamini.
*What to look for:* Sipho lands not on a standard end-client portfolio, but on Spaza Holdings's **custom Enterprise dashboard.** The topbar shows `SEE × SPAZA HOLDINGS` (co-branded). The sidebar has only four items: Operations, Reports, Integrations, Admin.
*Narrate:* "Sipho's not a standard end-client. Spaza Holdings is on the platform's Enterprise tier — they negotiated a custom contract for their 47-store retail portfolio. Different commercial relationship, different product."

**Step 19.** Look at the Operations dashboard.
*What to look for:* custom widget layout: portfolio summary at top showing the three operational Spaza sites (Sandton, Soweto, Boksburg — Boksburg only just activated), site comparison chart, maintenance budget card (R 240k of R 500k YTD), carbon target progress (34% toward 50% by 2027), integrated meter data showing actual savings from Spaza's internal smart meters fused with SEE telemetry, alerts feed.
*Narrate:* "Custom widgets per their contract. Their CFO needed a maintenance budget view. Their sustainability officer needed carbon target tracking. Their internal meter data flows into our dashboards. None of this is hard-coded — it's their license configuration."

**Step 19a.** Click Integrations in the sidebar.
*What to look for:* three active integrations — Outbound API (with API key visible, usage counter at 142,847 calls this month, climbing in Demo Mode), Scheduled Exports (daily SFTP to Spaza's internal systems, last run timestamp), Custom Dashboard. Plus an Inbound Feed in CONFIGURED state.
*Narrate:* "Their internal energy management system consumes SEE data via our API. They get scheduled exports to their data warehouse every night. And they're in the middle of connecting their building management system to push meter data back into our platform."

**Step 19b.** Click Admin in the sidebar.
*What to look for:* Sipho is ENTERPRISE_ADMIN. Sees four seats: himself, Thandi (CFO, finance role), James (Ops director), Aisha (executive viewer). Contract details: SOW-001, started 8 months ago, quarterly review, next review in 1 month. Invoice list with itemised line items (base R 25k + 4 seats × R 1.5k + 3 integrations + R 75 API usage = R 41.5k + VAT).
*Narrate:* "Different team members see different views. The CFO doesn't see operational alerts. The site manager doesn't see the financial budget. Role-based access on a per-widget basis. And the bill is itemised — Enterprise customers want to see exactly what they're paying for."

**Step 19c.** *(Optional, depending on demo length)* Sign out, sign back in as Thandi Mthembu.
*What to look for:* Thandi lands on the same Operations dashboard layout, but the maintenance budget card is visible (financial role) while the alerts feed and integrated ops data are hidden. Different role, different view of the same custom dashboard.
*Narrate:* "Same dashboard config, different widget visibility per role. The data layer is shared, the access is fine-grained."

**Step 20.** Sign out. We need a standard-tier client view for contrast. Sign in via demo button as... actually, let's stay on Marcus's tab for now (he's the EPC, he sees both worlds).

**Step 20a.** Switch back to Marcus's tab. Navigate to Spaza Sandton in his projects.
*What to look for:* his project workspace. Tab C O&M is unlocked (EPC view bundled). But the tier badge says **Enterprise** instead of Basic/Premium/AI. A subtle banner: "This client is on an Enterprise contract. Contact admin for contract details." No "Sell to client" CTA visible.
*Narrate:* "From Marcus's perspective, Spaza is just an Enterprise client. He gets his operational dashboard like usual, but he doesn't see Spaza's custom widgets, doesn't see their internal meter data, doesn't see their internal team. That's commercially private. His commission's still flowing — let's check."

**Step 20b.** Click into Marcus's Wallet → Reseller tab.
*What to look for:* standard self-serve commissions listed (Kruger Farm AI tier R 360/month, etc.). Then a separate row: "Spaza Holdings (Enterprise) — variable monthly, ~R 4,150/month" with a different visual treatment.
*Narrate:* "Negotiated 10% commission on Spaza's Enterprise contract. Lower percentage than self-serve, but the contract value is much higher, so Marcus earns more per month from this one client than from all his self-serve commissions combined."

**Step 20c.** Navigate to Kruger Farm project (Marcus's other operational AI-tier client).
*What to look for:* his EPC view of an AI License tier site. Prescriptive Maintenance alert visible ("Inverter 2 efficiency trending down — schedule cleaning"). Commission card: "Earning R 360/month."
*Narrate:* "Compare and contrast — Kruger Farm is a standard AI-tier client. Self-serve pricing, predictable commission, prescriptive maintenance unlocked because they're on AI. Different commercial register, different feature set."

### Act 4 — Governance & Enterprise admin (5 min)

**Step 21.** Sign out. Sign in as Erin Berman-Levy (Admin).
*What to look for:* admin dashboard. Queue counts visible (5 KYC pending, 12 submissions pending, 3 reconciliation items pending).

**Step 21a.** Click "Enterprise Accounts" in the sidebar.
*What to look for:* overview page. Active Enterprise licenses count, total Enterprise MRR (R 47k+ from Spaza alone), MoM growth, upcoming reviews. Table shows Spaza Holdings.
*Narrate:* "The platform's commercial team lives here. Enterprise customers, contracts, integrations, MRR. Spaza's contract is up for quarterly review in a month."

**Step 21b.** Click Spaza Holdings → detail page.
*What to look for:* sub-tabs (Overview, Projects, Integrations, Seats, Usage, Invoices, Notes). On Overview: contract reference, pricing breakdown, computed MRR. Projects tab shows current scope: just Spaza Sandton initially.
*Narrate:* "This is where commercial conversations happen. When Spaza wants to add a new site, or add seats, or upgrade a tier, we manage it here. Right now their scope is one site. Let's add another."

**Step 21c.** On Projects tab, click "Add project to scope" → select Spaza Boksburg from the list of Spaza's operational projects.
*What to look for:* confirmation: "Spaza Boksburg has no active O&M license. Adding it to Enterprise scope will activate Enterprise coverage immediately — Sipho's team will see this site in their dashboard. Adebayo Renewables's negotiated Enterprise commission rate (10%) will apply to the increased contract value." Confirm.
*Narrate:* "Spaza Boksburg has been operational for 4 weeks but doesn't have an O&M license yet — it was waiting to be added to the Enterprise contract. We do it here in one step. Sipho's Enterprise dashboard will now include Boksburg. Marcus's reseller commission on Spaza increases to reflect the larger contract value."

**Step 21d.** Optional — flip back to Sipho's tab, refresh. Spaza Boksburg now appears in the Enterprise dashboard portfolio summary.

**Step 22.** Navigate to Submissions Queue.
*What to look for:* the electrical installation submission from Project Alpha is in the queue.

**Step 23.** Click the submission. PDF preview with annotation tool opens.
*What to look for:* PDF viewer, annotation tools, required artefacts checklist, approve/reject/request-info actions.
*Narrate:* "Admin reviews submission, can annotate directly on the PDF, approve or reject with structured feedback."

**Step 24.** Approve the submission.
*What to look for:* toast "Submission approved", notification fires (visible in bell), milestone status changes on the project (verifiable in a second tab as Marcus).

**Step 25.** Navigate to "Templates."
*What to look for:* milestone template builder. List of 4 active templates + 1 wind template. Versioning visible.
*Narrate:* "Compliance changes — admins update the templates. New projects get the new version; active projects stay on their snapshotted version. No breakage."

### Act 5 — Wrap (1 min)

**Step 26.** Switch back to Marcus's tab. Show the just-approved milestone now reflecting "Approved" status with subtle animation.

**Step 27.** Open SEE.AI: "Generate a portfolio overview I can send to a new client."
*What to look for:* streaming response with a structured draft pulling real numbers from the seed data.

**Step 28.** Close everything. Sign out. End.

---

## Pre-demo checklist

Run this within 2 hours of any live demo:

- [ ] Demo URL loads in < 3s
- [ ] All four demo logins work
- [ ] Seed data is in canonical state (run Reset Demo Data if unsure)
- [ ] SEE.AI responds to a test prompt
- [ ] No browser console errors on dashboard
- [ ] Production deployment is on `main`, not a feature branch
- [ ] Demo Mode toggle is ON
- [ ] Screen-share resolution tested (most issues show at 1080p+ projector resolution)
- [ ] Browser zoom at 100%
- [ ] Browser extensions disabled (or use incognito)
- [ ] Strong internet on the demo machine
- [ ] Backup: have the staging URL as a fallback in case production has issues
- [ ] Backup: have screenshots of every key moment in case of network failure mid-demo

---

## Known-acceptable rough edges

For honesty: these are things the prototype doesn't do well, and that's OK. Don't try to fix them — they'd take real engineering time that the production build will properly address.

- **PDF "downloads" are fake** — button → "downloading..." → no file. If anyone clicks the download, it's a brief animation only. In-app HTML invoice rendering IS real and printable via browser.
- **PayFast checkout is mocked** — redirects to a fake gateway page that returns success after 2s.
- **EFT reconciliation is real flow, but no bank API** — POPs are uploaded, admin manually approves (or auto-approves in Demo Mode). Production swaps in bank API integration for auto-matching.
- **Commission payouts are tracked but not actually paid** — admin marks batches as paid; in production this triggers an EFT batch file or bank API push.
- **Recurring license billing is manual** — admin can trigger a "run monthly invoicing" action in Configuration to generate next month's renewal invoices. Production: scheduled job.
- **Email verification is via Resend test mode** — emails go to a test inbox, not the user's real address. For demos with non-technical observers, use the demo login buttons.
- **Real-time O&M data is replayed** — not actual live telemetry. Charts refresh every 5s in demo mode by stepping through pre-seeded data.
- **Notifications are not pushed** — they appear on page navigation, not via WebSocket.
- **The Wind template is empty** — it exists in the admin list but no project uses it.
- **Some Solar Ace and BN Solar dashboard data is light** — they're context, not the hero. Demo from Marcus's perspective.

If asked directly about any of these in a demo, the honest answer is: "That's a production integration — for the prototype we mocked the UX. The shape is correct; the substrate gets built in the Phase 1 commercial build."

---

## What "done" looks like

The prototype is demo-ready when:

1. The dry-run script above runs end-to-end with no apologies needed.
2. A founder can hand the demo URL to a stranger and watch them poke around for 10 minutes without breaking anything embarrassing.
3. SEE.AI handles 5 different reasonable questions about the seeded data without hallucinating.
4. Every screen called out in `04_FEATURE_SPEC.md` is reachable from navigation.
5. Mobile demo on an iPad works for the contractor hero flow specifically (other roles can be desktop-only).
6. The Reset Demo Data button reliably returns to canonical state.

When all six are true, ship.
