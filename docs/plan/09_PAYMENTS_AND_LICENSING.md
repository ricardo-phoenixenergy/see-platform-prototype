# 09 — Payments & Licensing

The commercial substrate of the platform: how money moves, how O&M is licensed, how EPCs earn reseller commissions, how invoices and proofs of payment work in the South African B2B reality.

This file consolidates what was previously split across the wallet section and O&M references. Payments and licensing are tightly intertwined — license activations *are* payments — so they're documented together.

---

## Two-rail payment model

South African B2B reality: **EFT is the primary payment rail.** Card payments (PayFast) are for retail and low-value transactions. Most platform money movement happens via EFT.

| Rail | Used for | Why |
|---|---|---|
| **EFT** | O&M license activations, escrow deposits for service jobs over R5,000, hardware orders over R10,000, platform fee invoicing | SA B2B norm; no card fees on large amounts; how contractors actually pay each other |
| **PayFast** | Token purchases, small hardware orders (under R10,000), monthly subscription fees, AI verification fees over fiat (where applicable) | Real-time confirmation; suits low-value high-frequency transactions; familiar UX |

**Threshold logic** (`lib/payments/rail.ts`):
```ts
export function suggestPaymentRail(amountCents: number, purpose: PaymentPurpose): PaymentRail {
  if (purpose === 'TOKEN_PURCHASE') return 'PAYFAST'
  if (purpose === 'SUBSCRIPTION_FEE') return 'PAYFAST'
  if (amountCents < 1_000_000) return 'PAYFAST'  // under R10,000 default to PayFast
  return 'EFT'  // R10,000+ default to EFT
}
```

Users can override the suggested rail at checkout. Some clients prefer EFT regardless of amount; some prefer PayFast even for large amounts. Both are offered.

---

## EFT flow

The hardest part to make legible. End-to-end:

```
1. User triggers a payment-required action
   (e.g., "Activate O&M Premium License", "Pay invoice INV-2026-0142")

2. Platform generates an Invoice
   - Line items
   - Subtotal + VAT (15%) + total
   - Auto-generated reference (e.g., "SEE-INV-A8K2-2026")
   - PDF mocked (real data shape — SARS-compliant header, VAT no., date, etc.)

3. User chooses "Pay via EFT" → "EFT instructions" modal opens
   - Banking details displayed prominently
   - Reference highlighted (copy button)
   - Amount highlighted
   - Instruction text: "Pay R X to the account above. Use reference [REF] so we can match your payment. Then upload your proof of payment below."
   - POP upload zone

4. User makes the EFT in their own banking app, then returns
   - Uploads proof of payment (bank confirmation PDF or screenshot)
   - Submits → Payment status: AWAITING_RECONCILIATION

5. Platform admin reviews in reconciliation queue
   - Sees: invoice, POP file, reference, expected amount, payer details
   - Cross-references against bank statement (manual in prototype; production: bank API or CSV import)
   - Marks reconciled → triggers downstream effect (license activated, escrow funded, hardware order confirmed, etc.)

6. User notified
   - In-app notification + email
   - Invoice status updates to PAID
   - The action that needed the payment completes (license unlocks, etc.)
```

### Demo Mode bypass

In Demo Mode (toggled in admin Configuration), step 5 auto-completes after 5 seconds with the admin shown as a system user. The full flow is visible — POP upload, reconciliation animation — but the presenter doesn't wait.

**Critical for demo legibility:** the bypass shouldn't hide the mechanic, it should just speed it up. The reconciliation animation runs, the admin reconciliation queue still receives the item (visible if the presenter switches to admin view), and the activation animation triggers visibly. The point is "this is how it works in production, sped up for demo."

### POP upload

Uses the existing `<FileUploader>` component (purpose: `proof_of_payment`). Restrictions: PDF, PNG, or JPG; max 5MB. Stored alongside the `Payment` record.

### Reference generation

```ts
// lib/payments/reference.ts
export function generatePaymentReference(invoiceNo: string): string {
  // Short, human-readable, copy-friendly, collision-resistant within practical scope
  const random = generateAlphanumeric(4).toUpperCase()
  const year = new Date().getFullYear()
  return `SEE-${invoiceNo.split('-').pop()}-${random}-${year}`
}
```

References appear in the EFT instructions modal, on the invoice, in the admin reconciliation queue, and on the bank statement (in production). They're how payments get matched.

---

## PayFast flow

Standard hosted-checkout pattern. For the prototype, mocked:

