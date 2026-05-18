# 05 — Seed Data

The canonical demo dataset. This is what investors and contractors see on first load. A good seed is the difference between "interesting prototype" and "this could be the real product."

The seed lives at `prisma/seed.ts` and is invoked by `npm run db:seed:demo`. An empty seed (`seed-empty.ts`) wipes to clean state for the "watch me create from scratch" demo path.

---

## Narrative

The demo dataset tells the story of **Adebayo Renewables**, a Johannesburg-based EPC at Silver tier with three completed projects, twelve active projects across various stages, and a healthy pipeline. The other contractor companies provide market context (a Bronze-tier newcomer, a Gold-tier veteran). Service Providers and an End-Client round out the ecosystem.

The data is intentionally rich but believable. Names are South African; locations are real provinces and cities; project specifications are realistic for the SA market (residential ~5 kW, C&I 100 kW–5 MW, utility 10+ MW).

---

## Users

| Email | Name | Role | Company | Demo button |
|---|---|---|---|---|
| `marcus@adebayorenewables.co.za` | Marcus Adebayo | Owner | Adebayo Renewables (Contractor, Silver) | ✓ |
| `naledi@adebayorenewables.co.za` | Naledi Khumalo | Project Manager | Adebayo Renewables | |
| `lerato@mokoenastructural.co.za` | Lerato Mokoena | Owner | Mokoena Structural (Service Provider) | ✓ |
| `david@vanderbergengineering.co.za` | David van der Berg | Owner | Van der Berg Engineering (Service Provider) | |
| `priya@kalalegal.co.za` | Priya Kala | Owner | Kala Legal (Service Provider) | |
| `sipho@spazaholdings.co.za` | Sipho Dlamini | Enterprise Admin | Spaza Holdings (Enterprise Client) | ✓ |
| `thandi.cfo@spazaholdings.co.za` | Thandi Mthembu | Enterprise Finance | Spaza Holdings | |
| `james.ops@spazaholdings.co.za` | James van Wyk | Enterprise Ops | Spaza Holdings | |
| `aisha@spazaholdings.co.za` | Aisha Patel | Enterprise Viewer | Spaza Holdings | |
| `tess@durbanvillemall.co.za` | Tess de Wet | Owner | Durbanville Mall (Standard End-Client) | ✓ |
| `erin@see.platform` | Erin Berman-Levy | Admin | SEE Platform | ✓ |
| `ricardo@see.platform` | Ricardo Santos | Admin | SEE Platform | |
| `tumi@bnsolar.co.za` | Tumi Maboe | Owner | BN Solar (Contractor, Bronze — newcomer) | |
| `johan@solaracegroup.co.za` | Johan Pretorius | Owner | Solar Ace Group (Contractor, Gold) | |

All demo passwords: `seedemo2026!`. Demo button users have additional one-click login.

---

## Companies

### Contractors

**Adebayo Renewables** (Silver tier, hero)
- CIPC: 2018/123456/07
- VAT: 4123456789
- BEEE Level 1
- Based: Johannesburg
- 8 compliant projects to date
- Wallet: 12,400 tokens
- About: "Commercial and industrial solar specialists. We design, install, and maintain solar PV and BESS for SA businesses."
- Logo: simple text logo (designed in M0 brand pass)

**BN Solar** (Bronze tier, newcomer)
- CIPC: 2024/098765/07
- VAT: pending
- BEEE Level 4
- Based: Cape Town
- 1 compliant project
- Wallet: 1,200 tokens

**Solar Ace Group** (Gold tier, veteran)
- CIPC: 2012/445566/07
- BEEE Level 2
- Based: Durban
- 22 compliant projects
- Wallet: 48,000 tokens

### Service Providers

| Company | Category | Hourly rate | Rating | Areas |
|---|---|---|---|---|
| Mokoena Structural | Structural & Civils | R1,200 | 4.8 (32) | Gauteng, North West, Limpopo |
| Van der Berg Engineering | Engineering | R1,800 | 4.9 (47) | All provinces |
| Kala Legal | Legal | R2,400 | 4.7 (18) | All provinces |
| Pretoria Plant Hire | Logistics & Plant Hire | R900 | 4.5 (24) | Gauteng |
| Phoenix Risk Insurance | Finance & Insurance | R1,500 | 4.8 (22) | All provinces |
| Engenuity Consulting | Engineering | R2,000 | 4.6 (19) | KZN, EC |
| Buyisile Civils | Structural & Civils | R950 | 4.4 (12) | KZN |
| Cape Renewables Logistics | Logistics & Plant Hire | R1,100 | 4.7 (28) | WC, EC |

### End-Clients

**Spaza Holdings** (Enterprise client — multi-site portfolio)
- 47 retail locations nationally (3 with solar installations so far: Soweto, Sandton, Boksburg)
- All on PPA with Adebayo Renewables
- **On Enterprise contract with SEE** (8 months in) — custom dashboard, API integration, scheduled exports, 4 internal seats. See §"Spaza Holdings Enterprise License" below.
- Adebayo earns ~R 4,150/month reseller commission on this account (negotiated 10% of monthly invoice).

**Durbanville Mall (Pty) Ltd** (single-site standard end-client — used for the demo activation moment)
- Owns Durbanville Retail solar installation
- Just commissioned 3 weeks ago, no O&M license yet
- Demo user: `tess@durbanvillemall.co.za` — Tess de Wet (with one-click demo button as "Durbanville Mall — Standard Client")
- This is the client who accepts the license proposal during the demo activation moment

