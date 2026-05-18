# 04 — Feature Specification

Screen-by-screen specification, organised by milestone (M0–M10 in `BUILD_PLAN.md`). Each section describes layout, behaviour, data, and acceptance criteria.

When in doubt about look-and-feel, defer to `02_DESIGN_SYSTEM.md`. When in doubt about a data shape, defer to `03_DATA_MODEL.md`.

---

## Global app shell (used by all authenticated screens)

**Sidebar (left, 240px desktop, collapsible to 64px, hidden on mobile):**

- SEE wordmark at top, links to current-role dashboard
- Primary nav (role-dependent — see per-role sections)
- Bottom: tier badge (clickable → tier progression detail), wallet balance with token coin icon
- Collapse toggle at the bottom

**Topbar (sticky, 56px height):**

- Breadcrumb (current page hierarchy)
- Global search (cmd+k modal) — searches projects, milestones, providers, hardware, messages
- Role switcher (if user has multiple memberships) — dropdown showing all roles
- **Global Inbox** envelope icon with unread badge — opens panel of mentions + unread channels across all projects (M4.5)
- Notifications bell with unread count
- Profile menu (account, settings, sign out)

**SEE.AI floating button (bottom-right, persistent):**

- 48px circle, accent-500
- Click opens chat panel (380px wide desktop, full-screen mobile)
- See M10 for chat detail

---

## Auth flows (M2)

### Landing page (`/`)

Public, marketing-led. See design system §8.1 — restrained, off-white, wordmark top-left, single hero sentence, single CTA.

**Layout:**
- Hero: "the operating system for energy project developers" — `text-4xl` semibold, max two short paragraphs of supporting copy in `ink-600`
- CTA: "Request access" (primary button) + "Sign in" (ghost button)
- Three feature sections below the fold (Compliance / Marketplace / Intelligence) — each a single card, generous whitespace
- Footer: minimal — wordmark, three links, copyright

### Login page (`/login`)

Centred form card `max-w-sm`.

- Email input
- Password input
- "Sign in" button (primary)
- "Forgot password?" link
- "Sign in with Google" / "Sign in with Microsoft" (only visible when env vars set)

Below the card, a separate **"Demo users"** card (clearly labelled as such, no attempt to disguise) with four buttons:

- Marcus Adebayo — Contractor (Silver Tier)
- Lerato Mokoena — Service Provider
- Sipho Dlamini — End-Client
- Erin Berman-Levy — Platform Admin

Clicking any of these performs a one-click sign-in (no password prompt). This is the demo path; production removes this card via env flag.

### Registration (`/register`)

Multi-step wizard:

1. Account: email, password, name → email verification sent
2. Company: name, type (Contractor / Service Provider / Client), registration no.
3. KYC upload: CIPC document, VAT certificate, Director ID (drag-drop zone, file validation)
4. Submitted state: "Verification pending" — landing in a holding pattern with tutorial available

Each step has progress indicator at top. KYC step has a "Skip for now — limited access" option that lands the user on a restricted-mode dashboard.

### Email verification (`/verify-email`)

Shows tokens earned for completing onboarding actions (Watch Tutorial +100, Create a Project +100, Service Request +100) per the Journey doc.

---

## Contractor role (M3, M4 — the hero)

### Sidebar nav

- Dashboard
- Projects
- Service Center
- Marketplace (Hardware)
- Wallet & Rewards
- Company Profile

### Dashboard (`/contractor`)

The first impression. Must convince an investor in 5 seconds.

**Layout:**

```
┌───────────────────────────────────────────────────────────┐
│ STATS ROW (4 cards, no shadows, pure typography)         │
│ Projects │ Capacity │ Tokens │ Tier                       │
│ 12 active│ 4.7 MW  │ 12,400 │ Silver                     │
└───────────────────────────────────────────────────────────┘

┌──────────────────────────────┬────────────────────────────┐
│ PIPELINE                     │ AI NEWSFEED                │
│ Total / Active / Completed   │ Curated SA renewable       │
│ + Revenue in Escrow          │ energy headlines           │
│ + Portfolio capacity         │ (scrollable, 6-8 visible)  │
├──────────────────────────────┤                            │
│ MILESTONE WATCH              │                            │
│ "EIA for Project Alpha       │                            │
│  rejected — view feedback"   │                            │
│ "Structural for Project Beta │                            │
│  completed by SP"            │                            │
├──────────────────────────────┤                            │
│ PLANT NOTIFICATIONS          ├────────────────────────────┤
│ "Site X underperforming 15%" │ AI SUGGESTIONS             │
│ "Bad weather Site Y tmrw"    │ "No maintenance scheduled  │
│ "Inverter error Site Z"      │ at Site X — performance    │
├──────────────────────────────┤ trending down. Schedule?"  │
│ UPCOMING EVENTS              │ "Bad weather forecast for  │
│ Calendar list (next 7 days)  │ Site Y — preserve battery?"│
└──────────────────────────────┴────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│ TASKS / TO-DO LIST                                        │
└───────────────────────────────────────────────────────────┘
```