1. User triggers payment → invoice generated as above
2. User chooses "Pay via PayFast" → redirect to mocked PayFast gateway page (an in-prototype route at `/payments/payfast-mock`)
3. Mock page shows: amount, description, "Pay Now" / "Cancel" buttons (in PayFast's visual style — but clearly marked as a mock at the top)
4. "Pay Now" → 2s "processing..." animation → redirect back to the originating page with success
5. Payment record marked PAID immediately; downstream effects trigger

No real PayFast integration. The mock returns success ~95% of the time, failure ~5% (configurable in Demo Mode) so the failure handling can be demonstrated.

---

## Payment state machine

```
       INITIATED
           │
           ├──[user chose PayFast]──▶ PROCESSING ──▶ PAID
           │                                  │
           │                                  └─▶ FAILED
           │
           └──[user chose EFT]──▶ AWAITING_PROOF
                                       │
                                       ▼
                                 PROOF_UPLOADED
                                       │
                                       ▼
                              AWAITING_RECONCILIATION ──▶ PAID
                                       │              │
                                       └─[admin]──────┴─▶ DISPUTED
                                       │
                                       └─[expires after 7 days]──▶ EXPIRED
```

States exposed in UI; transitions strictly server-controlled.

---

## Invoices

Every payment maps to an `Invoice`. Invoices are issued by:

- **The platform** to a user company (license fees, AI verification fees, expert verification fees, marketplace platform fees, hardware orders, subscription fees)
- **An EPC** to their client (for client-pays-for-license flows — the EPC is reselling, so the client's contract is technically with the EPC; platform issues a separate commission invoice to the EPC)

### Invoice data shape (SARS-compliant)

```ts
type Invoice = {
  id: string
  invoiceNumber: string         // SEE-INV-2026-0142 (sequential, per issuer)
  issuerType: 'PLATFORM' | 'COMPANY'
  issuerCompanyId: string?      // null if PLATFORM
  recipientCompanyId: string
  recipientDetails: {
    name: string
    registrationNumber: string?
    vatNumber: string?
    address: string
  }
  lineItems: InvoiceLineItem[]
  subtotalCents: number
  vatRate: number               // 0.15 for SA standard rate
  vatCents: number
  totalCents: number
  status: InvoiceStatus
  issuedAt: Date
  dueDate: Date
  paidAt: Date?
  notes: string?
}

type InvoiceLineItem = {
  description: string
  quantity: number
  unitPriceCents: number
  totalCents: number
  metadata: {
    type: 'OM_LICENSE' | 'AI_VERIFICATION' | 'EXPERT_VERIFICATION' | 'PLATFORM_FEE' | 'HARDWARE' | 'SUBSCRIPTION' | 'COMMISSION_PAYOUT'
    relatedEntityId?: string
  }
}
```

### Invoice PDF (mocked)

PDF generation is mocked in the prototype (per existing decision). But the data shape above is correct — when production generates a real PDF, no schema changes needed. The "Download invoice" button shows a 2s "generating..." animation then a toast.

The invoice **detail view in-app** is real, though — full invoice rendered as HTML, looks like a SARS-compliant tax invoice, can be printed via browser. This gives the demo something to show without real PDF generation.

---

## Enterprise tier (sales-led product line)

The Basic / Premium / AI tiers above are **self-serve** — fixed monthly fee per site, standardised dashboard, click-through agreement. They cover most clients.

Large enterprise clients are commercially different. They want their existing operations infrastructure (SCADA, BMS, ERP, internal BI) connected to the platform, they want custom dashboards for their own internal stakeholders, and they negotiate pricing rather than picking a tier. That's a separate product line: **Enterprise.**

### Two product lines, not four tiers

| | Self-serve (Basic/Premium/AI) | Enterprise |
|---|---|---|
| **Pricing** | Fixed monthly fee per site, published | Negotiated — base + per-seat + per-integration + usage |
| **Dashboards** | Standardised | Custom layouts, custom KPIs, co-brandable |
| **Integrations** | None | API access, webhooks, scheduled exports, optional inbound feeds |
| **Activation** | Self-serve via UI | Platform admin activates after MSA + SOW signing |
| **Sold by** | EPCs (Flow A) or clients themselves (Flow C) | Platform commercial team (sales-led) |
| **Contract** | Click-through ToS | MSA + per-engagement SOW |
| **Internal users** | One viewing account | Multiple seats with role-based access |
| **Billing transparency** | Single line item | Itemised invoice — base, seats, integrations, usage |

**Mutually exclusive per project.** A project's client either has a self-serve license or an Enterprise license — never both simultaneously. The upgrade path is a sales conversation, not a UI button.

### Why the EPC view doesn't change

When a client moves to Enterprise, the EPC's experience stays the same operationally:
- Same EPC O&M dashboard (Tab C view)
- Same prescriptive alerts
- Same commission tracking
- Same maintenance workflow

What changes for the EPC:
- An **Enterprise** badge appears on the project (replacing the AI/Premium/Basic tier badge)
- The standard "Sell to Client" CTA is gone — replaced by a "This client is on an Enterprise contract" notice with a link to admin for contract details
- Commission rate is **negotiated per Enterprise contract**, not derived from the standard formula. Typically a lower percentage but on a much larger base, so usually higher absolute commission
- No visibility into the client's Enterprise environment — the EPC doesn't see the client's custom dashboards, their integrations, their internal seats, their usage data. That's the client's commercial property.

This separation is deliberate. Enterprise clients may store sensitive data (grid arbitrage strategy, financial forecasts, other generation assets) the EPC has no commercial right to see. The boundary is enforced at the access layer, not just the UI.

### Three integration capabilities

Enterprise licenses can enable any combination of:

**Outbound (SEE → client systems):**
- REST API with rotating keys, scoped to the client's projects
- Webhooks fired on events (alert raised, milestone hit, threshold breached)
- Scheduled CSV/JSON exports to client's S3 / SFTP / endpoint
- Real-time streams via MQTT or similar (rare, for clients with their own SCADA)

**Inbound (client systems → SEE):**
- Client's own telemetry fused with SEE's collection
- Client's maintenance history imported
- Client's financial data linked (so revenue dashboards use actuals, not estimates)

**Custom in-platform:**
- Bespoke dashboard layouts and widgets
- Client-defined KPIs and alert thresholds
- White-label / co-brand option (client's logo on their dashboard, optional sub-domain like `spaza.see.platform`)
- Role-based access for the client's internal team (e.g., CFO sees financial view, site manager sees ops view, executive sees portfolio view)

Different clients want different combinations. The schema (below) tracks which are active per license; pricing reflects which are enabled.

### Pricing structure

Rather than a single monthly fee, Enterprise pricing has structured components:

```ts
{
  baseMonthlyFeeCents: 2_500_000,           // R 25,000/month base
  perSeatMonthlyFeeCents: 150_000,          // R 1,500/seat/month
  perIntegrationMonthlyFeeCents: {
    OUTBOUND_API: 350_000,                  // R 3,500/month
    INBOUND_FEED: 800_000,                  // R 8,000/month
    CUSTOM_DASHBOARD: 500_000,              // R 5,000/month
    REALTIME_STREAM: 1_200_000,             // R 12,000/month
    WHITE_LABEL: 400_000,                   // R 4,000/month
  },
  usageRates: {
    apiCallsPer1000Cents: 50,               // R 0.50 per 1,000 API calls
  },
  contractStartDate: ...,
  contractEndDate: ...,
  reviewCadence: 'QUARTERLY' | 'ANNUAL',
  notes: '...'                              // freeform contract terms
}
```

Monthly invoices generated computationally:
```
total = baseMonthly
      + (activeSeats × perSeatMonthly)
      + Σ(activeIntegrations × perIntegrationMonthly)
      + Σ(usageThisMonth × usageRate)
```

Each component appears as its own line item on the invoice. Itemised transparency is a feature enterprise customers expect — it's part of why they pay the premium.

### Commercial flow

Sales-led, with admin involvement at activation. The full flow (production):

1. Client signals interest — existing self-serve client outgrowing tier, or a large prospect coming in pre-Enterprise
2. Platform commercial team has discovery conversation
3. Scoping: which integrations? How many seats? Custom dashboard scope? Implementation timeline?
4. Quote produced — base + per-integration + per-seat + one-time setup
5. MSA + SOW signed
6. Platform admin creates EnterpriseLicense in admin tooling (this is the prototype touchpoint)
7. Implementation team configures integrations and dashboards (out of scope for prototype)
8. Monthly billing per the SOW with usage components computed at billing time

For the **prototype**, the demo-able pieces are:
- The admin's Enterprise Accounts management UI
- The client's custom Enterprise dashboard (one demo client — Spaza Holdings — gets a real custom layout)
- The client's own admin section (managing their internal seats, viewing their API keys, configuring their integrations — most mocked)
- The EPC's view of an Enterprise client (badge, no upsell CTA, negotiated commission visible in Reseller tab)

### Schema additions

Three new models, plus modifications to existing `OmLicense`:

```prisma
// =========================================================================
// ENTERPRISE LICENSING
// =========================================================================

model EnterpriseLicense {
  id                          String          @id @default(cuid())
  clientCompanyId             String          // the enterprise client
  status                      EnterpriseLicenseStatus @default(DRAFT)

  // Contract
  contractReference           String          @unique     // e.g., "MSA-2025-014 / SOW-001"
  contractStartDate           DateTime
  contractEndDate             DateTime?
  reviewCadence               ReviewCadence
  nextReviewDate              DateTime?

  // Pricing components (cents)
  baseMonthlyFeeCents         Int
  perSeatMonthlyFeeCents      Int             @default(0)
  perIntegrationFees          Json            // { OUTBOUND_API: 350000, ... } — keyed by IntegrationType
  usageRates                  Json            // { apiCallsPer1000Cents: 50, ... }
  oneTimeSetupFeeCents        Int             @default(0)
  oneTimeSetupInvoiced        Boolean         @default(false)

  // Commercial relationship to a reseller EPC (if any)
  // Even Enterprise clients may have come via an EPC who earns commission;
  // commission is negotiated separately rather than formula-driven
  resellerCompanyId           String?
  negotiatedCommissionRate    Float?          // e.g., 0.10 (10%) — may be lower than self-serve rate

  // Customisation
  customDashboardConfig       Json?           // serialised dashboard layout for this client (see below)
  brandingConfig              Json?           // { logoUrl, primaryColor, customSubdomain, ... }

  notes                       String?         // freeform — contract terms summary

  clientCompany               Company         @relation("EnterpriseLicensesHeld", fields: [clientCompanyId], references: [id])
  resellerCompany             Company?        @relation("EnterpriseLicensesResold", fields: [resellerCompanyId], references: [id])
  projectScopes               EnterpriseProjectScope[]
  integrations                EnterpriseIntegration[]
  seats                       EnterpriseSeat[]
  usageRecords                EnterpriseUsageRecord[]

  createdAt                   DateTime        @default(now())
  updatedAt                   DateTime        @updatedAt
  activatedAt                 DateTime?
  cancelledAt                 DateTime?

  @@index([clientCompanyId, status])
  @@index([resellerCompanyId])
}

enum EnterpriseLicenseStatus {
  DRAFT                 // admin creating, not yet active
  PENDING_SETUP         // contract signed, awaiting implementation team
  ACTIVE
  SUSPENDED             // payment overdue / contract dispute
  CANCELLED
  EXPIRED
}

enum ReviewCadence {
  QUARTERLY
  SEMI_ANNUAL
  ANNUAL
}

// Which projects this Enterprise license covers
// (an Enterprise contract may cover the client's entire portfolio, or a subset)
model EnterpriseProjectScope {
  id                  String              @id @default(cuid())
  licenseId           String
  projectId           String

  license             EnterpriseLicense   @relation(fields: [licenseId], references: [id], onDelete: Cascade)
  project             Project             @relation(fields: [projectId], references: [id])

  @@unique([licenseId, projectId])
}

model EnterpriseIntegration {
  id              String              @id @default(cuid())
  licenseId       String
  type            IntegrationType
  status          IntegrationStatus   @default(CONFIGURED)
  config          Json                // type-specific config (endpoint URL, API key ref, schedule, etc.)
  lastActivityAt  DateTime?           // last successful exchange
  monthlyFeeCents Int                 // copied from license at activation; may diverge if negotiated

  license         EnterpriseLicense   @relation(fields: [licenseId], references: [id], onDelete: Cascade)

  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
}

enum IntegrationType {
  OUTBOUND_API
  OUTBOUND_WEBHOOK
  SCHEDULED_EXPORT
  REALTIME_STREAM
  INBOUND_FEED
  CUSTOM_DASHBOARD
  WHITE_LABEL
}

enum IntegrationStatus {
  CONFIGURED          // set up but not yet exchanging data
  ACTIVE              // exchanging data
  ERROR               // last attempt failed
  PAUSED              // intentionally disabled
}

// Enterprise client's internal users (seats)
model EnterpriseSeat {
  id              String              @id @default(cuid())
  licenseId       String
  userId          String              // the User record for this seat
  seatRole        EnterpriseSeatRole
  isActive        Boolean             @default(true)

  license         EnterpriseLicense   @relation(fields: [licenseId], references: [id], onDelete: Cascade)
  user            User                @relation(fields: [userId], references: [id])

  createdAt       DateTime            @default(now())
  deactivatedAt   DateTime?

  @@unique([licenseId, userId])
}

enum EnterpriseSeatRole {
  ENTERPRISE_ADMIN     // can manage seats, integrations, view everything
  ENTERPRISE_FINANCE   // sees financial views; no ops detail
  ENTERPRISE_OPS       // sees operational views; no finance detail
  ENTERPRISE_VIEWER    // read-only across configured views
}

// Usage metering for usage-based pricing components
model EnterpriseUsageRecord {
  id              String              @id @default(cuid())
  licenseId       String
  period          DateTime            // e.g., 2026-06-01 = June 2026
  metric          UsageMetric
  units           Int                 // e.g., API call count
  billedCents     Int                 // computed at billing time

  license         EnterpriseLicense   @relation(fields: [licenseId], references: [id], onDelete: Cascade)

  @@unique([licenseId, period, metric])
}

enum UsageMetric {
  API_CALLS
  WEBHOOK_DELIVERIES
  DATA_EXPORTS_GB
}
```

**Patches to existing models:**

```prisma
model OmLicense {
  // ...existing fields
  // Add this state to handle the supersession when client moves to Enterprise:
  // OmLicenseStatus enum gains a new value: SUPERSEDED_BY_ENTERPRISE
  // The CLIENT-viewer OmLicense for a project moves to SUPERSEDED_BY_ENTERPRISE
  // when an EnterpriseLicense covering that project becomes ACTIVE.
  // The EPC-viewer OmLicense remains ACTIVE (bundled).
  supersedingEnterpriseId  String?
  supersedingEnterprise    EnterpriseLicense? @relation("OmLicensesSuperseded", fields: [supersedingEnterpriseId], references: [id])
}

model Company {
  // ...existing fields
  enterpriseLicensesHeld    EnterpriseLicense[] @relation("EnterpriseLicensesHeld")
  enterpriseLicensesResold  EnterpriseLicense[] @relation("EnterpriseLicensesResold")
}

model Project {
  // ...existing fields
  enterpriseScopes   EnterpriseProjectScope[]
}

model User {
  // ...existing fields
  enterpriseSeats   EnterpriseSeat[]
}
```

### Custom dashboard config

`EnterpriseLicense.customDashboardConfig` stores a serialised dashboard layout per Enterprise client. For the prototype, this is hand-crafted in the seed for Spaza Holdings — a JSON structure describing widgets, layout grid, KPIs.

Production would have a dashboard builder UI; prototype hard-codes one realistic layout to demonstrate the concept.

Example shape:
```ts
{
  layout: 'portfolio',  // 'portfolio' | 'single-site' | 'financial' | 'custom'
  widgets: [
    { type: 'portfolio_summary', position: [0, 0, 12, 2], config: { showCarbon: true, showRevenue: true } },
    { type: 'site_comparison', position: [0, 2, 8, 4], config: { metric: 'production_vs_expected' } },
    { type: 'maintenance_budget', position: [8, 2, 4, 4], config: { ytdSpendCents: 24000_00 } },
    { type: 'custom_kpi', position: [0, 6, 6, 2], config: { name: 'Carbon target progress', formula: '...' } },
    { type: 'integrated_data', position: [6, 6, 6, 2], config: { source: 'spaza_internal_meters' } },
  ],
  branding: { logoUrl: '/seed/spaza-logo.svg', primaryColor: '#2A45CC' }  // can deviate from SEE brand
}
```

A React component (`<EnterpriseDashboard config={customDashboardConfig} />`) renders this. The widgets are real components; the layout is data-driven.

### Activation flow (admin-only)

Enterprise activation lives in admin tooling, not in any self-serve flow:

1. Admin navigates to **Enterprise Accounts** in admin sidebar
2. Clicks "New Enterprise License"
3. Multi-step form:
   - Step 1: Client company (search existing, or invite new)
   - Step 2: Contract details (reference, dates, review cadence, notes — free-form for terms summary)
   - Step 3: Pricing components (base fee, per-seat, per-integration toggles & rates, usage rates)
   - Step 4: Reseller (optional — if an EPC sourced this client, choose them and set negotiated commission rate)
   - Step 5: Project scope (which of the client's projects this license covers)
   - Step 6: Initial integrations (which to enable; configuration can be added later)
   - Step 7: Review & activate
4. On activation:
   - EnterpriseLicense status → ACTIVE
   - Related projects' CLIENT-viewer OmLicenses transition to SUPERSEDED_BY_ENTERPRISE
   - Related projects' EPC-viewer OmLicenses remain ACTIVE (bundled)
   - First invoice generated (base fee + setup fee if applicable, prorated for partial first month)
   - Notifications to client admin user, reseller EPC (if any)
   - Custom dashboard becomes accessible to client's seats

### Admin's Enterprise Accounts view

New section in admin sidebar between **Users & Companies** and **Templates**:

```
/admin/enterprise
  ├── overview            Active licenses, total MRR from Enterprise, MoM growth
  ├── [licenseId]         Per-license detail
  │     ├── overview      Contract, pricing, status
  │     ├── projects      Scope (covered projects)
  │     ├── integrations  Active integrations, configurations, last activity
  │     ├── seats         Internal users of this client
  │     ├── usage         Monthly usage records, billing preview
  │     ├── invoices      Historical invoices for this license
  │     └── notes         Contract terms, internal notes
```

This is where commercial teams live — managing contracts, configurations, renewals.

### Enterprise client's experience

When a user is an `EnterpriseSeat` (regardless of role) and logs in:

- They land on a **custom dashboard** (rendered from `customDashboardConfig`) instead of the standard client portfolio view
- They see only the projects in their license's scope
- The branding may reflect the Enterprise client's identity (logo, accent — but typography and base structure stay SEE's, so the platform isn't unrecognisable)
- A new sidebar section: **Operations** (default view), **Reports**, **Integrations**, **Admin** (the last only for ENTERPRISE_ADMIN role)

**Admin section** for Enterprise seats:
- Seats management: add/remove internal users, set their roles
- Integration management: view configured integrations, last activity timestamps, API keys (with rotate buttons), webhook endpoints, "Test" buttons (mostly mocked)
- Usage: this-month-to-date counters per metric, projected billing
- Invoices: same view as standard clients but with itemised Enterprise line items

### Commission for Enterprise resellers

If an EPC sourced an Enterprise client, they're still a reseller — but the commission is negotiated, not formula-driven:

- `EnterpriseLicense.negotiatedCommissionRate` stores the rate (e.g., 0.10 = 10%)
- Each month, when billing runs:
  - Total billed amount for the Enterprise license is calculated
  - Commission = (total billed) × (negotiated rate)
  - A `LicenseCommission` row is created against the reseller EPC, marked with a metadata field `source: 'ENTERPRISE'`
- The EPC's wallet shows the commission alongside their self-serve license commissions
- The Reseller tab in their wallet shows Enterprise commissions separately, since the dynamics are different (variable monthly amount based on the client's actual usage)

### API gateway (mocked for prototype)

A real Enterprise tier requires:
- API key issuance, rotation, scoping per client
- Rate limiting per key
- Usage metering
- An actual API surface serving Enterprise tenant data

For the prototype:
- API keys are visible in the client's Integrations UI (string of the form `sk_ent_spaza_a8k2m4...`) — generated at activation, not actually functional
- "Rotate key" button works (UI updates to new string, old one struck through)
- Usage counters are pre-populated in the seed and increment by a fake cron in Demo Mode (e.g., +500 API calls every 30 seconds) so the demo shows "live" usage
- Webhook endpoints are listed but no requests actually fire
- No real API endpoints are built

Production would build out a real Enterprise API. The prototype's job is to demonstrate the *commercial shape* of the offering.

---

## O&M Licensing (the paywall)

The commercial heart of post-installation. O&M dashboards are licensed; without a license, they're locked.

### License model

| Tier | Monthly fee | Features |
|---|---|---|
| **Basic** | R 350/month per site | Live monitoring dashboard, production data, basic alerts (status only) |
| **Premium** | R 850/month per site | Basic + multi-brand normalization, historical analytics, automated monthly reports, scheduled maintenance calendar |
| **AI** | R 1,800/month per site | Premium + Prescriptive Maintenance (predictive alerts), AI-suggested actions, weather-aware battery optimization, performance benchmarking against similar sites |

(Numbers are placeholders — the proposal calls these out as Phoenix decisions. Easy to adjust.)

### Two viewer types, two licenses

Each project (post-commissioning) supports up to two active O&M licenses simultaneously:

- **EPC view license** — held by the contractor company; unlocks the EPC's O&M tab for that project (Tab C in the project workspace). Different dashboard than the client view: portfolio management focus, upsell prompts, commission tracking.
- **Client view license** — held by the end-client company; unlocks the End-Client Plant Dashboard for that site. Asset-owner focus: their generation, their savings, their carbon avoided.

Both are sold at the same three tiers, but they're different SKUs serving different purposes.

### The three commercial flows

#### Flow A: EPC sells to client (the primary path, encouraged by commercials)

The EPC is the channel. They've installed the system, they have the relationship, they pitch the dashboard to the client.

1. EPC navigates to the operational project, hits the locked client dashboard view
2. EPC clicks "Sell to client" → modal: choose tier (Basic / Premium / AI), set sale price (defaults to platform recommended)
3. EPC adds client contact, sends → client receives email + in-app notification with a license proposal
4. Client reviews proposal → accepts → invoice issued (by the **platform**, on the EPC's behalf, with EPC's branding option)
5. Client pays via EFT (typical) or PayFast
6. On payment confirmed:
   - **Client license activates** — Plant Dashboard unlocks for the client
   - **EPC license activates as a bundled side-effect** — EPC's O&M view for this project unlocks (free, because they're managing the asset)
   - **Commission credited to EPC** — a commission line item appears in the EPC's wallet (paid out monthly per recurring license fee)
7. Both dashboards now live. Recurring monthly billing kicks in.

The commission rate is configurable per platform/EPC contract (default in seed: 20% of monthly license fee). For prototype: simple flat % stored on the license record.

#### Flow B: EPC self-licenses

Client doesn't want the dashboard (or doesn't know they want it yet). EPC still needs the data to deliver maintenance.

1. EPC hits locked EPC-view dashboard
2. EPC clicks "Activate for own use" → choose tier → invoice issued (platform → EPC)
3. EPC pays
4. EPC license activates → EPC view unlocked
5. Client view remains locked (client sees a "Your EPC manages this site — request your own dashboard" prompt if they log in)
6. EPC pays monthly. No commission (no resale happened).

#### Flow C: Both license independently

Edge case — rare in practice but supported. EPC self-licenses, then client also wants the dashboard but doesn't go through the EPC (perhaps they were referred by the platform directly). Both pay separately. No commission to EPC.

### State machine per license

```
   INACTIVE (never activated)
        │
        ├──[paid first month]──▶ ACTIVE ◀──┐
        │                          │       │ [renewal paid]
        │                          ▼       │
        │                  AWAITING_RENEWAL┘
        │                          │
        │                          └──[renewal not paid by grace]──▶ LAPSED
        │                                                                │
        │                                                                └─▶ [reactivate]──▶ ACTIVE
        │
        └──[manually cancelled]──▶ CANCELLED
```

Grace period for renewals: 7 days after due date. After that, license LAPSES, dashboard re-locks. Reactivation requires payment of overdue + current month.

### Paywall UX

**EPC side (Tab C in project workspace):**

When clicking Tab C on an operational project with no active EPC license:

```
┌─────────────────────────────────────────────────────────────┐
│                  [LOCK ICON]                                │
│                                                              │
│   O&M Monitoring is licensed                                │
│   This project is operational. Activate an O&M license      │
│   to monitor system performance, manage maintenance,        │
│   and access prescriptive insights.                         │
│                                                              │
│   [Activate for own use]   [Sell to client]                 │
│                                                              │
│   ─────────────────────────────────────────────             │
│                                                              │
│   Tier comparison                                            │
│   [Three cards: Basic / Premium / AI]                       │
│   [Each shows monthly fee, key features, "Select" CTA]      │
└─────────────────────────────────────────────────────────────┘
```

The "Sell to client" CTA is **the primary action** (positioned right, accent-coloured) because that's the commercial model the platform encourages. "Activate for own use" is secondary (ghost button).

**Client side (Plant Dashboard):**

When a client navigates to a site with no active client license:

```
┌─────────────────────────────────────────────────────────────┐
│                  [LOCK ICON]                                │
│                                                              │
│   This dashboard is licensed                                │
│   Your installer can activate it for you, or you can        │
│   activate it directly.                                     │
│                                                              │
│   [Contact my installer]   [Activate myself]                │
│                                                              │
│   ─────────────────────────────────────────────             │
│                                                              │
│   Tier comparison (same three cards)                        │
└─────────────────────────────────────────────────────────────┘
```

"Contact my installer" sends an in-app message + email to the EPC requesting they initiate the sale (Flow A).

### Activation animation (the demo moment)

When a license payment confirms (in real flow, after reconciliation; in Demo Mode, ~5s after EFT proof upload), the paywall dissolves and the dashboard reveals. Framer Motion sequence:

1. Paywall lock icon transforms into unlock icon (300ms)
2. Subtle scale-out + fade of paywall (200ms)
3. Dashboard skeleton fades in
4. Real data populates (charts render, alerts appear, status indicators)
5. Toast: "AI License activated for Spaza Boksburg. Monthly fee R 1,800. Next billing 15 June 2026."
6. If Flow A: EPC also sees a notification: "License sold. Commission of R 360/month credited to your wallet."

This is one of the demo's planned wow moments — see `07_TESTING.md` updated dry-run.

---

## Reseller / commission engine

The EPC is a channel partner. Their commission is a recurring revenue stream the platform owes them.

### Commission model

- Commission is a percentage of the **monthly license fee** (not the once-off activation)
- Default rate: 20%. Editable per (EPC company × license tier) via admin configuration.
- Commission accrues monthly when client license is renewed
- Commission payouts: monthly batch, paid via EFT from platform to EPC's banking details on file
- EPC sees commission earnings in their Wallet & Rewards section (a new "Commission" tab)

### Schema

A `LicenseCommission` record per (license × month). Created on license activation; new rows added on each renewal. Payout state per row tracks: ACCRUED → READY_TO_PAY → PAID.

### EPC's "Reseller" view

New section in the EPC's wallet/dashboard: **Licenses I've sold.** Shows:

- List of client licenses where this EPC is the reseller
- Monthly recurring commission per license
- Total commission earned (lifetime + this month + this year)
- Upcoming commission payout date
- Upsell opportunities: existing client licenses on Basic tier that could move to Premium or AI

This view turns the EPC's wallet from a "tokens and fiat" view into a "tokens, fiat, and recurring commission revenue" view — a more compelling commercial story.

### Commission appears in SEE.AI

A new tool call: `list_license_upsell_opportunities` returns the EPC's operational sites where the client has either no license or a lower tier than they could benefit from. The AI Assistant can proactively suggest:

> "Three of your operational sites don't have client O&M licenses yet. Spaza Boksburg in particular would benefit from the AI tier given its BESS — and you'd earn an estimated R 360/month commission. Want me to draft a proposal?"

(The drafted proposal then flows through the EPC's "Sell to client" UI.)

---

## Banking details surface

The platform's banking details are surfaced anywhere EFT is offered:

- EFT instructions modal during payment
- Invoice PDFs (header)
- Admin Configuration → Banking Details (editable by superuser admin only)

```ts
type PlatformBankAccount = {
  accountName: 'Phoenix Energy Solutions (Pty) Ltd'  // or SEE platform entity
  bankName: 'First National Bank'
  accountNumber: '62XXXXXXXX'
  branchCode: '250655'
  accountType: 'Business Cheque'
  swiftCode: 'FIRNZAJJ'  // for international
}
```

Stored as a singleton (one platform bank account; future supports multiple per region). Cached in memory; admin edits invalidate cache.

---

## Hardware checkout (multi-rail)

Existing hardware cart checkout (M7) gets a rail choice on submit:

- Subtotal < R 10,000: defaults to PayFast (with EFT as option)
- Subtotal ≥ R 10,000: defaults to EFT (with PayFast as option)
- User can change

PayFast path: existing mock flow, real-time success.
EFT path: invoice issued, EFT instructions shown, POP upload, awaiting reconciliation, order moves to PENDING_PAYMENT → PAID → SHIPPED only on reconciliation.

---

## Service marketplace escrow (revised)

Existing JobCard escrow (M7) updated to account for EFT-funded escrow:

When a contractor accepts a bid:
1. Escrow invoice issued to the contractor for the bid amount + platform fee
2. Contractor pays via EFT or PayFast
3. On payment confirmed: escrow is "funded" (status FUNDED)
4. JobCard becomes ACTIVE
5. On job completion + acceptance: escrow RELEASED — funds payable to service provider (commission payout queued)
6. SP receives notification, funds queued for monthly EFT payout

The contractor doesn't *deposit* the money in some custodial account in the prototype — the platform records the escrow commitment and the SP payout in its books. Real escrow integration is production work.

---

## API surface

```
// Invoices
GET    /api/invoices?status=&issuedBy=&issuedTo=
GET    /api/invoices/[id]
POST   /api/invoices                                  Generate invoice (server-side trigger usually)
GET    /api/invoices/[id]/pdf                         Mocked PDF download

// Payments
POST   /api/payments/initiate                         Start payment for an invoice; returns rail-specific instructions
POST   /api/payments/[id]/upload-pop                  Upload proof of payment (EFT)
POST   /api/payments/[id]/payfast-callback            Mock PayFast return handler
GET    /api/payments/[id]                             Status

// Admin reconciliation
GET    /api/admin/reconciliation-queue                Pending POP reviews
POST   /api/admin/payments/[id]/reconcile             Mark paid (with bank ref)
POST   /api/admin/payments/[id]/dispute               Mark disputed (with reason)

// Licenses
GET    /api/projects/[id]/licenses                    All O&M licenses for project (EPC + client views)
POST   /api/projects/[id]/licenses/activate           Self-activate (Flow B)
POST   /api/projects/[id]/licenses/sell-to-client     EPC initiates client sale (Flow A)
POST   /api/license-offers/[id]/accept                Client accepts proposal
POST   /api/licenses/[id]/cancel                      Cancel auto-renew
GET    /api/licenses/[id]                             Detail

// Commissions
GET    /api/wallet/commissions                        EPC sees their earnings
GET    /api/admin/commissions/payout-batch           Admin runs monthly payout
POST   /api/admin/commissions/[id]/mark-paid          After EFT executed
```

---

## Schema additions

```prisma
// =========================================================================
// PAYMENTS & INVOICING
// =========================================================================

model Invoice {
  id                String          @id @default(cuid())
  invoiceNumber     String          @unique     // SEE-INV-2026-0142
  issuerType        InvoiceIssuer
  issuerCompanyId   String?                     // null when PLATFORM
  recipientCompanyId String
  status            InvoiceStatus   @default(DRAFT)
  subtotalCents     Int
  vatRate           Float           @default(0.15)
  vatCents          Int
  totalCents        Int
  issuedAt          DateTime        @default(now())
  dueDate           DateTime
  paidAt            DateTime?
  notes             String?

  issuerCompany     Company?        @relation("InvoicesIssued", fields: [issuerCompanyId], references: [id])
  recipientCompany  Company         @relation("InvoicesReceived", fields: [recipientCompanyId], references: [id])
  lineItems         InvoiceLineItem[]
  payments          Payment[]

  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@index([recipientCompanyId, status])
  @@index([issuerCompanyId, status])
}

enum InvoiceIssuer {
  PLATFORM        // platform → user company
  COMPANY         // company → company (e.g., EPC selling license to client; platform intermediates)
}

enum InvoiceStatus {
  DRAFT
  ISSUED
  AWAITING_PAYMENT
  PAID
  OVERDUE
  CANCELLED
}

model InvoiceLineItem {
  id              String       @id @default(cuid())
  invoiceId       String
  description     String
  quantity        Float        @default(1)
  unitPriceCents  Int
  totalCents      Int
  type            LineItemType
  relatedEntityId String?      // licenseId, jobCardId, orderId, etc.

  invoice         Invoice      @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
}

enum LineItemType {
  OM_LICENSE_ACTIVATION
  OM_LICENSE_RENEWAL
  AI_VERIFICATION
  EXPERT_VERIFICATION
  PLATFORM_FEE
  HARDWARE
  SUBSCRIPTION
  ESCROW_DEPOSIT
  COMMISSION_PAYOUT
  TOKEN_PURCHASE
}

model Payment {
  id                  String          @id @default(cuid())
  invoiceId           String
  rail                PaymentRail
  amountCents         Int
  status              PaymentStatus   @default(INITIATED)
  reference           String?         @unique  // generated for EFT
  proofOfPaymentUrl   String?         // EFT only
  payfastTxnId        String?         // PayFast only
  reconciledByUserId  String?
  reconciledAt        DateTime?
  bankReference       String?         // what the bank statement shows
  disputeReason       String?
  expiresAt           DateTime?       // 7-day window for EFT

  invoice             Invoice         @relation(fields: [invoiceId], references: [id])

  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  @@index([status, createdAt])
  @@index([reference])
}

enum PaymentRail {
  EFT
  PAYFAST
}

enum PaymentStatus {
  INITIATED
  AWAITING_PROOF
  PROOF_UPLOADED
  AWAITING_RECONCILIATION
  PROCESSING       // PayFast in-flight
  PAID
  FAILED
  DISPUTED
  EXPIRED
}

model PlatformBankAccount {
  id              String          @id @default(cuid())
  accountName     String
  bankName        String
  accountNumber   String
  branchCode      String
  accountType     String
  swiftCode       String?
  isActive        Boolean         @default(true)
  notes           String?         // e.g. "use for ZAR invoices only"

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

// =========================================================================
// O&M LICENSING (replaces OmContract)
// =========================================================================

model OmLicense {
  id                  String          @id @default(cuid())
  projectId           String
  licenseeCompanyId   String                          // who pays / who holds the license
  viewerType          OmViewerType                    // EPC view or CLIENT view
  tier                OmLicenseTier
  status              OmLicenseStatus @default(INACTIVE)
  monthlyFeeCents     Int
  activatedAt         DateTime?
  nextBillingAt       DateTime?
  cancelledAt         DateTime?
  lapsedAt            DateTime?

  // Reseller model (Flow A): when an EPC sold this license to a client,
  // resellerCompanyId records who gets the commission
  resellerCompanyId   String?
  commissionRate      Float?          // e.g. 0.20

  project             Project         @relation(fields: [projectId], references: [id])
  licenseeCompany     Company         @relation("LicensesHeld", fields: [licenseeCompanyId], references: [id])
  resellerCompany     Company?        @relation("LicensesResold", fields: [resellerCompanyId], references: [id])
  commissions         LicenseCommission[]
  offers              LicenseOffer[]

  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  @@unique([projectId, viewerType, status])  // at most one ACTIVE license per (project, viewer)
  @@index([licenseeCompanyId, status])
  @@index([resellerCompanyId, status])
}

enum OmViewerType {
  EPC                // contractor's portfolio-manager dashboard
  CLIENT             // asset owner's plant dashboard
}

enum OmLicenseTier {
  BASIC
  PREMIUM
  AI
}

enum OmLicenseStatus {
  INACTIVE          // never activated
  PENDING_PAYMENT   // invoice issued, not yet paid
  ACTIVE
  AWAITING_RENEWAL  // due date passed, in grace period
  LAPSED            // grace expired
  CANCELLED         // user-cancelled
}

// EPC proposes a license sale to a client (Flow A)
model LicenseOffer {
  id                  String          @id @default(cuid())
  licenseId           String          // pre-created OmLicense in PENDING_PAYMENT
  proposedByCompanyId String          // EPC
  proposedToCompanyId String          // Client
  tier                OmLicenseTier
  monthlyFeeCents     Int
  commissionRateOffered Float
  message             String?         // EPC's pitch message
  status              OfferStatus     @default(PENDING)
  respondedAt         DateTime?

  license             OmLicense       @relation(fields: [licenseId], references: [id])

  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
}

enum OfferStatus {
  PENDING
  ACCEPTED
  DECLINED
  EXPIRED
}

// Recurring commission earned by an EPC for a resold license
model LicenseCommission {
  id              String          @id @default(cuid())
  licenseId       String
  resellerCompanyId String
  period          DateTime        // e.g., 2026-06-01 = June 2026 commission
  amountCents     Int
  status          CommissionStatus @default(ACCRUED)
  paidAt          DateTime?
  payoutBatchId   String?

  license         OmLicense       @relation(fields: [licenseId], references: [id])
  resellerCompany Company         @relation(fields: [resellerCompanyId], references: [id])

  createdAt       DateTime        @default(now())

  @@unique([licenseId, period])
  @@index([resellerCompanyId, status])
}

enum CommissionStatus {
  ACCRUED          // license active, commission earned but not yet paid
  READY_TO_PAY     // monthly payout batch generated
  PAID             // platform paid EPC via EFT
  CANCELLED        // license cancelled in same period
}
```

**Patches to existing models:**

```prisma
model Company {
  // ...existing fields
  invoicesIssued      Invoice[]            @relation("InvoicesIssued")
  invoicesReceived    Invoice[]            @relation("InvoicesReceived")
  licensesHeld        OmLicense[]          @relation("LicensesHeld")
  licensesResold      OmLicense[]          @relation("LicensesResold")
  commissions         LicenseCommission[]
}

model Project {
  // ...existing fields
  // omContract removed — replaced by:
  omLicenses          OmLicense[]
}
```

The existing `OmContract` model is deleted. Migration drops the table.

---

## Demo data implications

See `05_SEED_DATA.md` for the full seeded distribution. Summary of license state per operational project:

| Project | EPC license | Client license | Story |
|---|---|---|---|
| Spaza Sandton (#2) | ACTIVE (bundled) | ACTIVE AI tier, paid by Spaza, Adebayo earns commission | The polished happy path |
| Spaza Boksburg (#3) | INACTIVE | INACTIVE | **Demo activation moment** — Marcus activates AI tier mid-demo |
| Kruger Farm (#4) | ACTIVE (bundled) | ACTIVE AI tier | Prescriptive Maintenance demo |
| Manchester Restaurant (#5) | ACTIVE Basic, paid by EPC | INACTIVE | Flow B — EPC self-licensed because client didn't want it |
| Umhlanga Hotel (#14) | ACTIVE (bundled) | ACTIVE Premium tier | Solar Ace's hero operational site |
| Richards Bay Industrial (#15) | ACTIVE Basic, paid by EPC | INACTIVE | Another Flow B example |

Seeded invoices: ~30 historical invoices across companies (mostly paid, a few awaiting reconciliation for demo, one disputed for the disputes view), with associated payments showing both rails.

---

## What's out of scope for the prototype

- Real bank API integration (Yoco, Ozow, EFTSecure, etc.) — production decision
- Real PayFast integration — mocked redirect/return only
- Real recurring billing via Stripe Subscriptions or similar — for the prototype, monthly renewal invoices are auto-generated by a cron-like seed action, but actual scheduled jobs are out of scope
- VAT submission to SARS — invoice data shape is compliant; submission is finance department concern
- Multi-currency — ZAR only
- Refunds processing — refund records can be entered manually by admin but no automated rail
- Real commission payout via EFT batch — admin marks paid; no actual bank push