**Kruger Family Farm** (single site, Outright purchase)
- 250 kW farm-based solar in Mpumalanga
- AI O&M license (showcases Prescriptive Maintenance)

**Manchester Restaurant Group** (small commercial)
- 35 kW rooftop in Sandton
- Basic O&M license

---

## Projects (12–15 across stages)

The hero project is **Project Alpha — Spaza Soweto Retail Solar PPA** at Silver-tier Adebayo. This is the project an investor sees by default. It's in **Construction stage**, milestones partially complete, some submissions awaiting admin review, one milestone rejected (showing the feedback loop).

### Adebayo Renewables projects

| # | Name | Client | Tech | Size | Deal | Stage | Notes |
|---|---|---|---|---|---|---|---|
| 1 | Spaza Soweto Retail Solar PPA | Spaza Holdings | Solar PV | 480 kW + 600 kWh | PPA | Construction | **HERO** |
| 2 | Spaza Sandton Office Solar | Spaza Holdings | Solar PV | 220 kW | PPA | Operational | 18 months in service, demo O&M data |
| 3 | Spaza Boksburg Warehouse | Spaza Holdings | Solar PV + BESS | 1.2 MW + 800 kWh | PPA | Operational | Recently commissioned 4 weeks ago; **NOT yet in Spaza's Enterprise scope** — used for the "add to Enterprise contract" demo moment in Act 4 |
| 4 | Kruger Farm Mpumalanga | Kruger Family | Solar PV | 250 kW | Outright | Operational | AI O&M license, recent alerts demo |
| 5 | Manchester Sandton Restaurant | Manchester Group | Solar PV | 35 kW | Outright | Operational | Small commercial reference |
| 6 | Newcastle C&I Solar | Newcastle Trading (off-platform) | Solar PV | 800 kW | Lease | Financing | In financing stage, waiting on bank docs |
| 7 | Centurion BESS Pilot | TechPark Holdings | BESS only | 0 + 2 MWh | Outright | Development | Early stage, only first 2 milestones complete |
| 8 | Polokwane Hybrid System | Limpopo Mining Co | Solar PV + BESS | 2.4 MW + 1.5 MWh | PPA | Development | Pending EIA submission |
| 9 | Bryanston Retail Centre | Bryanston Mall (Pty) Ltd | Solar PV | 380 kW | PPA | Construction | Mid-stream |
| 10 | Pretoria East Office Park | Office Park Holdings | Solar PV | 1.8 MW | PPA | Construction | |
| 11 | Klerksdorp Industrial | KSP Manufacturing | Solar PV + BESS | 3.2 MW + 1.2 MWh | Outright | Development | Recently created |
| 12 | Durbanville Retail | Durbanville Mall | Solar PV | 290 kW | PPA | Operational | **Just commissioned 3 weeks ago. Demo activation moment site** — both licenses INACTIVE. |

### BN Solar projects (1)
| # | Name | Client | Tech | Size | Deal | Stage |
|---|---|---|---|---|---|---|
| 13 | Bellville Residential Estate | The Vines HOA | Solar PV | 180 kW | PPA | Development |

### Solar Ace Group projects (2 visible)
| # | Name | Client | Tech | Size | Deal | Stage |
|---|---|---|---|---|---|---|
| 14 | Umhlanga Hotel Solar + BESS | Coastal Hospitality Group | Solar PV + BESS | 1.6 MW + 2 MWh | PPA | Operational |
| 15 | Richards Bay Industrial | RB Industrial Park | Solar PV | 4.2 MW | Outright | Operational |

### Project Alpha milestone state (the hero project)

This is what the investor sees when clicking into "Project Alpha — Spaza Soweto Retail Solar PPA." Carefully crafted state:

**Development phase (complete):**
- ✅ Site identification and feasibility — approved
- ✅ Client agreement (terms signed) — approved
- ✅ Initial financial modelling — approved
- ✅ EIA report — **REJECTED**, then resubmitted and approved (shows the feedback loop in version history)
- ✅ Grid connection application — approved

**Financing phase (complete):**
- ✅ Bankability assessment — approved (GOLD verified by expert)
- ✅ Financial close documentation — approved
- ✅ Insurance binding — approved (Auto-Gold via Phoenix Risk Insurance marketplace)

**Construction phase (current — partial):**
- ✅ Civil works completion — approved (Auto-Gold via Mokoena Structural)
- ✅ Structural engineering sign-off — approved (Auto-Gold via Van der Berg Engineering)
- 🟡 Electrical installation — **submitted, under review** (admin queue)
- 🔵 BESS integration — in progress, "Get Service" RFQ posted to marketplace
- ⚪ Commissioning tests — locked
- ⚪ Performance acceptance — locked

**Commissioning phase (locked):**
- ⚪ Final commissioning report
- ⚪ Handover to client
- ⚪ Operational acceptance certificate

This state lets a presenter demonstrate: an Auto-Gold marketplace flow, a real expert-verified Gold milestone, the rejection-feedback-resubmission loop, an active admin review queue, a live RFQ in the marketplace, and locked future milestones gating progression.

---

## Milestone templates

Seed 4 templates covering common project types:

1. **Solar PV — Small Commercial < 100kW Outright** (12 milestones)
2. **Solar PV — Commercial & Industrial 100kW–1MW PPA** (18 milestones)
3. **Solar PV + BESS — Hybrid C&I 1MW–5MW PPA** (23 milestones) ← used by Project Alpha
4. **BESS Standalone — Any Size Outright** (15 milestones)