**Components:**

- **Stats row**: numbers in `text-3xl semibold ink-900`, label in `text-xs uppercase tracking-widest ink-500`. No icons.
- **Pipeline card**: bar/funnel showing Total → Active → Completed; revenue figure in `text-2xl`; portfolio capacity in MW/MWh
- **Milestone Watch**: list of 3–5 items with status badge, project name, action link
- **Plant Notifications**: similar — distinguish operational vs prescriptive vs maintenance with subtle status colours
- **AI Newsfeed**: cards with thumbnail, title, source, time-ago. Pre-curated content rotating.
- **AI Suggestions**: stubbed but designed to look intelligent — each suggestion has a "Apply" or "Dismiss" action
- **Upcoming Events**: list with date, project, event type
- **Tasks**: checkbox list, can be checked off

**Top-right "Generate Company Profile" button** — clicking opens a modal: "Generates a branded PDF aggregating completed projects, total carbon saved, certifications. Costs 1,000 tokens." Confirm → 2s "generating..." animation → "Downloaded" toast (mocked PDF, see M10 polish).

### Company Profile (`/contractor/company`)

Tabs: **KYC & Compliance** | **Profile & Identity** | **Banking** | **Settings**

**KYC & Compliance tab:**
- Status banner at top: "Compliant" (green badge) / "Action required" (amber)
- List of compliance documents: BEEE Certificate, Tax Clearance, Director IDs, Professional Indemnity Insurance, Licenses & Certifications
- Each row: name, status (verified / expired / pending), upload date, expiry date, action (re-upload)
- "Upload document" button → drag-drop modal
- Compliant Project counter: contributes to tier progression

**Profile & Identity tab:**
- Company logo upload
- About text
- Website
- Phone, email
- Operating provinces (multi-select chips)
- "Corporate Identity Pack" download (mocked PDF)

**Banking tab:**
- Bank name (dropdown)
- Account holder
- Last 4 digits (only stored / shown)
- Bank statement upload (last 3 months)
- "Add bank account" button

**Settings tab:**
- Usage limits based on package (Free / Pro / Enterprise per Journey doc)
- Subscription tier display + "Upgrade" CTA
- API access keys (scaffolded, disabled for prototype)
- Members of the company (list of users + roles)

### Projects Grid (`/contractor/projects`)

**Layout:**
- Filter bar at top: Stage (Dev / Financing / Construction / Commissioning / Operational), Location (province dropdown), Capacity range, Search
- Toggle: Grid view / List view
- "New Project" primary button top-right
- Grid: 3 columns desktop, 2 tablet, 1 mobile

**Project card:**
- Abstract project pattern at top (procedural — varies by project) — never a stock solar photo
- Project name, client name (or "Confidential")
- Location chip, technology chip (Solar PV / Wind / BESS / Hybrid)
- Capacity: "1.2 MW + 600 kWh storage"
- Stage badge with colour (Dev = ink, Financing = amber, Construction = blue, Operational = green-like-ink — but no actual green)
- Last updated relative ("3 days ago")
- Progress bar (milestone completion %)
- Hover: subtle border darken, no scale

**Empty state** (no projects yet): centred illustration + heading "No projects yet" + body "Start by creating your first project or uploading an existing one. You'll earn 100 tokens for your first project, or 1,000 for an existing project import." + two CTAs.

### New Project wizard (`/contractor/projects/new`)

Three-step wizard with progress at top.

**Step 1 — Client & Site:**
- Is client an existing platform user? Yes/No
- If Yes: search → pick. If No: client name, contact email
- Site address (geocoded preview if Google Maps configured, otherwise free text)
- City, Province, country (default SA)

**Step 2 — Technical Classification:**
- Technology (radio): Solar PV / Wind / BESS / Hybrid
- Grid Connection Status: Grid-Tied / Off-Grid / Grid-Tied with Backup
- System Size (kW input)
- Storage Size (kWh input, optional)

**Step 3 — Commercial Deal:**
- Deal Structure (radio): Outright Purchase / PPA / Lease
- Contract Value (ZAR input, optional)
- If PPA: tariff (R/kWh)
- Client needs & motivations (textarea)

**On submit:**
- Logic engine selects milestone template based on inputs (see `lib/milestone-templates.ts`)
- Project is created
- Milestones are instantiated from template
- User is redirected to project workspace Tab B (Milestones)
- +100 tokens awarded (or +1,000 if marked as existing project import)