A 5th template (Wind Utility Scale) is included as a stretch but not used by any seeded project — it shows in the Admin template list.

For each template item, populate: name, description, phase, hard-gate boolean, required artefacts.

Example items (Template 3, used by Project Alpha):

```
Development phase
  1. Site identification and feasibility — Required: Feasibility Report (PDF)
  2. Client agreement (terms signed) — Required: Signed Term Sheet (PDF)
  3. Initial financial modelling — Required: Financial Model (XLSX), Tariff Analysis (PDF)
  4. EIA report — Required: EIA Report (PDF), Public Participation Notice (PDF)
  5. Grid connection application — Required: Application Form (PDF), Single Line Diagram (PDF)

Financing phase
  6. Bankability assessment — Required: Bankability Report (PDF), Sensitivity Analysis (XLSX)
  7. Financial close documentation — Required: Loan Agreement (PDF), Term Sheet (PDF)
  8. Insurance binding — Required: Insurance Certificate (PDF), Policy Schedule (PDF)

Construction phase
  9. Civil works completion — Required: Civil Completion Certificate (PDF), Site Photos (Multiple)
  10. Structural engineering sign-off — Required: Structural Report (PDF), Engineer Stamp Letter (PDF)
  11. Electrical installation — Required: Electrical CoC (PDF), Wiring Diagrams (PDF)
  12. BESS integration — Required: BESS Commissioning Report (PDF), Safety Certificates (PDF)
  13. Commissioning tests — Required: Performance Test Report (PDF), IV Curve Data (PDF)
  14. Performance acceptance — Required: Acceptance Certificate (PDF)

Commissioning phase
  15. Final commissioning report — Required: Final Report (PDF)
  16. Handover to client — Required: Handover Pack (PDF), Operations Manual (PDF)
  17. Operational acceptance certificate — Required: Op. Acceptance Cert (PDF)

(O&M phase milestones continue but are recurring/scheduled rather than gates)
```

---

## Hardware listings (30+)

### Solar Panels (8)
- JA Solar JAM72D40-580 (580W mono PERC) — R3,200
- Canadian Solar CS6W-555 (555W) — R3,100
- LONGi Hi-MO 6 LR5-72HGD-580M (580W) — R3,300
- Trina Solar Vertex S+ TSM-NEG21C.20 (445W) — R2,450
- Jinko Tiger Neo N-type 580W — R3,400
- REC Alpha Pure-R 430W (premium) — R5,200
- (and 2 more)

### Inverters (8)
- WEG SRW7-A-30K (30 kW commercial) — R32,500 ← WEG featured per proposal
- WEG SRW7-A-100K (100 kW) — R88,000 ← WEG featured
- Sungrow SG110CX (110 kW) — R96,500
- Huawei SUN2000-100KTL (100 kW) — R94,000
- SolarEdge SE100K (100 kW) — R125,000
- Victron MultiPlus-II 48/8000 (8 kVA hybrid) — R44,500
- SunSynk 8kW Hybrid — R28,000
- Deye SUN-12K-SG04LP3-EU (12 kW hybrid) — R32,800

### Batteries (6)
- BYD Battery-Box Premium HVS (10.2 kWh) — R88,500
- Pylontech US5000C (4.8 kWh) — R26,500
- Hubble AM-2 (5.5 kWh) — R32,000
- Freedom Won Lite Home 5/5 — R29,500
- Dyness Powerbox F-Series 4.8kWh — R24,800
- Sungrow SBR096 (9.6 kWh) — R52,000

### Generators (4)
- Cummins C22D5 (22 kVA diesel) — R148,000
- Lister Petter LWA Series (10 kVA) — R72,500
- Honda EU30iS (3 kVA petrol portable) — R48,500
- Generac 22 kW Liquid-Cooled (LPG) — R195,000

### Accessories (8+)
- DC isolator switches, AC isolators
- MC4 connectors (pack of 50)
- Mounting rails (per metre)
- Earthing kits
- Monitoring add-ons (Solar-Log gateway, etc.)
- Wire & conduit
- CTs and meters
- Lightning protection kits

**WEG products are featured prominently** per the proposal's Phase 6 "trained to sell more WEG." On hardware browse, WEG inverters surface with a subtle "Recommended" tag.

---

## O&M readings

For Spaza Sandton Office (Project #2) — **the polished O&M demo site**:

- 18 months of daily aggregates
- 60 days of hourly readings (for charts)
- Realistic curves: daily generation tracking irradiance, slight performance degradation over time (~1.5%/year), one outage event (2 days, troubleshooting documented)
- Multi-brand simulation: same site has "data feed" tabs labelled WEG, Victron, SunSynk, Deye showing identical normalised data (the demo of normalisation)
- **License state:** Covered by Spaza Holdings's Enterprise license (see Enterprise section below). The CLIENT-viewer OmLicense for this project is `SUPERSEDED_BY_ENTERPRISE`. The EPC-viewer OmLicense remains ACTIVE (bundled). Adebayo Renewables is the reseller; their commission on this project is negotiated as part of the Enterprise contract — not formula-driven.

For Kruger Farm (Project #4) — **the AI Prescriptive Maintenance demo site**:

- 12 months of daily aggregates
- Recent 14 days showing a gradual efficiency drop in Inverter 2 (3% over 10 days)
- One alert: "Inverter 2 efficiency trending down — cleaning recommended" with action button
- **License state:** Client license AI tier ACTIVE, held by Kruger Family Farm, sold by Adebayo (commission: R 360/month). EPC view bundled.

For Spaza Boksburg (Project #3) — **the Enterprise upgrade demo site**:

- 30 days of recent data (commissioned 4 weeks ago)
- **License state:** Both EPC and Client OmLicenses are INACTIVE. **NOT yet included in Spaza's Enterprise scope** (initially only Spaza Sandton is scoped — Spaza Boksburg is the newest site, freshly commissioned, awaiting addition to the Enterprise contract).
- **Used in Act 4 of the demo:** when Erin (admin) walks through the Spaza Enterprise account, she demonstrates *adding Spaza Boksburg to scope* — which immediately makes the site visible in Sipho's Enterprise dashboard. This shows how Enterprise scope expansion works.

For Durbanville Retail (Project #12) — **the standard-tier activation demo site**:

- 3 weeks of recent data (just commissioned)
- **License state:** Both EPC and Client OmLicenses are INACTIVE.
- **Used in Act 3 of the demo:** Marcus initiates the "Sell to Client" flow → Durbanville Mall (Tess) accepts at Premium tier → pays via EFT → admin reconciles → both dashboards activate.
- This is a clean, simple, standard-tier activation flow with a non-Enterprise client.

For Manchester Restaurant (Project #5) — small commercial:

- 8 months of data
- **License state:** EPC license Basic tier ACTIVE (Flow B — Adebayo self-licensed because the client didn't want the dashboard). Client view locked. Manchester pays nothing, sees a "Contact your installer for dashboard access" prompt if they log in.

For Solar Ace's two operational projects (Umhlanga Hotel #14, Richards Bay Industrial #15):
- Light data, enough to populate dashboards
- Umhlanga Hotel: Client license Premium ACTIVE, sold by Solar Ace (commission visible in Solar Ace wallet for completeness — but Marcus is the demo user, so this is context not feature)
- Richards Bay Industrial: EPC license Basic ACTIVE (Flow B)

---

## News items (15–20)

Pre-curated, realistic South African renewable energy headlines, dated within the last 3 months. Examples:

- "NERSA approves new feed-in tariff structure for commercial generators"
- "Eskom announces revised grid connection rules for embedded generation > 1MW"
- "PV Insights: SA solar module imports up 32% YoY"
- "Major bank launches dedicated renewable energy project finance facility"
- "Cape Town pilots municipal solar PPA framework"
- "JET Implementation Plan: R1.5 trillion mobilised for green transition"
- "Battery storage prices fall 18% globally — implications for SA C&I"
- "Wheeling agreements: who's actually doing it in 2026?"
- (+10 more)

Each has: title, 1–2 sentence summary, source (Engineering News, Mining Weekly, ESI Africa, Daily Maverick, Business Day), source URL (real or `#`), publishedAt (last 90 days), optional imageUrl.

These rotate in the AI NewsFeed on the contractor dashboard.

---

## Token transactions

Backfill realistic transaction history for each company:

**Adebayo Renewables** (current balance: 12,400):
- Initial registration bonuses: tutorial (+100), first project (+100), first service request (+100)
- 8 compliant project bonuses (+1,000 each via existing project upload pathway)
- Some spends: 4× AI verifications (-1,000 each), 2× expert verifications (-10,000 each total adjusted), Company Profile gen ×3 (-1,000 each)
- Tier bonuses (Bronze→Silver crossing)
- Cashback from a few hardware purchases

**BN Solar** (current 1,200): Just registration + 1 project bonus + 1 AI verification.

**Solar Ace** (current 48,000): Heavy history reflecting Gold tier and many projects.

Transactions stamped across the last 18 months, realistic distribution.

---

## RFQs and bids

Active RFQs (visible on Service Provider opportunity boards):

1. **Project Alpha — BESS integration commissioning support** (posted by Adebayo)
   - Category: Engineering
   - Budget: up to R 85,000
   - Deadline: 14 days
   - Bids so far: 2 (Van der Berg Engineering @ R72,000, Engenuity Consulting @ R78,500)

2. **Polokwane Hybrid — Grid Impact Study** (posted by Adebayo)
   - Category: Engineering
   - Budget: up to R 120,000
   - Deadline: 21 days
   - Bids so far: 1

3. **Klerksdorp Industrial — Structural assessment** (posted by Adebayo)
   - Category: Structural & Civils
   - Bids so far: 3

4. **Bellville Residential — Legal review of HOA agreement** (posted by BN Solar)
   - Category: Legal
   - Bids so far: 1

---

## JobCards (completed and active)

Active:
- Mokoena Structural is currently delivering civil works completion certificate for Bryanston Retail Centre (Project #9)

Completed:
- Mokoena Structural completed Project Alpha civil works (visible in their portfolio)
- Van der Berg Engineering completed Project Alpha structural sign-off
- Phoenix Risk Insurance completed Project Alpha insurance binding

---

## Hardware orders

3 completed orders for Adebayo Renewables in the last 6 months — showing token cashback in their history. One pending order in cart state (left over for demo continuity).

---

## Notifications

Pre-populate ~8 notifications per primary demo user (Marcus, Erin) so the bell shows activity:

- "Milestone 'Electrical installation' awaiting admin review" (Marcus)
- "New bid received on RFQ 'BESS integration'" (Marcus)
- "Site 'Kruger Farm' — Inverter 2 efficiency alert" (Marcus)
- "You earned 200 tokens — hardware cashback" (Marcus)
- "Tier progression: 3 compliant projects to Gold" (Marcus)
- "5 KYC submissions awaiting review" (Erin)
- "12 milestone submissions in queue" (Erin)

---

## AI conversation history

Seed 2-3 prior conversations for Marcus with SEE.AI, demonstrating realistic prior usage:

1. "Which of my projects are at risk?" → AI responded with Project Alpha electrical milestone pending and Polokwane awaiting EIA
2. "Generate a portfolio overview I can send to a new client" → AI produced a draft summary
3. "What's the difference between PPA and Outright structures?" → AI explained

These exist in `AiConversation` records so the chat history sidebar is populated.

---

## Demo files (seed assets)

For the demo to feel real, the seed must reference actual files in Vercel Blob — not placeholder URLs. The mechanism (per `01_ARCHITECTURE.md` §File uploads):

1. Source ~15–20 realistic-looking PDFs and store them in `/public/seed-assets/`. Content can be lorem-ipsum body text with proper headers, signatures, stamps — what matters is they look like compliance documents at a glance.
2. The seed script (`prisma/seed.ts`) uploads each to Vercel Blob on first run, captures the returned URL, and stores it in the relevant DB record.
3. Subsequent seed runs skip the upload if the Blob path already exists.

**Files needed:**

| Path | Used by | Notes |
|---|---|---|
| `eia-project-alpha-v1.pdf` | Project Alpha milestone (rejected v1) | Should have visible "missing engineer stamp" issue |
| `eia-project-alpha-v2.pdf` | Project Alpha milestone (approved v2) | Same content, stamp added |
| `structural-report-project-alpha.pdf` | Project Alpha structural milestone | Auto-Gold via Van der Berg Engineering |
| `civil-completion-project-alpha.pdf` | Project Alpha civil milestone | Auto-Gold via Mokoena Structural |
| `bankability-report-project-alpha.pdf` | Project Alpha financing | Expert-verified Gold |
| `electrical-coc-project-alpha.pdf` | Project Alpha electrical (current submission under review) | |
| `bee-cert-adebayo.pdf` | Adebayo Renewables compliance | BEEE Level 1 |
| `tax-clearance-adebayo.pdf` | Adebayo Renewables compliance | |
| `pi-insurance-adebayo.pdf` | Adebayo Renewables compliance | |
| `cipc-adebayo.pdf` | Adebayo Renewables KYC | |
| `cipc-bn-solar.pdf` | BN Solar KYC | |
| `cipc-solar-ace.pdf` | Solar Ace KYC | |
| `director-id-marcus.pdf` | Adebayo KYC | Generic-looking ID document |
| `commissioning-cert-spaza-sandton.pdf` | Project #2 handover | Operational project |
| `om-monthly-report-spaza-sandton.pdf` | Project #2 O&M | Sample monthly report |
| `warranty-pack-kruger.pdf` | Project #4 handover | |
| `feasibility-template.pdf` | Various early-stage projects | Reused across projects |
| `financial-model-template.xlsx` | Various projects | Excel example for non-PDF testing |
| `single-line-diagram-template.pdf` | Various grid applications | |
| `site-photo-1.jpg` through `-5.jpg` | Project sites | Abstract architectural/structural photos — NOT solar panels |

**Logo files:**

| Path | Notes |
|---|---|
| `logo-adebayo.svg` | Simple wordmark, dark on light |
| `logo-bn-solar.svg` | |
| `logo-solar-ace.svg` | |
| `logo-mokoena-structural.svg` | Service provider |
| `logo-van-der-berg.svg` | |
| `logo-kala-legal.svg` | |
| `logo-spaza-holdings.svg` | End-client |
| `logo-kruger-farm.svg` | |

**Hardware product images:**
Real product photos won't be redistributable. Use abstract product representations (clean SVG silhouettes on `ink-50` background) for the 30+ hardware listings. Generate one per category (panel/battery/inverter/generator/accessory) and reuse with manufacturer label overlay. Acceptable for prototype; production sources real product imagery.

**Seed upload helper:**

```ts
// prisma/seed-helpers.ts
import { put } from '@vercel/blob'
import { readFile } from 'fs/promises'
import path from 'path'

export async function uploadSeedAsset(filename: string, purpose: string): Promise<string> {
  const filePath = path.join(process.cwd(), 'public/seed-assets', filename)
  const buffer = await readFile(filePath)
  const blob = await put(`seed/${filename}`, buffer, {
    access: 'public',
    addRandomSuffix: false,  // stable URLs across reseeds
  })
  return blob.url
}
```

The seed script orchestrates: upload all files first, capture URLs in a map, then create DB records referencing those URLs.

---

## Project comms seed (~80 messages)

Project Alpha's workspace gets a populated message history so the demo has substance. See `08_COMMUNICATIONS.md` §"Demo seed for comms" for the narrative. Distribution across channels:

| Channel | Messages | Notable content |
|---|---|---|
| `#general` | ~15 | Project kickoff, periodic status updates, upcoming BESS install discussion |
| `#site-updates` | ~20 | Lerato's civil works photos, weather delays, BESS delivery scheduling |
| `#client` | ~12 | Sipho's onboarding, monthly progress reports, BESS briefing |
| `#admin` | ~3 | Erin's EIA documentation question that triggered v1 rejection |
| Milestone threads | ~30 | Distributed across active milestone threads — heaviest on `#eia` (rejection story), `#civil-works-completion` (Auto-Gold), `#electrical-installation` (current submission + open @-mention to Marcus), `#bess-integration` (RFQ discussion) |

Other projects get lighter seeding (~5-10 messages each) — enough to populate inboxes but not enough to clutter the demo.

**System messages** are computed at seed time based on the milestone state:
- v1 EIA submission → "Submission v1 uploaded by Naledi Khumalo"
- v1 EIA rejection → "Submission v1 rejected by Erin Berman-Levy. Feedback: Engineer's stamp missing from page 12."
- v2 EIA approval → "Submission v2 approved by Erin Berman-Levy"
- Civil works Auto-Gold → "Civil completion certificate uploaded by Mokoena Structural (Job Card #JC-001). Auto-Gold verification applied."
- etc.

These give the milestone threads visible activity even where no humans have chatted.

**Pre-existing mentions for demo:**
- One unread @-mention for Marcus in `#electrical-installation`: "@Marcus can you confirm the panel schedule by EOD?" (posted "yesterday" so the inbox badge is live when demo starts)
- One unread @-mention for Erin in `#admin` of Project Alpha asking about an annotation
- These drive the inbox-badge moment in the demo dry-run

**Reactions:**
- 👍 on the EIA v2 approval message
- 🎉 on the civil works Auto-Gold message
- 👀 reactions scattered on a few site-update messages

---

## Invoices & Payments

The platform's transactional history. Realistic distribution showing both rails:

**For Adebayo Renewables (main demo user):**

Active and historical:
- **3 paid invoices** from platform: license activation for Spaza Sandton (12 months ago), AI verification × 4 (last 6 months), Company Profile Generator × 3
- **2 awaiting reconciliation** (for demo): a recent escrow deposit for a Mokoena Structural job (R 72,000 via EFT, POP uploaded yesterday); platform fee invoice (R 8,500 via EFT)
- **2 commission payouts received** (last two months): R 720/month combined from Spaza Sandton + Kruger Farm client licenses
- **1 hardware order** from 3 months ago: bulk panel + inverter order, R 87,400, paid via EFT, status DELIVERED

**For Spaza Holdings (end-client):**

- **Active recurring license invoices** for Spaza Sandton (AI tier, R 1,800/month) — 12 months of monthly invoices, all paid, mostly via EFT
- **One overdue** for demo purposes (current month, generated 5 days ago, payment due in 25 days)
- Earlier completed projects: hardware not relevant to client; they only see license invoices

**For Kruger Family Farm:**

- 8 months of monthly AI license invoices, all paid via EFT
- One in AWAITING_RECONCILIATION (most recent month's renewal) — this is for the demo's "renewal cycle" narrative

**For Durbanville Retail license proposal** (the demo activation moment):
- No invoice yet — generated mid-demo when Marcus initiates "Sell to client"

**For BN Solar:** light history, ~3 invoices
**For Solar Ace:** rich history (Gold tier veteran), ~25 invoices across 18 months, mix of paid and current month

**Platform-issued vs company-issued:**
- Platform → Adebayo: license fees, AI verification, expert verification, hardware, commission payouts
- Adebayo → Spaza (intermediated by platform, with EPC branding): license sale (this is the reseller flow — appears as both an Adebayo-issued invoice to Spaza AND a platform-issued commission credit to Adebayo)

**Distribution by payment rail:**
- ~80% EFT for invoices over R 5,000
- ~100% PayFast for token purchases and small invoices
- Mix of statuses to demonstrate the full state machine: PAID, AWAITING_RECONCILIATION (×3 for demo), PROOF_UPLOADED, EXPIRED (×1 historical for completeness), DISPUTED (×1 for the disputes view)

**Banking details seed:**
- Single PlatformBankAccount record:
  - Account name: Phoenix Energy Solutions (Pty) Ltd
  - Bank: First National Bank
  - Account: 62XXXXXXXXX (visible in demo as 62-style number, last 4 obscured in UI patterns following SA convention)
  - Branch: 250655
  - Account type: Business Cheque

---

## License Offers seed

Pre-seeded license offers in various states (drives the "Reseller" tab demo):

- **3 ACCEPTED** offers, now active licenses: Spaza Sandton (sold to Spaza), Kruger Farm (sold to Kruger), one historical Solar Ace one
- **1 PENDING** offer: Adebayo proposed AI tier license for Polokwane Hybrid project to Limpopo Mining Co — awaiting their response. Shown as "Pending with client" in Adebayo's reseller tab.
- **1 DECLINED** offer from 6 months ago: Bryanston Retail Centre's client declined; useful for showing the "what happens if they say no" path

---

## Spaza Holdings Enterprise License (the Enterprise demo)

Spaza Holdings is promoted from a standard end-client to an **Enterprise client**, demonstrating the platform's enterprise tier.

### Context

Spaza Holdings operates 47 retail locations across South Africa. Three of those (Soweto, Sandton, Boksburg) have solar installations from Adebayo Renewables; the other 44 don't yet, which is one of the upsell stories the platform supports.

Spaza moved to Enterprise 8 months ago after outgrowing the standard AI-tier license. Their motivations:

- They wanted their internal energy management system to consume SEE data via API
- Their CFO wanted custom financial dashboards showing energy ROI per store
- They wanted to add 4 internal seats (CFO, ops director, two site managers)
- They negotiated a custom contract with the platform commercial team

### EnterpriseLicense seed record

```ts
{
  clientCompanyId: spazaHoldings.id,
  status: 'ACTIVE',
  contractReference: 'SEE-MSA-2025-014 / SOW-001',
  contractStartDate: '2025-09-15',  // 8 months ago from May 2026
  contractEndDate: null,             // open-ended; review-driven
  reviewCadence: 'QUARTERLY',
  nextReviewDate: '2026-06-15',      // one month from now (next quarterly review)

  baseMonthlyFeeCents: 25_000_00,    // R 25,000
  perSeatMonthlyFeeCents: 1_500_00,  // R 1,500/seat/month
  perIntegrationFees: {
    OUTBOUND_API: 3_500_00,           // R 3,500/month
    SCHEDULED_EXPORT: 2_000_00,       // R 2,000/month
    INBOUND_FEED: 8_000_00,           // R 8,000/month
    CUSTOM_DASHBOARD: 5_000_00,       // R 5,000/month
  },
  usageRates: { apiCallsPer1000Cents: 50 },
  oneTimeSetupFeeCents: 75_000_00,    // R 75,000 — invoiced and paid at contract start
  oneTimeSetupInvoiced: true,

  resellerCompanyId: adebayoRenewables.id,
  negotiatedCommissionRate: 0.10,     // 10% — lower percentage than self-serve 20% but on much larger base

  customDashboardConfig: <see below>,
  brandingConfig: {
    logoUrl: '/seed-assets/logo-spaza-holdings.svg',
    primaryColor: '#1A4FBF',          // Spaza's brand blue (kept in restrained range per SEE brand)
    customSubdomain: null,            // not enabled for prototype
  },
  notes: 'Spaza expanding portfolio. Quarterly review to discuss adding 2-3 new sites per quarter as they roll out solar across the rest of the 47 retail locations. Pricing locked for 12 months.',
}
```

### Project scope

### Project scope

EnterpriseLicense initially covers **Spaza Sandton (Project #2)** only. Spaza Soweto Retail Solar PPA (Project #1, Project Alpha) is still in Construction so not yet operationally licensed. Spaza Boksburg (Project #3) is recently commissioned but **not yet** added to Enterprise scope — left deliberately out to enable the Act 4 demo moment where the admin adds it to scope live.

### Active integrations

Three active EnterpriseIntegration rows:

1. **OUTBOUND_API**
   - Status: ACTIVE
   - Config: `{ baseUrl: 'https://api.see.platform/v1/enterprise/spaza-a8k2m4', keyName: 'production', rateLimit: 1000 }`
   - Last activity: 4 minutes ago
   - Monthly fee: R 3,500
   - Pre-seeded usage record for current period: 142,847 API calls so far this month

2. **SCHEDULED_EXPORT**
   - Status: ACTIVE
   - Config: `{ format: 'JSON', destination: 'sftp://spaza-internal.energy.local/feeds/', schedule: '0 2 * * *' }` (daily 2am)
   - Last activity: yesterday at 2:00 AM
   - Monthly fee: R 2,000

3. **CUSTOM_DASHBOARD**
   - Status: ACTIVE
   - Config: `{ layoutId: 'spaza-portfolio-v2', enabledWidgets: [...] }`
   - Monthly fee: R 5,000

INBOUND_FEED is configured but not yet ACTIVE (status CONFIGURED) — Spaza is in the process of connecting their internal smart meter network. This demonstrates the lifecycle state.

### Seats

Four EnterpriseSeat records:

| User | Email | Role |
|---|---|---|
| Sipho Dlamini | `sipho@spazaholdings.co.za` | ENTERPRISE_ADMIN |
| Thandi Mthembu | `thandi.cfo@spazaholdings.co.za` | ENTERPRISE_FINANCE |
| James van Wyk | `james.ops@spazaholdings.co.za` | ENTERPRISE_OPS |
| Aisha Patel | `aisha@spazaholdings.co.za` | ENTERPRISE_VIEWER |

Sipho's existing user record from the standard seed becomes his Enterprise seat (ENTERPRISE_ADMIN role). The other three are new users seeded specifically for Enterprise. Sipho's demo login button now lands him on the Enterprise dashboard rather than the standard portfolio view.

### Custom dashboard config

Hard-coded for Spaza in the seed (prototype's job is to render this, not build a builder):

```ts
{
  layout: 'portfolio',
  widgets: [
    {
      id: 'portfolio-summary',
      type: 'portfolio_summary',
      position: { x: 0, y: 0, w: 12, h: 2 },
      config: { showCarbon: true, showRevenue: true, showCapacity: true },
      visibleToRoles: ['ENTERPRISE_ADMIN', 'ENTERPRISE_FINANCE', 'ENTERPRISE_OPS', 'ENTERPRISE_VIEWER']
    },
    {
      id: 'site-comparison',
      type: 'site_comparison',
      position: { x: 0, y: 2, w: 8, h: 4 },
      config: { metric: 'production_vs_expected', period: 'last_30d' },
      visibleToRoles: ['ENTERPRISE_ADMIN', 'ENTERPRISE_OPS', 'ENTERPRISE_VIEWER']
    },
    {
      id: 'maintenance-budget',
      type: 'maintenance_budget',
      position: { x: 8, y: 2, w: 4, h: 4 },
      config: {
        annualBudgetCents: 500_000_00,
        ytdSpendCents: 240_000_00,
        period: 'fiscal_2026'
      },
      visibleToRoles: ['ENTERPRISE_ADMIN', 'ENTERPRISE_FINANCE']
    },
    {
      id: 'carbon-target',
      type: 'custom_kpi',
      position: { x: 0, y: 6, w: 6, h: 2 },
      config: {
        name: 'Carbon target — 50% renewable by 2027',
        currentValue: 0.34,
        targetValue: 0.50,
        unit: 'fraction',
        format: 'percent'
      },
      visibleToRoles: ['ENTERPRISE_ADMIN', 'ENTERPRISE_FINANCE', 'ENTERPRISE_VIEWER']
    },
    {
      id: 'integrated-meters',
      type: 'integrated_data_summary',
      position: { x: 6, y: 6, w: 6, h: 2 },
      config: {
        source: 'spaza_internal_meters',
        showActualSavings: true,
        period: 'last_30d'
      },
      visibleToRoles: ['ENTERPRISE_ADMIN', 'ENTERPRISE_OPS']
    },
    {
      id: 'alerts-feed',
      type: 'cross_site_alerts',
      position: { x: 0, y: 8, w: 12, h: 3 },
      config: { severityFilter: ['warning', 'critical'], scope: 'all_sites' },
      visibleToRoles: ['ENTERPRISE_ADMIN', 'ENTERPRISE_OPS']
    }
  ]
}
```

The renderer (`<EnterpriseDashboard config={...} />`) draws these widgets. Each widget type maps to a React component receiving its config and the scoped data. Layout uses a 12-column grid (react-grid-layout or similar).

### Branding

Spaza's logo (a clean wordmark — designed as part of seed assets) appears alongside the SEE wordmark in the Enterprise client's topbar (`SEE × SPAZA HOLDINGS` arrangement). The primary accent in their dashboard is `#1A4FBF` (Spaza's brand blue, similar register to SEE accent — picked deliberately to stay in the platform's restrained palette). All other UI tokens (typography, neutrals, spacing) follow SEE design system. The platform doesn't disappear.

### Invoices

Eight monthly invoices for Spaza, all paid via EFT:

- Each invoice is itemised: base fee + 4 seat fees + 3 integration fees + computed API usage
- One invoice (the most recent month, ~5 days ago) is currently in AWAITING_RECONCILIATION — useful for showing the reconciliation queue
- The one-time setup fee invoice from 8 months ago is also present, marked PAID

Example invoice line items for current month:
| Description | Qty | Unit | Total |
|---|---|---|---|
| Enterprise base fee — SOW-001 | 1 | R 25,000 | R 25,000 |
| Enterprise seats | 4 | R 1,500 | R 6,000 |
| Outbound API integration | 1 | R 3,500 | R 3,500 |
| Scheduled exports integration | 1 | R 2,000 | R 2,000 |
| Custom dashboard | 1 | R 5,000 | R 5,000 |
| API usage (149,200 calls @ R 0.50/1k) | 149,200 | R 0.50/1k | R 74.60 |
| Subtotal | | | R 41,574.60 |
| VAT (15%) | | | R 6,236.19 |
| Total | | | **R 47,810.79** |

### Commission for Adebayo

Adebayo's reseller commission on Spaza Enterprise:
- Negotiated rate: 10%
- Computed monthly: ~R 4,150 (10% of the average monthly Spaza invoice excluding VAT)
- Visible in Adebayo's wallet → Reseller tab as a separate line: "Spaza Holdings (Enterprise) — variable monthly"
- Last 8 months of commission records seeded, mostly PAID, one or two ACCRUED

This shows the demo: not all reseller commissions are equal. Self-serve commissions are predictable (Basic R 70, Premium R 170, AI R 360/month per site). Enterprise commissions are bigger but variable.

### Spaza's three operational sites under Enterprise

- **Spaza Sandton (Project #2)** — In Enterprise scope. CLIENT-viewer OmLicense status: SUPERSEDED_BY_ENTERPRISE. EPC-viewer OmLicense: ACTIVE.
- **Spaza Soweto Retail Solar PPA (Project #1, Project Alpha)** — NOT in Enterprise scope (still in Construction; not yet operational). Will be added once commissioned. Standard project comms etc. still operates.
- **Spaza Boksburg (Project #3)** — NOT initially in Enterprise scope. Used as the **Act 4 demo moment** where Erin (admin) adds it to Spaza's Enterprise scope live, demonstrating scope expansion. Once added: Sipho's Enterprise dashboard immediately includes Boksburg, Marcus's view shows Enterprise badge on Boksburg, EPC commission for Boksburg moves from "expected self-serve" to the negotiated Enterprise rate.

---

## Reset / Demo Mode mechanics

`npm run db:reset` — drops and recreates schema
`npm run db:seed:demo` — populates this full demo dataset
`npm run db:seed:empty` — minimal seed (just admin user, empty rest) for "watch me create from scratch" demos

In-app **Reset Demo Data** button (admin role only) calls the demo seed via an API route. Confirms with a modal: "This wipes all data and reseeds the canonical demo state. Continue?"

**Demo Mode toggle** affects runtime behaviour, not seed:
- Milestone submissions auto-approve after 30s of demo time
- New RFQs auto-receive bids
- "Trigger tier progression" button visible on contractor dashboard (manually fires the tier-up animation for live demos)
- AI verification animations slowed slightly so the demo can narrate them