**Quick Upload (existing project) option** on Step 1: shows a streamlined form for already-completed or in-progress projects, with bulk milestone import.

### Project workspace (`/contractor/projects/[id]`)

Three tabs + a comms pane: **Overview** | **Milestones** | **O&M & Monitoring** | (comms pane on the right)

**Layout note:** The project workspace uses a two-pane layout on desktop. Left pane (flex-grow) holds the active tab's content. Right pane (collapsible, default 400px wide) is the **comms pane** — channels sidebar + active channel timeline. Users can collapse it (icon-only sidebar continues to show unread dots) or expand it to fill the screen when the focus is on a conversation. On mobile, the comms pane becomes a separate full-screen view accessed via a chat icon in the tab bar.

See `08_COMMUNICATIONS.md` for full comms UI spec. The tabs below describe the left pane only.

#### Tab A — Overview & Configuration

Read-mostly view of project metadata, with inline edit on each card.

- Project name (editable)
- Client info card (client name, contact, internal notes)
- Site info card (address, coordinates, irradiance KWh/m²/day if available)
- Technical card (technology, size, grid status)
- Commercial card (deal structure, value, PPA tariff if applicable)
- Client needs & motivations card (textarea)
- **Sell My Project** button (only visible if PPA/Lease) — links to M6 listing flow, AI-valuation preview shown

#### Tab B — Milestones (the heart of the platform)

**Layout:**
- Top: progress summary — "12 of 23 milestones complete · Currently in Construction phase"
- Vertical timeline of milestones, grouped by Project Stage (Development / Financing / Construction / Commissioning)
- Each milestone is a card with:
  - Status badge (Locked / Available / In Progress / Submitted / Under Review / Action Required / Approved / Auto-Gold)
  - Name (e.g., "EIA Report", "Structural Engineering Assessment")
  - Description
  - Required artefacts (chips: "EIA Report (PDF)", "Engineer Stamp Letter (PDF)")
  - Submission status if started
  - Due date if set
  - Actions: "Upload submission" / "View submission" / "Get Service" (links to RFQ) / "Verify with AI" (1,000 tokens) / "Get Expert Verification" (10,000 tokens)
- Locked milestones are visually disabled (`opacity-40`) with a lock icon — they unlock when prior milestones approved

**Submission flow:**
- Click "Upload submission"
- Modal: upload zone, version notes, optional textarea
- Submit → status changes to "Under Review"
- Notification fires to admin

**Get Service flow:**
- Click "Get Service" on a milestone where contractor can't fulfil internally
- Modal: pre-filled RFQ with milestone context (category, scope, deadline)
- "Post RFQ" → +100 tokens, RFQ goes live in marketplace, status of milestone updates to "Service Requested"
- When SP completes and uploads deliverable, milestone auto-receives submission marked Auto-Gold
- When SP accepts the job, they auto-join the milestone's thread channel (see `08_COMMUNICATIONS.md`)

**Milestone ↔ comms integration:**
Each milestone card shows a comms icon with an unread badge counting unread messages in the milestone's thread channel. Clicking it focuses the right-pane comms on that thread directly — no navigation away from the project workspace. Milestone state changes (submitted, verified, approved, rejected) auto-post system messages to the thread.

**Verify with AI:**
- Confirm token cost
- 2–4s "AI Verification Agent analysing..." animation (shimmer + brief log lines like "Parsing document structure", "Cross-referencing milestone requirements", "Validating signatures")
- Result: PASS / FAIL with structured findings
- See `06_AI_INTEGRATION.md` for the stub response generator

**Get Expert Verification:**
- Confirm token cost (10,000)
- Submission goes to expert queue
- For demo: admin role can act as expert and complete the review
- Returns colour-coded quality rating (RED / AMBER / GREEN / GOLD)

#### Tab C — O&M & Monitoring

**Locked until Project Stage = Operational.** Shows a placeholder "Available after commissioning" with link to current stage.

Once Operational, the dashboard is **paywalled by an O&M license** (see `09_PAYMENTS_AND_LICENSING.md`). The contractor sees one of four states:

1. **No EPC license, no Client license:** Paywall with two CTAs — "Sell to client" (primary, accent — the platform's preferred commercial path) and "Activate for own use" (ghost). Below: three-tier comparison cards (Basic / Premium / AI).
2. **Client license active (EPC view bundled):** Full EPC dashboard. EPC sees no charge; this comes free with the resold client license. Wallet shows incoming commission.
3. **EPC license active (Flow B):** Full EPC dashboard. EPC is paying directly.
4. **Client on Enterprise contract:** Full EPC dashboard (same view as state 2). An **Enterprise** badge replaces the tier badge. A subtle banner: "This client is on an Enterprise contract. Contact admin for contract details." The "Sell to Client" CTA is gone. The Reseller tab in the EPC's wallet shows the negotiated Enterprise commission for this project (variable monthly, based on the client's actual usage).

**The EPC view** (when active, regardless of who paid) — different from the client view, optimised for portfolio management:
- Performance summary card: current generation, vs expected, vs last month
- Maintenance log: completed and upcoming
- Prescriptive alerts (AI tier only): predictive failure warnings, cleaning recommendations
- Commission card (when EPC is reseller): "You earn R X/month commission on this client"
- Upsell card: if client is on Basic tier, surfaces "Premium would unlock historical analytics — propose upgrade?"
- Multi-brand selector tabs (WEG / Victron / SunSynk / Deye) showing normalised view
- Charts: production today, performance vs irradiance, self-consumption ratio, battery SoC

**Selling to client flow** (Flow A, the demo moment):
- Click "Sell to client" → modal opens
- Step 1: Choose tier (Basic / Premium / AI) — cards with feature comparison, monthly fee, commission rate
- Step 2: Set sale price (default = platform list price, contractor can adjust within bounds)
- Step 3: Add personal note to client
- Submit → license created in PENDING_PAYMENT status; offer sent to client
- Client receives in-app notification + email with license proposal
- Until client responds: paywall remains, but EPC sees "Proposal pending with [client name]"

**On client acceptance + payment:**
- Both dashboards activate simultaneously
- EPC sees activation animation in their Tab C
- Toast: "License sold. Commission of R [X]/month credited to your wallet."
- New Notifications: one for the EPC ("Commission active"), one for the client ("Dashboard activated")

### Service Center / Job Cards (`/contractor/service-center`)

**View:**
- Active RFQs (the ones the contractor has posted) — list with category, milestone link, bid count
- Active Job Cards (RFQs that have been awarded) — Kanban: Active / Pending Review / Completed
- Past Jobs — completed work, link to deliverable

**RFQ detail:**
- Scope of work
- Bids tab: list of bids with provider rating, amount, estimated days, proposal text. Accept / Reject actions.
- On accept: confirmation modal showing escrow lock amount (subtract from wallet fiat) → JobCard created

### Marketplace — Hardware (`/contractor/marketplace`)

**Layout:**
- Category nav: Solar Panels / Batteries / Inverters / Generators / Accessories
- Filter sidebar: manufacturer, price range, in-stock toggle
- Product grid (3 cols desktop)
- Search bar top

**Product detail page:**
- Image, specs table, manufacturer, model
- Price in ZAR
- Stock indicator
- Token discount eligible: "Apply up to X tokens to save R Y"
- Add to cart / Buy now

**Cart:**
- Items list with qty adjust
- Subtotal
- Token discount slider (apply 0 to max-eligible tokens)
- Cashback preview ("You'll earn 240 tokens on this purchase at your Silver tier")
- **Payment rail choice** (revealed on Checkout): EFT default for orders ≥ R10k, PayFast default for orders < R10k. Either can be chosen. See `09_PAYMENTS_AND_LICENSING.md` for the flows.
- "Checkout" → rail-specific flow (PayFast mock redirect OR EFT instructions + POP upload)

### Wallet & Rewards (`/contractor/wallet`)

The full commercial picture for the EPC. Three tabs: **Balance** | **Reseller (Licenses I've Sold)** | **Transactions**

**Balance tab:**
- **Fiat balance** card: current balance, escrow holds, pending incoming
- **Token balance** card: token count, recent earn/spend
- **Recurring commission** card: monthly run-rate from active client licenses, next payout date
- Tier progress card: visual ladder showing Bronze → Silver → Gold → Platinum, current position, projects to next tier
- Cashback rate: "You earn 10% cashback at Gold tier"

**Reseller tab** (new — the commission story):
- Headline numbers: total lifetime commission earned, this month, this year
- "Licenses I've sold" table:
  - Client name, project, license tier, monthly fee, your commission, status (Active / Awaiting / Lapsed), next billing date
- "Upsell opportunities" section: existing operational sites where no client license exists OR client is on Basic and could move up — each shows estimated commission uplift + "Propose to client" CTA
- "Commission payouts" sub-section: historical payouts from platform, statuses, EFT references

**Transactions tab:**
- Unified view across tokens, fiat, commissions
- Filter by type / direction / date range
- Each row: date, type, amount, description, related entity link
- Outgoing payments to platform (license fees, AI verifications, hardware orders), incoming commission credits, incoming cashback, token earns/spends

**Pay Invoices section** at top of Balance tab:
- Outstanding invoices count + total amount
- Click → invoice list with status badges (Awaiting Payment / Awaiting Reconciliation / Paid)
- Click an awaiting-payment invoice → opens the payment flow (EFT or PayFast)

---

## Service Provider role (M7)

### Sidebar nav

- Dashboard
- Opportunity Board
- Job Cards
- Profile
- Wallet

### Dashboard (`/service-provider`)

- Stats: Revenue earned, active jobs, win rate, on-time performance
- Today's tasks
- New opportunities matching profile
- Reviews carousel

### Opportunity Board (`/service-provider/opportunities`)

- Filter by category
- List of open RFQs matching SP's categories
- Each card: project name, location, scope summary, budget, deadline, bid count so far
- Click → RFQ detail with "Submit Bid" CTA

### Bid submission modal:
- Proposal text (markdown editor)
- Amount (ZAR)
- Estimated days
- Submit → status SUBMITTED

### Job Cards Dashboard (`/service-provider/job-cards`)

Kanban view: Bids Submitted / Active / Pending Review / Completed & Paid

Each card: project link (limited access), deliverable status, escrow amount, days remaining

### Job Card detail (`/service-provider/job-cards/[id]`)

- Scope of work
- Project link (granular: SP sees site plans + soil reports but NOT financial PPA data)
- Deliverable upload zone with version history
- Submit deliverable → status → Pending Review
- Chat thread (linked to this job card only)

### Profile (`/service-provider/profile`)

- Editable service provider profile
- Categories (multi-select)
- Hourly rate
- Service areas
- Licences (uploads)
- Public profile preview (what contractors see in directory)

---

## End-Client role (M8)

### Sidebar nav

- Plant Dashboard
- Portfolio (if >1 site)
- O&M Schedule
- Documents
- Wallet

### Onboarding flow

End-client lands first time: handover document repository (commissioning certs, EIA reports, warranties), access control to view their project(s), tutorial walkthrough.

### Plant Dashboard (`/client/plant/[siteId]`)

**This is the polished hero site. Other sites can be representative.**

**Paywall state:** If no active Client-view license for this site, dashboard is locked. See `09_PAYMENTS_AND_LICENSING.md` §"Client side paywall" for the locked-state UI:
- "Contact my installer" CTA (primary — encourages Flow A, the channel partner path)
- "Activate myself" CTA (ghost — direct activation, Flow C)
- Tier comparison cards below

**Active state (license live):**

**Layout:**
- Site name, address, capacity at top
- Live status indicator (Green/Amber/Red) — based on current performance vs expected
- License tier badge (Basic / Premium / AI) + "Managed by [EPC name]" if EPC is reseller

**Charts (Recharts):**
- **Production today** — line chart, hourly granularity, current hour highlighted, expected band overlay
- **Battery state of charge** — area chart, last 24h
- **Performance vs irradiance** — scatter, last 30 days
- **Self-consumption ratio** — donut, last month
- **Multi-brand selector** — tabs at top: WEG / Victron / SunSynk / Deye — all show the same normalised view (this is the demo of brand-agnostic normalisation)

**Alerts panel (right side):**
- Recent events: maintenance done, alerts triggered
- For AI License sites: Prescriptive Maintenance suggestions ("Inverter 2 efficiency dropped 3% this week → schedule cleaning")

**Performance metrics row:**
- Daily yield (kWh)
- CO₂ saved (kg)
- Revenue earned (R) — if PPA
- Self-consumption %

### Portfolio Dashboard (`/client/portfolio`)

Multi-site overview for clients with multiple installations.

- Map view at top showing all sites (use Mapbox or a free alternative; for demo a static SVG SA map with site dots is acceptable)
- Aggregate stats: total capacity, total production, total CO₂ saved
- Site table: name, location, capacity, current performance, license tier, action link

### O&M Schedule (`/client/o-and-m`)

- Calendar view (month/week toggle)
- Upcoming maintenance events
- "Create event" → modal: type, date, description, attachments, share-via-email toggle
- Past events log

### Documents (`/client/documents`)

Repository view: commissioning certificates, EIA reports, warranties, O&M reports, performance summaries. Grouped by project.

### Enterprise client experience (M8 + M9)

When a logged-in user is an `EnterpriseSeat` of a company holding an active `EnterpriseLicense`, the entire client experience above is **replaced** by an Enterprise-specific layout.

**Sidebar nav (Enterprise) — replaces the standard end-client nav:**
- Operations (default landing)
- Reports
- Integrations
- Admin *(visible only to ENTERPRISE_ADMIN seats)*

The Wallet is hidden — billing is handled outside the self-serve flow (admin invoicing). Documents and O&M Schedule are accessible from within Operations.

**Operations (`/client/enterprise/operations`):**

The custom Enterprise dashboard. Renders from `EnterpriseLicense.customDashboardConfig` — see `09_PAYMENTS_AND_LICENSING.md` for the data shape. Layout is data-driven; the prototype hard-codes one realistic layout for Spaza Holdings:

- **Portfolio summary card** spanning the top — three sites (Soweto, Sandton, Boksburg), total capacity, total production today, total carbon avoided this month
- **Site comparison chart** — production vs expected across all three sites, last 30 days
- **Maintenance budget card** — YTD spend vs annual budget (R 240k spent of R 500k annual budget)
- **Carbon target progress** — custom KPI: progress toward Spaza's 50% renewable target by 2027
- **Integrated data feed** — Spaza's internal smart meter data fused with SEE telemetry, showing actual energy savings (real numbers, not estimates)
- **Alerts feed** — prescriptive across all sites, with severity filtering
- **Custom widgets** — anything else the dashboard config specifies

Branding follows `EnterpriseLicense.brandingConfig`: Spaza's logo appears beside the SEE wordmark in the topbar; accent colour may deviate to Spaza's brand (still constrained — no green, etc.). The platform doesn't disappear (no full white-label for the prototype); the brand is **co-branded**.

**Reports (`/client/enterprise/reports`):**

- List of available reports — monthly performance, quarterly carbon, annual maintenance summary, custom reports per their license
- Each clicks through to an HTML report (mocked PDF for download)
- "Schedule report" — schedule monthly delivery to internal stakeholders (mocked configuration)

**Integrations (`/client/enterprise/integrations`):**

This is what makes Enterprise visible as a product. Shows the client's active integrations:

- **Outbound API access:**
  - API endpoint base URL: `https://api.see.platform/v1/enterprise/{tenant-id}`
  - Active API keys: list with name, created date, last used, "Rotate" button (visual rotation only — generates new key string, no real auth)
  - "View documentation" link (placeholder)
  - Rate limit info (e.g., "1,000 requests per minute")
  - Usage this month: 47,392 calls (incrementing in Demo Mode)

- **Webhooks:**
  - List of configured webhook endpoints with name, URL, event types subscribed, last delivery status, last delivery timestamp
  - "Add webhook" button → modal with event-type checkboxes (alert raised, milestone hit, threshold breached, performance anomaly), endpoint URL, secret for signature verification (mocked)
  - "Test webhook" button per row (visual confirmation only — no real delivery)

- **Scheduled exports:**
  - Active jobs: name, schedule (daily/weekly/monthly), format (CSV/JSON), destination (S3 / SFTP / endpoint), last run, status
  - "Download last export" — mocked download button

- **Inbound feeds:**
  - Active sources: source name, type (e.g., "Spaza smart meter network"), last sync, record count
  - Configuration UI (mocked — shows current config in read-only state with "Contact platform" CTA to modify)

**Admin (`/client/enterprise/admin`)** — *visible to ENTERPRISE_ADMIN role only:*

- **Seats management:**
  - List of internal users with role badge, last active, status
  - "Invite seat" button — modal with email, role selection (Admin / Finance / Ops / Viewer)
  - Per-seat edit / deactivate actions
  - Seat usage indicator: "Using 4 of 10 seats. Adding more increases monthly fee."
- **Contract details:** (read-only)
  - Contract reference
  - Start date, end date, review cadence, next review date
  - Pricing components breakdown
  - Contact platform link for changes
- **Invoices:**
  - Standard invoice list, but invoices show itemised Enterprise line items (base fee, per-seat subtotal, per-integration breakdown, usage breakdown)
  - "View / Download" for each
- **Usage this period:**
  - Live counters per metric (API calls, webhook deliveries, data exports)
  - Projected end-of-month billing preview

**Role-based access:**
- ENTERPRISE_ADMIN: full Operations + Reports + Integrations + Admin
- ENTERPRISE_FINANCE: Operations (financial widgets visible, ops widgets hidden) + Reports + Admin/Invoices section only
- ENTERPRISE_OPS: Operations (ops widgets visible, financial widgets hidden) + Reports + Integrations (read-only)
- ENTERPRISE_VIEWER: Operations (read-only, all widgets visible per dashboard config) + Reports

Implementation: each widget in the custom dashboard config has a `visibleToRoles` array. The renderer checks the current seat's role against this list. Default if unspecified: visible to all roles.

---

## Platform Admin role (M6)

### Sidebar nav

- Dashboard
- KYC Queue
- Submissions Queue
- **Reconciliation Queue** (new — EFT proofs of payment awaiting review)
- Users & Companies
- **Enterprise Accounts** (new — Enterprise license management)
- Templates
- Financial & Escrow
- Disputes
- Helpdesk
- Configuration

### Dashboard (`/admin`)

- System stats: total users, total projects, total transactions, platform fees collected
- Queue counts: KYC pending (X), submissions pending (Y), disputes open (Z)
- Recent activity feed
- Quick actions

### KYC Queue (`/admin/kyc`)

- Pending submissions table: company name, type, submitted date, action
- Click row → detail panel with documents (PDF preview), submitted data
- Actions: Approve / Reject (with reason) / Request more info (with reason)

### Submissions Queue (`/admin/submissions`)

- Pending milestone submissions table
- Click row → review panel:
  - Project / milestone context
  - Submitted artefacts (PDF viewer with annotation tool — `react-pdf` + custom annotation overlay)
  - Required artefacts checklist (automated check against rules)
  - Approve / Reject (with feedback annotations highlighted on the PDF) / Request more info
- Decision triggers notification to contractor

### Reconciliation Queue (`/admin/reconciliation`)

EFT payments awaiting admin reconciliation. Modelled on the KYC queue pattern.

- Pending payments table: payer company, invoice number, amount, reference, POP uploaded date, age
- Filter by amount range, age
- Click row → reconciliation panel:
  - Invoice detail (line items, amount)
  - POP file preview (PDF viewer or image)
  - Expected: amount + reference (highlighted for easy bank-statement matching)
  - Bank statement reference input (admin enters the actual reference from their bank statement)
  - Approve / Dispute / Request more info actions
- Approve → payment marked PAID → downstream effect triggers (license activates, escrow funds, hardware order confirms, etc.) → user notified
- Dispute → payment status DISPUTED, payer notified with reason, dispute thread opened
- **Demo Mode:** items auto-approve after 5 seconds; admin sees them flow through queue for the demo narrative

### Financial & Escrow (`/admin/financial`)

Read-only view for the prototype, expanded scope:
- Total escrow balance across platform
- Total fiat in custody (invoiced but not yet reconciled)
- Active escrow holds (table)
- Recent payments (last 50)
- Platform fee summary
- Commission payout batch view (next batch, items ready to pay, total amount)
- "Run commission payout batch" button (admin marks batch as in-progress; in production triggers EFT batch file)

### Users & Companies (`/admin/users`)

- Table of all users / companies
- Search, filter by role / tier / status
- User detail: memberships, login history, role assignment, ban/unban
- Tier override controls

### Enterprise Accounts (`/admin/enterprise`)

Commercial team's view — Enterprise contract management. The most "platform-as-business" surface in admin.

**Overview (`/admin/enterprise`):**
- KPI row: active Enterprise licenses, total Enterprise MRR, MoM growth, average license value, upcoming reviews
- Table of active licenses: client company, contract reference, start date, MRR (computed), status, next review, action
- "New Enterprise License" button → activation wizard (see below)

**Activation wizard (`/admin/enterprise/new`):**

Multi-step form per `09_PAYMENTS_AND_LICENSING.md` §"Activation flow (admin-only)":
- Step 1: Client company (search existing or invite new)
- Step 2: Contract details (reference, dates, review cadence, notes)
- Step 3: Pricing components (base fee, per-seat fee, per-integration toggles & rates, usage rates, one-time setup)
- Step 4: Reseller (optional EPC + negotiated commission rate)
- Step 5: Project scope (which of the client's projects are covered)
- Step 6: Initial integrations to enable
- Step 7: Review & activate

On activation: status → ACTIVE, related CLIENT-viewer OmLicenses → SUPERSEDED_BY_ENTERPRISE, first invoice generated.

**License detail (`/admin/enterprise/[id]`):**

Sub-tabs:
- **Overview** — contract summary, pricing breakdown, status, computed MRR for this license
- **Projects** — covered projects (add/remove via project picker)
- **Integrations** — list of EnterpriseIntegrations; per-row config / pause / activate; "Add integration" button
- **Seats** — list of internal users, roles, status; admin can deactivate seats; per-seat metadata visible
- **Usage** — this-month-to-date metrics, historical usage charts, billing preview
- **Invoices** — historical Enterprise invoices for this license, statuses, downloads
- **Notes** — freeform contract notes editor (markdown)

**Demo Mode special:** "Run monthly billing for [client]" button on license detail page — generates next month's invoice on-demand, useful for demonstrating itemised Enterprise billing during a live demo.

### Templates (`/admin/templates`)

The Milestone Template Configuration UI.

- Template list: name, version, status, last edited
- "New Template" → builder:
  - Template name
  - Selection rules (Technology, size range, deal structures)
  - Items list (drag-reorderable):
    - For each: order, phase, name, description, hard gate toggle, required artefacts (add/remove)
- Versioning: editing creates Version N+1; old Version N stays active for projects already using it
- Activate / Deactivate toggle

### Disputes (`/admin/disputes`)

Empty for the prototype; scaffold only with a "No active disputes" state and an example dispute viewable for demos.

### Helpdesk (`/admin/helpdesk`)

Ticket list (scaffolded with 2-3 example tickets).

### Configuration (`/admin/configuration`)

- Tier progression rules (editable thresholds)
- Cashback rates per tier
- Token earning amounts
- Notification engine settings
- Feature flags (Demo Mode toggle, etc.)

---

## Cross-role components

### Project Communications (M4.5)

Per-project channels, threads, mentions, attachments. See `08_COMMUNICATIONS.md` for full spec. Surfaces in three places:

- **Inside each project workspace** — right-pane comms with channel sidebar and active channel timeline
- **Global Inbox** — topbar envelope icon → panel showing mentions and unread channels across all the user's projects
- **Cmd+K search** — message results group, filtered by accessible channels

The `JobMessage` chat pattern from earlier service-provider workflows is replaced by milestone-thread membership in M4.5: when a service provider's job becomes active, they auto-join the milestone's thread as a `GUEST`.

### SEE.AI Assistant chat (M10)

See `06_AI_INTEGRATION.md` for full spec.

### Demo Mode toggle

Available in admin Configuration and as a developer-mode keyboard shortcut (cmd+shift+D). When on:
- Submitted milestones auto-approve after 30s
- New RFQs auto-receive 2 bids after 60s
- Tier progression banner can be triggered manually
- "Reset demo data" button visible

### Notifications drawer

Triggered from topbar bell.
- Tabs: All / Unread
- List of notifications with type icon, title, body, time-ago, link
- Mark all as read action
- Settings cog → notification preferences

### Global search (cmd+k)

- Modal with input
- Recent items
- Results grouped by type: Projects / Milestones / Companies / Hardware / News
- Keyboard navigable

### Empty states

Every list view has a designed empty state per design system §Empty state.

---

## Acceptance criteria per milestone

These are the demo-readiness checks. Each milestone is "done" when:

**M0:** Project boots, lints, builds, deploys to Vercel. Landing page renders correctly. CI green.

**M1:** `prisma db seed` runs cleanly. All 4 roles can log in. Dashboard for each role shows seeded data. `npm run db:reset && npm run db:seed:demo` returns to canonical state.

**M2:** Authentication works (real and demo paths). Role-based routing enforced. KYC submission ends in pending state. Email verification reaches Resend test.

**M3:** Contractor dashboard renders with all six widgets populated from real DB. Tier badge and wallet balance update correctly. Company Profile fully editable.

**M4:** Projects grid lists seeded projects. New project wizard creates a project with correctly instantiated milestones AND a ProjectWorkspace with default channels + milestone threads. Tab B milestones reflect actual project. Milestone submission flow end-to-end works (upload, review queue entry).

**M4.5:** Every project has a workspace with channels populated. Send/receive messages with 3s polling latency. Threading works. Attachments upload via existing pipeline. @-mentions trigger inbox badges. Service Provider auto-joins milestone thread when JobCard active. Client invite flow works (invited client sees `#client` only). Milestone state changes post system messages. Cmd+K search returns message results.

**M5:** AI Verification triggers stubbed response with realistic animation. Expert Verification queues correctly. Tier crosses thresholds and animates. Gold Standard certificate "downloads" (mock PDF). Verification results post system messages to the milestone's comms thread.

**M6:** Admin can approve KYC, approve milestone submissions, edit templates, view financial dashboard.

**M7:** RFQ flow end-to-end: contractor posts → SP bids → contractor accepts → JobCard created → SP uploads deliverable → milestone receives Auto-Gold submission. Hardware marketplace browseable, cart works, mock checkout completes.

**M8:** Plant dashboard renders Recharts with seeded O&M data. Multi-brand tabs all show normalised view. O&M scheduler creates events.

**M9:** EFT and PayFast rails both functional end-to-end. Invoice generation works on all payment triggers. Admin reconciliation queue receives EFT POPs and approves correctly. Demo Mode bypass auto-reconciles in 5s. O&M licenses activate three ways: EPC self-licenses, EPC sells to client (commission credits to EPC wallet), client self-licenses. License paywall correctly locks both EPC and Client O&M dashboards. Activation animation works. Hardware checkout offers rail choice and works on both. Wallet shows fiat, tokens, and commission balances; Reseller tab shows licenses sold and upcoming payouts. **Enterprise tier:** activation wizard creates EnterpriseLicense + project scopes + initial integrations; Spaza Holdings's Enterprise dashboard renders with custom widgets, integrations UI, seat management; itemised Enterprise invoice generates correctly with base + seats + integrations + usage line items; EPC view of Spaza projects shows Enterprise badge with negotiated commission visible in Reseller tab.

**M10:** SEE.AI Assistant answers contextually (uses real Claude). Polish pass complete: every screen has empty/loading/error states, keyboard nav works, mobile responsive, demo dry-run completes without issues.
