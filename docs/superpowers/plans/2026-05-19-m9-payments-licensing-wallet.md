# M9 — Payments, Licensing & Wallet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full commercial substrate — EFT payment flow, O&M license activation with Framer Motion animation, EPC "sell to client" and "activate for own use" flows, admin reconciliation queue, contractor wallet with commissions, and admin Enterprise Accounts management.

**Architecture:** No schema migrations needed — Invoice, Payment, OmLicense, LicenseOffer, LicenseCommission, EnterpriseLicense all exist in schema.prisma. M9 wires UI to these models. Key demo moment: EPC sends license offer → client accepts → EFT modal → POP upload → admin reconciles → paywall dissolves with Framer Motion animation. Seed must be expanded: add Spaza Sandton/Boksburg projects, update Durbanville to OPERATIONAL, add EnterpriseLicense for Spaza, PlatformBankAccount.

**Tech Stack:** Next.js 15 App Router, Prisma 7, Framer Motion (already installed), TypeScript strict, Server Components default, Server Actions for mutations.

---

## File Map

**New files:**
- `lib/payments/rail.ts` — suggestPaymentRail, PaymentPurpose type
- `lib/payments/reference.ts` — generatePaymentReference
- `lib/payments/invoice.ts` — createOmLicenseInvoice helper
- `server/queries/payments.ts` — getPaymentsForReconciliation, getClientOffers, getEpcCommissions, getEnterpriseLicenses
- `server/actions/payments.ts` — sellLicenseToClient, selfActivateLicense, acceptLicenseOffer, uploadProofOfPayment, reconcilePayment, addProjectToEnterpriseScope
- `components/payments/eft-instructions-modal.tsx` — banking details + reference + POP upload zone
- `components/payments/license-activation-animation.tsx` — Framer Motion paywall → charts reveal
- `app/(app)/contractor/wallet/page.tsx` — token balance, commissions, transaction history
- `app/(app)/admin/enterprise/page.tsx` — Enterprise Accounts list + Spaza detail + add project

**Modified files:**
- `prisma/seed.ts` — add Sandton/Boksburg/Manchester projects, Durbanville OPERATIONAL, EnterpriseLicense, PlatformBankAccount, OmLicenses, commissions, historical invoices
- `app/(app)/client/plant/[siteId]/page.tsx` — pending offer state + activation animation
- `app/(app)/contractor/projects/[id]/monitoring/page.tsx` — EPC paywall with sell/activate CTAs
- `app/(app)/admin/financial/page.tsx` — real reconciliation queue
- `components/shell/sidebar.tsx` — add Enterprise nav item to ADMIN_NAV

---

## Task 1: Seed Expansion

**Files:** Modify `prisma/seed.ts`

This task brings the seed from 3 projects to 7, adds the EnterpriseLicense rows that power Act 4, and sets up the Durbanville activation demo (Act 3).

- [ ] **Step 1: Add new users and companies**

Find the `console.log('  ✓ Users')` line and add before it:

```typescript
  const tumi = await db.user.upsert({
    where: { email: 'tumi@bnsolar.co.za' },
    update: {},
    create: { email: 'tumi@bnsolar.co.za', name: 'Tumi Maboe', emailVerified: new Date(), passwordHash },
  })

  const johan = await db.user.upsert({
    where: { email: 'johan@solaracegroup.co.za' },
    update: {},
    create: { email: 'johan@solaracegroup.co.za', name: 'Johan Pretorius', emailVerified: new Date(), passwordHash },
  })
```

Find the `console.log('  ✓ Companies')` line and add before it:

```typescript
  const bnsolar = await db.company.upsert({
    where: { id: 'company-bnsolar' },
    update: {},
    create: {
      id: 'company-bnsolar',
      name: 'BN Solar',
      type: 'CONTRACTOR',
      registrationNo: '2024/098765/07',
      beeeLevel: 4,
      about: 'Residential and small commercial solar specialist based in Cape Town.',
      phone: '+27 21 555 0123',
      email: 'info@bnsolar.co.za',
    },
  })

  const solarace = await db.company.upsert({
    where: { id: 'company-solarace' },
    update: {},
    create: {
      id: 'company-solarace',
      name: 'Solar Ace Group',
      type: 'CONTRACTOR',
      registrationNo: '2012/445566/07',
      beeeLevel: 2,
      about: 'Large-scale C&I and utility solar EPC with 22 completed projects.',
      phone: '+27 31 456 7890',
      email: 'info@solaracegroup.co.za',
    },
  })

  const manchester = await db.company.upsert({
    where: { id: 'company-manchester' },
    update: {},
    create: {
      id: 'company-manchester',
      name: 'Manchester Restaurant Group',
      type: 'END_CLIENT',
      registrationNo: '2018/334455/06',
      about: 'Small restaurant group, 3 Sandton locations.',
      phone: '+27 11 883 1234',
      email: 'ops@manchesterrestaurants.co.za',
    },
  })
```

Find the `console.log('  ✓ Memberships')` line and add before it:

```typescript
  await db.membership.upsert({
    where: { userId_companyId: { userId: tumi.id, companyId: bnsolar.id } },
    update: {},
    create: { userId: tumi.id, companyId: bnsolar.id, role: 'CONTRACTOR', isOwner: true },
  })

  await db.membership.upsert({
    where: { userId_companyId: { userId: johan.id, companyId: solarace.id } },
    update: {},
    create: { userId: johan.id, companyId: solarace.id, role: 'CONTRACTOR', isOwner: true },
  })

  await db.tierStatus.upsert({
    where: { companyId: bnsolar.id },
    update: {},
    create: { companyId: bnsolar.id, tier: 'BRONZE', compliantProjectCount: 1, pointsToNextTier: 9 },
  })

  await db.tierStatus.upsert({
    where: { companyId: solarace.id },
    update: {},
    create: { companyId: solarace.id, tier: 'GOLD', compliantProjectCount: 22, pointsToNextTier: 3 },
  })

  await db.walletBalance.upsert({
    where: { companyId: bnsolar.id },
    update: {},
    create: { companyId: bnsolar.id, tokens: 1200, fiatCents: 0 },
  })

  await db.walletBalance.upsert({
    where: { companyId: solarace.id },
    update: {},
    create: { companyId: solarace.id, tokens: 48000, fiatCents: 0 },
  })
```

- [ ] **Step 2: Add new sites**

Find the `console.log('  ✓ Sites')` line and add before it:

```typescript
  const siteSandton = await db.site.upsert({
    where: { id: 'site-sandton' },
    update: {},
    create: {
      id: 'site-sandton',
      addressLine: '88 Maude Street',
      city: 'Sandton',
      province: 'Gauteng',
      latitude: -26.1076,
      longitude: 28.0567,
      irradianceKwhM2Day: 5.6,
    },
  })

  const siteBoksburg = await db.site.upsert({
    where: { id: 'site-boksburg' },
    update: {},
    create: {
      id: 'site-boksburg',
      addressLine: '14 Atlas Road',
      city: 'Boksburg',
      province: 'Gauteng',
      latitude: -26.2163,
      longitude: 28.2614,
      irradianceKwhM2Day: 5.7,
    },
  })

  const siteManchester = await db.site.upsert({
    where: { id: 'site-manchester' },
    update: {},
    create: {
      id: 'site-manchester',
      addressLine: '22 Rivonia Road',
      city: 'Sandton',
      province: 'Gauteng',
      latitude: -26.1052,
      longitude: 28.0578,
      irradianceKwhM2Day: 5.6,
    },
  })
```

- [ ] **Step 3: Add new projects**

Update `project-durbanville` — find its `upsert` and change the `update: {}` to include stage change, and add operational fields:

```typescript
  const projectDurbanville = await db.project.upsert({
    where: { id: 'project-durbanville' },
    update: {
      stage: 'OPERATIONAL',
      completionPercentage: 100,
      completedAt: daysAgo(21),
    },
    create: {
      id: 'project-durbanville',
      name: 'Durbanville Mall Solar PPA',
      contractorCompanyId: adebayo.id,
      clientCompanyId: durbanville.id,
      siteId: siteDurbanville.id,
      technology: 'SOLAR_PV',
      gridConnectionStatus: 'GRID_TIED',
      systemSizeKw: 290,
      dealStructure: 'PPA',
      ppaTariffCents: 185,
      stage: 'OPERATIONAL',
      templateSnapshot,
      templateVersion: 1,
      clientNeeds: 'Long-term energy cost certainty. Mall operates 6am–10pm seven days a week.',
      completionPercentage: 100,
      completedAt: daysAgo(21),
    },
  })
```

After the existing project upserts, add:

```typescript
  const projectSandton = await db.project.upsert({
    where: { id: 'project-sandton' },
    update: {},
    create: {
      id: 'project-sandton',
      name: 'Spaza Sandton Office Solar',
      contractorCompanyId: adebayo.id,
      clientCompanyId: spaza.id,
      siteId: siteSandton.id,
      technology: 'SOLAR_PV',
      gridConnectionStatus: 'GRID_TIED',
      systemSizeKw: 220,
      dealStructure: 'PPA',
      ppaTariffCents: 192,
      stage: 'OPERATIONAL',
      templateSnapshot: [],
      templateVersion: 1,
      clientNeeds: 'Reduce grid reliance at flagship Sandton office. ESG reporting requirement.',
      completionPercentage: 100,
      completedAt: daysAgo(545),
    },
  })

  const projectBoksburg = await db.project.upsert({
    where: { id: 'project-boksburg' },
    update: {},
    create: {
      id: 'project-boksburg',
      name: 'Spaza Boksburg Warehouse Solar + BESS',
      contractorCompanyId: adebayo.id,
      clientCompanyId: spaza.id,
      siteId: siteBoksburg.id,
      technology: 'HYBRID',
      gridConnectionStatus: 'GRID_TIED_WITH_BACKUP',
      systemSizeKw: 850,
      storageSizeKwh: 800,
      dealStructure: 'PPA',
      ppaTariffCents: 188,
      stage: 'OPERATIONAL',
      templateSnapshot: [],
      templateVersion: 1,
      clientNeeds: 'Cold chain backup power and peak demand reduction for distribution warehouse.',
      completionPercentage: 100,
      completedAt: daysAgo(28),
    },
  })

  await db.project.upsert({
    where: { id: 'project-manchester' },
    update: {},
    create: {
      id: 'project-manchester',
      name: 'Manchester Sandton Restaurant Solar',
      contractorCompanyId: adebayo.id,
      clientCompanyId: manchester.id,
      siteId: siteManchester.id,
      technology: 'SOLAR_PV',
      gridConnectionStatus: 'GRID_TIED',
      systemSizeKw: 35,
      dealStructure: 'OUTRIGHT',
      contractValueCents: 42_000_00,
      stage: 'OPERATIONAL',
      templateSnapshot: [],
      templateVersion: 1,
      clientNeeds: 'Reduce electricity costs. Client did not want the monitoring dashboard.',
      completionPercentage: 100,
      completedAt: daysAgo(200),
    },
  })

  console.log('  ✓ Projects (expanded)')
```

- [ ] **Step 4: Seed O&M readings for new OPERATIONAL projects**

After the existing O&M readings block (for Kruger), add:

```typescript
  // O&M readings for Sandton (18 months operational — use last 30 days)
  for (let i = 29; i >= 0; i--) {
    const d = daysAgo(i)
    const base = 880 + Math.sin(i * 0.3) * 120
    await db.omReading.upsert({
      where: { id: `reading-sandton-${i}` },
      update: {},
      create: {
        id: `reading-sandton-${i}`,
        projectId: projectSandton.id,
        inverterBrand: 'Victron',
        recordedAt: d,
        productionKwh: Math.round((base + Math.random() * 80) * 10) / 10,
        batterySoCPercent: null,
        consumptionKwh: Math.round((base * 0.75 + Math.random() * 60) * 10) / 10,
        irradianceWM2: Math.round(680 + Math.sin(i * 0.4) * 200 + Math.random() * 100),
      },
    })
  }

  // O&M readings for Boksburg (just commissioned — 28 days)
  for (let i = 27; i >= 0; i--) {
    const d = daysAgo(i)
    const base = 3400 + Math.sin(i * 0.25) * 500
    await db.omReading.upsert({
      where: { id: `reading-boksburg-${i}` },
      update: {},
      create: {
        id: `reading-boksburg-${i}`,
        projectId: projectBoksburg.id,
        inverterBrand: 'SunSynk',
        recordedAt: d,
        productionKwh: Math.round((base + Math.random() * 200) * 10) / 10,
        batterySoCPercent: Math.round(55 + Math.sin(i * 0.5) * 30 + Math.random() * 15),
        consumptionKwh: Math.round((base * 0.82 + Math.random() * 150) * 10) / 10,
        irradianceWM2: Math.round(700 + Math.sin(i * 0.35) * 220 + Math.random() * 120),
      },
    })
  }

  // O&M readings for Durbanville (just commissioned — 21 days)
  for (let i = 20; i >= 0; i--) {
    const d = daysAgo(i)
    const base = 1160 + Math.sin(i * 0.4) * 180
    await db.omReading.upsert({
      where: { id: `reading-durbanville-${i}` },
      update: {},
      create: {
        id: `reading-durbanville-${i}`,
        projectId: projectDurbanville.id,
        inverterBrand: 'Deye',
        recordedAt: d,
        productionKwh: Math.round((base + Math.random() * 100) * 10) / 10,
        batterySoCPercent: null,
        consumptionKwh: Math.round((base * 0.8 + Math.random() * 80) * 10) / 10,
        irradianceWM2: Math.round(640 + Math.sin(i * 0.4) * 190 + Math.random() * 80),
      },
    })
  }

  console.log('  ✓ O&M readings (Sandton, Boksburg, Durbanville)')
```

- [ ] **Step 5: Seed PlatformBankAccount + EnterpriseLicense + OmLicenses**

After the O&M readings block, add:

```typescript
  // -------------------------------------------------------------------------
  // Platform bank account (shown in EFT instructions modal)
  // -------------------------------------------------------------------------

  await db.platformBankAccount.upsert({
    where: { id: 'bank-see-fnb' },
    update: {},
    create: {
      id: 'bank-see-fnb',
      accountName: 'SEE Platform Operations (Pty) Ltd',
      bankName: 'First National Bank',
      accountNumber: '62850012345',
      branchCode: '250655',
      accountType: 'Business Cheque',
      swiftCode: 'FIRNZAJJ',
      isActive: true,
      notes: 'Primary ZAR account for all platform receipts',
    },
  })

  console.log('  ✓ Platform bank account')

  // -------------------------------------------------------------------------
  // Enterprise License — Spaza Holdings (ACTIVE, covers Soweto + Sandton)
  // Boksburg is deliberately excluded — Act 4 demo moment adds it live
  // -------------------------------------------------------------------------

  const enterpriseLicense = await db.enterpriseLicense.upsert({
    where: { contractReference: 'ENT-2025-SPAZA-001' },
    update: {},
    create: {
      id: 'enterprise-spaza',
      clientCompanyId: spaza.id,
      status: 'ACTIVE',
      contractReference: 'ENT-2025-SPAZA-001',
      contractStartDate: daysAgo(240),
      reviewCadence: 'ANNUAL',
      nextReviewDate: daysFromNow(125),
      baseMonthlyFeeCents: 850_000,
      perSeatMonthlyFeeCents: 25_000,
      perIntegrationFees: { OUTBOUND_WEBHOOK: 120_000, SCHEDULED_EXPORT: 80_000 },
      usageRates: { apiCallsPer1000Cents: 50 },
      oneTimeSetupFeeCents: 500_000,
      oneTimeSetupInvoiced: true,
      resellerCompanyId: adebayo.id,
      negotiatedCommissionRate: 0.10,
      notes: 'MSA signed 2025-09-20. Annual review. API + webhook + scheduled export enabled. Adebayo earns 10% commission.',
      activatedAt: daysAgo(240),
    },
  })

  // Project scopes: Soweto + Sandton (NOT Boksburg)
  await db.enterpriseProjectScope.upsert({
    where: { licenseId_projectId: { licenseId: enterpriseLicense.id, projectId: projectAlpha.id } },
    update: {},
    create: { licenseId: enterpriseLicense.id, projectId: projectAlpha.id },
  })

  await db.enterpriseProjectScope.upsert({
    where: { licenseId_projectId: { licenseId: enterpriseLicense.id, projectId: projectSandton.id } },
    update: {},
    create: { licenseId: enterpriseLicense.id, projectId: projectSandton.id },
  })

  // Enterprise integrations
  await db.enterpriseIntegration.upsert({
    where: { id: 'ent-int-webhook' },
    update: {},
    create: {
      id: 'ent-int-webhook',
      licenseId: enterpriseLicense.id,
      type: 'OUTBOUND_WEBHOOK',
      status: 'ACTIVE',
      config: { url: 'https://erp.spazaholdings.co.za/webhooks/see', events: ['alert.raised', 'milestone.hit'] },
      lastActivityAt: daysAgo(1),
      monthlyFeeCents: 120_000,
    },
  })

  await db.enterpriseIntegration.upsert({
    where: { id: 'ent-int-export' },
    update: {},
    create: {
      id: 'ent-int-export',
      licenseId: enterpriseLicense.id,
      type: 'SCHEDULED_EXPORT',
      status: 'ACTIVE',
      config: { destination: 's3://spaza-analytics/see/', format: 'CSV', schedule: 'daily 01:00' },
      lastActivityAt: daysAgo(1),
      monthlyFeeCents: 80_000,
    },
  })

  // Enterprise usage records (current month)
  await db.enterpriseUsageRecord.upsert({
    where: { licenseId_period_metric: { licenseId: enterpriseLicense.id, period: new Date('2026-05-01'), metric: 'API_CALLS' } },
    update: {},
    create: {
      licenseId: enterpriseLicense.id,
      period: new Date('2026-05-01'),
      metric: 'API_CALLS',
      units: 47392,
      billedCents: Math.round(47392 / 1000 * 50),
    },
  })

  await db.enterpriseUsageRecord.upsert({
    where: { licenseId_period_metric: { licenseId: enterpriseLicense.id, period: new Date('2026-05-01'), metric: 'WEBHOOK_DELIVERIES' } },
    update: {},
    create: {
      licenseId: enterpriseLicense.id,
      period: new Date('2026-05-01'),
      metric: 'WEBHOOK_DELIVERIES',
      units: 1284,
      billedCents: 0,
    },
  })

  console.log('  ✓ Enterprise license (Spaza Holdings — Soweto + Sandton in scope)')

  // -------------------------------------------------------------------------
  // OmLicenses for operational projects
  // -------------------------------------------------------------------------

  // Sandton: EPC + CLIENT both ACTIVE (Adebayo resells, earns commission)
  // EPC bundled (monthlyFeeCents=0)
  await db.omLicense.upsert({
    where: { id: 'license-sandton-epc' },
    update: {},
    create: {
      id: 'license-sandton-epc',
      projectId: projectSandton.id,
      licenseeCompanyId: adebayo.id,
      viewerType: 'EPC',
      tier: 'AI',
      status: 'ACTIVE',
      monthlyFeeCents: 0,
      activatedAt: daysAgo(540),
      nextBillingAt: daysFromNow(20),
    },
  })

  await db.omLicense.upsert({
    where: { id: 'license-sandton-client' },
    update: {},
    create: {
      id: 'license-sandton-client',
      projectId: projectSandton.id,
      licenseeCompanyId: spaza.id,
      viewerType: 'CLIENT',
      tier: 'AI',
      status: 'ACTIVE',
      monthlyFeeCents: 180_000,
      activatedAt: daysAgo(540),
      nextBillingAt: daysFromNow(20),
      resellerCompanyId: adebayo.id,
      commissionRate: 0.20,
    },
  })

  // Manchester: EPC ACTIVE (basic, self-licensed Flow B), CLIENT INACTIVE
  await db.omLicense.upsert({
    where: { id: 'license-manchester-epc' },
    update: {},
    create: {
      id: 'license-manchester-epc',
      projectId: 'project-manchester',
      licenseeCompanyId: adebayo.id,
      viewerType: 'EPC',
      tier: 'BASIC',
      status: 'ACTIVE',
      monthlyFeeCents: 35_000,
      activatedAt: daysAgo(190),
      nextBillingAt: daysFromNow(10),
    },
  })

  // Durbanville: both INACTIVE (demo activation moment)
  // (No rows needed for INACTIVE — that's the default/absence state)

  // Boksburg: both INACTIVE (Act 4 demo — adding to Enterprise scope)
  // (No rows needed)

  console.log('  ✓ O&M licenses')

  // -------------------------------------------------------------------------
  // LicenseCommission records — Sandton (ongoing, Adebayo earns 20%)
  // -------------------------------------------------------------------------

  const commissionMonths = [
    { period: new Date('2025-12-01'), status: 'PAID' as const, paidAt: daysAgo(135) },
    { period: new Date('2026-01-01'), status: 'PAID' as const, paidAt: daysAgo(104) },
    { period: new Date('2026-02-01'), status: 'PAID' as const, paidAt: daysAgo(76) },
    { period: new Date('2026-03-01'), status: 'PAID' as const, paidAt: daysAgo(45) },
    { period: new Date('2026-04-01'), status: 'PAID' as const, paidAt: daysAgo(14) },
    { period: new Date('2026-05-01'), status: 'ACCRUED' as const, paidAt: null },
  ]

  for (const cm of commissionMonths) {
    await db.licenseCommission.upsert({
      where: { licenseId_period: { licenseId: 'license-sandton-client', period: cm.period } },
      update: {},
      create: {
        licenseId: 'license-sandton-client',
        resellerCompanyId: adebayo.id,
        period: cm.period,
        amountCents: 36_000, // 20% of R 1,800
        status: cm.status,
        paidAt: cm.paidAt,
      },
    })
  }

  console.log('  ✓ License commissions (Sandton — 5 paid, 1 accrued)')

  // -------------------------------------------------------------------------
  // Historical invoices + payments for context
  // -------------------------------------------------------------------------

  // Invoice: Kruger Farm AI license activation (paid 6 months ago via EFT)
  const invKruger = await db.invoice.upsert({
    where: { invoiceNumber: 'SEE-INV-2025-0001' },
    update: {},
    create: {
      id: 'inv-kruger-activation',
      invoiceNumber: 'SEE-INV-2025-0001',
      issuerType: 'PLATFORM',
      issuerCompanyId: null,
      recipientCompanyId: kruger.id,
      status: 'PAID',
      subtotalCents: 120_000,
      vatRate: 0.15,
      vatCents: 18_000,
      totalCents: 138_000,
      issuedAt: daysAgo(185),
      dueDate: daysAgo(178),
      paidAt: daysAgo(177),
      notes: 'O&M AI License activation — Kruger Farm Hybrid System',
      lineItems: {
        create: [{
          description: 'O&M AI License — Kruger Farm Hybrid System (first month)',
          quantity: 1,
          unitPriceCents: 120_000,
          totalCents: 120_000,
          type: 'OM_LICENSE_ACTIVATION',
          relatedEntityId: 'license-kruger-ai',
        }],
      },
      payments: {
        create: [{
          id: 'pay-kruger-activation',
          rail: 'EFT',
          amountCents: 138_000,
          status: 'PAID',
          reference: 'SEE-KR001-2025',
          reconciledAt: daysAgo(177),
          bankReference: 'SEE-KR001-2025',
          expiresAt: daysAgo(178 - 7),
        }],
      },
    },
  })

  console.log('  ✓ Historical invoices + payments')
```

- [ ] **Step 6: Update summary log and run seed**

Find `console.log(\`   Users: 6 | ...)` and update to:

```typescript
  console.log(`   Users: 8 | Companies: 9 | Projects: 7 | O&M readings: 110 | Enterprise license: 1`)
```

Run:
```bash
npm run db:seed:demo
```
Expected output includes `✓ Enterprise license (Spaza Holdings`, `✓ O&M licenses`, `✓ License commissions`.

- [ ] **Step 7: Typecheck**

```bash
npm run typecheck
```
Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat(m9): seed expansion — Sandton/Boksburg/Durbanville OPERATIONAL, EnterpriseLicense, OmLicenses, commissions"
```

---

## Task 2: Payment Infrastructure

**Files:**
- Create: `lib/payments/rail.ts`
- Create: `lib/payments/reference.ts`
- Create: `lib/payments/invoice.ts`

- [ ] **Step 1: Create `lib/payments/rail.ts`**

```typescript
// lib/payments/rail.ts

export type PaymentPurpose =
  | 'OM_LICENSE'
  | 'HARDWARE'
  | 'ESCROW'
  | 'SUBSCRIPTION'
  | 'TOKEN_PURCHASE'

export type PaymentRail = 'EFT' | 'PAYFAST'

export function suggestPaymentRail(amountCents: number, purpose: PaymentPurpose): PaymentRail {
  if (purpose === 'TOKEN_PURCHASE') return 'PAYFAST'
  if (purpose === 'SUBSCRIPTION') return 'PAYFAST'
  if (amountCents < 1_000_000) return 'PAYFAST'
  return 'EFT'
}

export function formatZAR(cents: number): string {
  return `R ${(cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
```

- [ ] **Step 2: Create `lib/payments/reference.ts`**

```typescript
// lib/payments/reference.ts

export function generatePaymentReference(): string {
  const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const random = Array.from(
    { length: 6 },
    () => CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join('')
  const year = new Date().getFullYear()
  return `SEE-${random}-${year}`
}
```

- [ ] **Step 3: Create `lib/payments/invoice.ts`**

```typescript
// lib/payments/invoice.ts

import { db } from '@/lib/db'
import { generatePaymentReference } from './reference'
import type { OmLicenseTier } from '@/lib/generated/prisma/client'

const VAT_RATE = 0.15

function nextInvoiceNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 90000) + 10000
  return `SEE-INV-${year}-${random}`
}

export async function createOmLicenseInvoice({
  licenseId,
  recipientCompanyId,
  tier,
  monthlyFeeCents,
}: {
  licenseId: string
  recipientCompanyId: string
  tier: OmLicenseTier
  monthlyFeeCents: number
}) {
  const subtotalCents = monthlyFeeCents
  const vatCents = Math.round(subtotalCents * VAT_RATE)
  const totalCents = subtotalCents + vatCents
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 7)

  const invoice = await db.invoice.create({
    data: {
      invoiceNumber: nextInvoiceNumber(),
      issuerType: 'PLATFORM',
      issuerCompanyId: null,
      recipientCompanyId,
      status: 'AWAITING_PAYMENT',
      subtotalCents,
      vatRate: VAT_RATE,
      vatCents,
      totalCents,
      dueDate,
      notes: `O&M ${tier} License activation (first month)`,
      lineItems: {
        create: [{
          description: `O&M ${tier} License — activation (first month)`,
          quantity: 1,
          unitPriceCents: monthlyFeeCents,
          totalCents: monthlyFeeCents,
          type: 'OM_LICENSE_ACTIVATION',
          relatedEntityId: licenseId,
        }],
      },
      payments: {
        create: [{
          rail: 'EFT',
          amountCents: totalCents,
          status: 'AWAITING_PROOF',
          reference: generatePaymentReference(),
          expiresAt: (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d })(),
        }],
      },
    },
    include: { payments: true },
  })

  return { invoice, payment: invoice.payments[0]! }
}
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add lib/payments/
git commit -m "feat(m9): payment infrastructure — rail selector, reference generator, invoice factory"
```

---

## Task 3: Server Queries + Actions

**Files:**
- Create: `server/queries/payments.ts`
- Create: `server/actions/payments.ts`

- [ ] **Step 1: Create `server/queries/payments.ts`**

```typescript
// server/queries/payments.ts

import { db } from '@/lib/db'

export async function getPaymentsForReconciliation() {
  return db.payment.findMany({
    where: { status: 'AWAITING_RECONCILIATION' },
    include: {
      invoice: {
        include: {
          lineItems: true,
          recipientCompany: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function getClientPendingOffers(companyId: string) {
  return db.licenseOffer.findMany({
    where: { proposedToCompanyId: companyId, status: 'PENDING' },
    include: {
      license: {
        select: {
          id: true,
          tier: true,
          monthlyFeeCents: true,
          projectId: true,
          project: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getProjectPendingOffer(projectId: string, companyId: string) {
  return db.licenseOffer.findFirst({
    where: {
      proposedToCompanyId: companyId,
      status: 'PENDING',
      license: { projectId, viewerType: 'CLIENT' },
    },
    include: {
      license: { select: { id: true, tier: true, monthlyFeeCents: true } },
    },
  })
}

export async function getEpcLicense(projectId: string, companyId: string) {
  return db.omLicense.findFirst({
    where: { projectId, licenseeCompanyId: companyId, viewerType: 'EPC', status: 'ACTIVE' },
    select: { id: true, tier: true },
  })
}

export async function getEpcCommissions(companyId: string) {
  const commissions = await db.licenseCommission.findMany({
    where: { resellerCompanyId: companyId },
    include: {
      license: {
        select: {
          tier: true,
          monthlyFeeCents: true,
          project: { select: { name: true } },
        },
      },
    },
    orderBy: { period: 'desc' },
    take: 24,
  })

  const totalEarned = commissions.reduce((s, c) => s + c.amountCents, 0)
  const accrued = commissions
    .filter((c) => c.status === 'ACCRUED')
    .reduce((s, c) => s + c.amountCents, 0)

  return { commissions, totalEarned, accrued }
}

export async function getEpcLicensesSold(companyId: string) {
  return db.omLicense.findMany({
    where: { resellerCompanyId: companyId, viewerType: 'CLIENT', status: 'ACTIVE' },
    include: {
      project: { select: { name: true, stage: true } },
      licenseeCompany: { select: { name: true } },
    },
    orderBy: { activatedAt: 'desc' },
  })
}

export async function getEnterpriseLicenses() {
  return db.enterpriseLicense.findMany({
    include: {
      clientCompany: { select: { name: true } },
      projectScopes: { include: { project: { select: { id: true, name: true, stage: true } } } },
      integrations: { select: { id: true, type: true, status: true } },
      seats: { select: { id: true, isActive: true } },
    },
    orderBy: { activatedAt: 'desc' },
  })
}

export async function getEnterpriseLicenseById(id: string) {
  return db.enterpriseLicense.findUnique({
    where: { id },
    include: {
      clientCompany: { select: { id: true, name: true } },
      projectScopes: {
        include: { project: { select: { id: true, name: true, stage: true, site: { select: { city: true } } } } },
      },
      integrations: true,
      seats: { include: { user: { select: { name: true, email: true } } } },
      usageRecords: { orderBy: { period: 'desc' }, take: 6 },
    },
  })
}

export async function getProjectsNotInEnterpriseScope(licenseId: string, clientCompanyId: string) {
  const inScope = await db.enterpriseProjectScope.findMany({
    where: { licenseId },
    select: { projectId: true },
  })
  const inScopeIds = inScope.map((s) => s.projectId)

  return db.project.findMany({
    where: {
      clientCompanyId,
      id: { notIn: inScopeIds },
      deletedAt: null,
    },
    select: { id: true, name: true, stage: true },
    orderBy: { createdAt: 'desc' },
  })
}
```

- [ ] **Step 2: Create `server/actions/payments.ts`**

```typescript
'use server'
// server/actions/payments.ts

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { createOmLicenseInvoice } from '@/lib/payments/invoice'
import type { OmLicenseTier } from '@/lib/generated/prisma/client'

// EPC initiates a license sale to the client (Flow A)
export async function sellLicenseToClient(
  projectId: string,
  tier: OmLicenseTier,
  monthlyFeeCents: number,
  message?: string
) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { contractorCompanyId: true, clientCompanyId: true },
  })
  if (!project || project.contractorCompanyId !== session.user.companyId) {
    throw new Error('Not authorized for this project')
  }
  if (!project.clientCompanyId) throw new Error('Project has no client company')

  // Create the OmLicense in PENDING_PAYMENT
  const license = await db.omLicense.create({
    data: {
      projectId,
      licenseeCompanyId: project.clientCompanyId,
      viewerType: 'CLIENT',
      tier,
      status: 'PENDING_PAYMENT',
      monthlyFeeCents,
      resellerCompanyId: session.user.companyId,
      commissionRate: 0.20,
    },
  })

  // Create the LicenseOffer
  await db.licenseOffer.create({
    data: {
      licenseId: license.id,
      proposedByCompanyId: session.user.companyId,
      proposedToCompanyId: project.clientCompanyId,
      tier,
      monthlyFeeCents,
      commissionRateOffered: 0.20,
      message: message ?? null,
      status: 'PENDING',
    },
  })

  revalidatePath(`/contractor/projects/${projectId}/monitoring`)
}

// EPC self-activates their own EPC-view license (Flow B)
export async function selfActivateLicense(projectId: string, tier: OmLicenseTier) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { contractorCompanyId: true },
  })
  if (!project || project.contractorCompanyId !== session.user.companyId) {
    throw new Error('Not authorized for this project')
  }

  const monthlyFeeCents = tier === 'BASIC' ? 35_000 : tier === 'PREMIUM' ? 85_000 : 120_000

  const license = await db.omLicense.create({
    data: {
      projectId,
      licenseeCompanyId: session.user.companyId,
      viewerType: 'EPC',
      tier,
      status: 'PENDING_PAYMENT',
      monthlyFeeCents,
    },
  })

  const { payment } = await createOmLicenseInvoice({
    licenseId: license.id,
    recipientCompanyId: session.user.companyId,
    tier,
    monthlyFeeCents,
  })

  revalidatePath(`/contractor/projects/${projectId}/monitoring`)
  return { paymentId: payment.id, reference: payment.reference!, amountCents: payment.amountCents }
}

// Client accepts a license offer — creates invoice + payment, returns payment details for EFT modal
export async function acceptLicenseOffer(offerId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const offer = await db.licenseOffer.findUnique({
    where: { id: offerId },
    include: { license: { select: { id: true, tier: true, monthlyFeeCents: true, projectId: true } } },
  })
  if (!offer || offer.proposedToCompanyId !== session.user.companyId) {
    throw new Error('Offer not found or not authorized')
  }
  if (offer.status !== 'PENDING') throw new Error('Offer is no longer pending')

  // Mark offer accepted
  await db.licenseOffer.update({ where: { id: offerId }, data: { status: 'ACCEPTED', respondedAt: new Date() } })

  // Create invoice + EFT payment
  const { payment } = await createOmLicenseInvoice({
    licenseId: offer.license.id,
    recipientCompanyId: session.user.companyId,
    tier: offer.license.tier,
    monthlyFeeCents: offer.license.monthlyFeeCents,
  })

  revalidatePath(`/client/plant/${offer.license.projectId}`)
  return { paymentId: payment.id, reference: payment.reference!, amountCents: payment.amountCents }
}

// Client uploads proof of payment
export async function uploadProofOfPayment(paymentId: string, proofUrl: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  await db.payment.update({
    where: { id: paymentId },
    data: { proofOfPaymentUrl: proofUrl, status: 'AWAITING_RECONCILIATION' },
  })

  revalidatePath('/admin/financial')
}

// Admin reconciles a payment — the key action that activates the license
export async function reconcilePayment(paymentId: string, bankReference?: string) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') throw new Error('Admin only')

  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: {
      invoice: {
        include: {
          lineItems: true,
          recipientCompany: { select: { id: true } },
        },
      },
    },
  })
  if (!payment) throw new Error('Payment not found')

  const licenseLineItem = payment.invoice.lineItems.find(
    (li) => li.type === 'OM_LICENSE_ACTIVATION' && li.relatedEntityId
  )

  await db.$transaction(async (tx) => {
    // 1. Mark payment PAID
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        reconciledAt: new Date(),
        reconciledByUserId: session.user.id,
        bankReference: bankReference ?? null,
      },
    })

    // 2. Mark invoice PAID
    await tx.invoice.update({
      where: { id: payment.invoiceId },
      data: { status: 'PAID', paidAt: new Date() },
    })

    // 3. Activate the OmLicense (if this is a license activation invoice)
    if (licenseLineItem?.relatedEntityId) {
      const licenseId = licenseLineItem.relatedEntityId
      const nextBillingAt = new Date()
      nextBillingAt.setDate(nextBillingAt.getDate() + 30)

      const activatedLicense = await tx.omLicense.update({
        where: { id: licenseId },
        data: { status: 'ACTIVE', activatedAt: new Date(), nextBillingAt },
        select: { resellerCompanyId: true, commissionRate: true, monthlyFeeCents: true, viewerType: true, projectId: true },
      })

      // 4. Bundle EPC license for free (Flow A: CLIENT license → create EPC license for reseller)
      if (activatedLicense.viewerType === 'CLIENT' && activatedLicense.resellerCompanyId) {
        const existingEpc = await tx.omLicense.findFirst({
          where: { projectId: activatedLicense.projectId, viewerType: 'EPC', licenseeCompanyId: activatedLicense.resellerCompanyId },
        })
        if (!existingEpc) {
          await tx.omLicense.create({
            data: {
              projectId: activatedLicense.projectId,
              licenseeCompanyId: activatedLicense.resellerCompanyId,
              viewerType: 'EPC',
              tier: 'AI', // bundled EPC gets AI tier
              status: 'ACTIVE',
              monthlyFeeCents: 0,
              activatedAt: new Date(),
              nextBillingAt,
            },
          })
        }

        // 5. Credit commission
        if (activatedLicense.commissionRate && activatedLicense.monthlyFeeCents) {
          const commissionCents = Math.round(activatedLicense.monthlyFeeCents * activatedLicense.commissionRate)
          const period = new Date()
          period.setDate(1)
          period.setHours(0, 0, 0, 0)

          await tx.licenseCommission.create({
            data: {
              licenseId,
              resellerCompanyId: activatedLicense.resellerCompanyId,
              period,
              amountCents: commissionCents,
              status: 'ACCRUED',
            },
          })
        }
      }
    }
  })

  revalidatePath('/admin/financial')
  revalidatePath('/contractor/wallet')
  revalidatePath('/client')
}

// Admin adds a project to an Enterprise license scope
export async function addProjectToEnterpriseScope(licenseId: string, projectId: string) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') throw new Error('Admin only')

  await db.enterpriseProjectScope.create({
    data: { licenseId, projectId },
  })

  revalidatePath('/admin/enterprise')
  revalidatePath('/client/enterprise/operations')
}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add server/queries/payments.ts server/actions/payments.ts
git commit -m "feat(m9): payment queries and actions — sell-to-client, accept-offer, upload-POP, reconcile"
```

---

## Task 4: EFT Instructions Modal + Activation Animation

**Files:**
- Create: `components/payments/eft-instructions-modal.tsx`
- Create: `components/payments/license-activation-animation.tsx`

- [ ] **Step 1: Create `components/payments/eft-instructions-modal.tsx`**

```typescript
'use client'
// components/payments/eft-instructions-modal.tsx

import { useState, useTransition } from 'react'
import { Copy, CheckCircle, Loader2, X } from 'lucide-react'
import { uploadProofOfPayment } from '@/server/actions/payments'
import { formatZAR } from '@/lib/payments/rail'
import { cn } from '@/lib/utils'

const BANK = {
  accountName: 'SEE Platform Operations (Pty) Ltd',
  bank: 'First National Bank',
  accountNumber: '62850012345',
  branchCode: '250655',
  accountType: 'Business Cheque',
}

type Props = {
  paymentId: string
  reference: string
  amountCents: number
  onClose: () => void
  onReconciled: () => void
}

export function EftInstructionsModal({ paymentId, reference, amountCents, onClose, onReconciled }: Props) {
  const [copied, setCopied] = useState<string | null>(null)
  const [proofUrl, setProofUrl] = useState('')
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)

  function copy(text: string, key: string) {
    void navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  function handleSubmitPop() {
    if (!proofUrl.trim()) return
    startTransition(async () => {
      await uploadProofOfPayment(paymentId, proofUrl.trim())
      setSubmitted(true)
      setTimeout(() => { onClose(); onReconciled() }, 2500)
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl border border-ink-200 shadow-2xl w-full max-w-[520px] p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ink-900">Pay via EFT</p>
            <p className="text-xs text-ink-500 mt-0.5">Transfer {formatZAR(amountCents)} using the details below</p>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 transition-colors">
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Banking details */}
        <div className="rounded-lg border border-ink-200 bg-ink-25 divide-y divide-ink-100">
          {[
            { label: 'Account name', value: BANK.accountName },
            { label: 'Bank', value: BANK.bank },
            { label: 'Account number', value: BANK.accountNumber, copyKey: 'acc' },
            { label: 'Branch code', value: BANK.branchCode, copyKey: 'branch' },
            { label: 'Account type', value: BANK.accountType },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-ink-500">{row.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-ink-900 font-mono">{row.value}</span>
                {row.copyKey && (
                  <button onClick={() => copy(row.value, row.copyKey!)} className="text-ink-400 hover:text-ink-700">
                    {copied === row.copyKey
                      ? <CheckCircle className="h-3.5 w-3.5 text-success-500" />
                      : <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
                    }
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Reference (highlighted) */}
        <div className="rounded-lg border-2 border-accent-400 bg-accent-500/5 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-accent-600">Payment reference</p>
              <p className="text-lg font-semibold text-ink-900 font-mono mt-0.5">{reference}</p>
            </div>
            <button onClick={() => copy(reference, 'ref')} className={cn('flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border transition-colors', copied === 'ref' ? 'bg-success-500/10 text-success-600 border-success-500/20' : 'bg-white text-ink-600 border-ink-200 hover:border-ink-400')}>
              {copied === 'ref' ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />}
              {copied === 'ref' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-accent-600/70 mt-1.5">Use this reference exactly — it is how your payment gets matched.</p>
        </div>

        {/* POP Upload */}
        {!submitted ? (
          <div className="space-y-3">
            <p className="text-xs text-ink-700 font-medium">Once you have made the transfer, upload your proof of payment:</p>
            <input
              type="url"
              placeholder="Paste proof of payment URL (bank screenshot or PDF link)"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            />
            <button
              onClick={handleSubmitPop}
              disabled={isPending || !proofUrl.trim()}
              className="w-full flex items-center justify-center gap-1.5 h-9 rounded-md bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 transition-colors disabled:opacity-40"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Submit proof of payment
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-success-500/20 bg-success-50/30 px-4 py-3">
            <CheckCircle className="h-5 w-5 text-success-500 flex-shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-ink-900">Proof of payment received</p>
              <p className="text-xs text-ink-500">Your payment is being processed. We will notify you once reconciled.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/payments/license-activation-animation.tsx`**

```typescript
'use client'
// components/payments/license-activation-animation.tsx
// Framer Motion sequence: paywall dissolves → charts reveal

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Unlock, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OmLicenseTier } from '@/lib/generated/prisma/client'

type Props = {
  tier: OmLicenseTier
  projectName: string
  onComplete: () => void
}

export function LicenseActivationAnimation({ tier, projectName, onComplete }: Props) {
  const [phase, setPhase] = useState<'unlock' | 'toast' | 'done'>('unlock')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('toast'), 800)
    const t2 = setTimeout(() => { setPhase('done'); onComplete() }, 3200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onComplete])

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md"
        >
          <div className="flex flex-col items-center gap-6 text-center">
            <motion.div
              initial={{ scale: 1 }}
              animate={phase === 'toast' ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] } : {}}
              transition={{ duration: 0.5 }}
              className="h-20 w-20 rounded-full bg-success-500/10 flex items-center justify-center"
            >
              {phase === 'unlock' ? (
                <Unlock className="h-9 w-9 text-success-600" strokeWidth={1.5} />
              ) : (
                <CheckCircle className="h-9 w-9 text-success-500" strokeWidth={1.5} />
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-1"
            >
              <p className="text-base font-semibold text-ink-900">
                {phase === 'unlock' ? 'Activating license...' : `${tier} License activated`}
              </p>
              <p className="text-sm text-ink-500">
                {phase === 'unlock'
                  ? `${projectName} — setting up your dashboard`
                  : 'Your plant monitoring dashboard is now live.'}
              </p>
            </motion.div>

            {phase === 'toast' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'rounded-lg border px-4 py-2.5 text-xs font-medium',
                  'border-success-500/20 bg-success-50/40 text-success-700'
                )}
              >
                Monthly fee R {tier === 'AI' ? '1,200' : tier === 'PREMIUM' ? '850' : '450'} · Next billing in 30 days
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add components/payments/
git commit -m "feat(m9): EFT instructions modal + license activation animation"
```

---

## Task 5: Client Plant Dashboard — Offer Acceptance + Activation

**Files:** Modify `app/(app)/client/plant/[siteId]/page.tsx`

Replace the full file with:

- [ ] **Step 1: Update `app/(app)/client/plant/[siteId]/page.tsx`**

```typescript
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getOmReadings, getActiveLicense } from '@/server/queries/client'
import { getProjectPendingOffer } from '@/server/queries/payments'
import { PlantCharts } from '@/components/client/plant-charts'
import { PaywallGate } from '@/components/client/paywall-gate'
import { OfferAcceptSection } from '@/components/client/offer-accept-section'

type Props = { params: Promise<{ siteId: string }> }

export default async function PlantDashboardPage({ params }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const { siteId } = await params
  const companyId = session.user.companyId

  const project = await db.project.findFirst({
    where: { siteId, clientCompanyId: companyId },
    include: {
      site: true,
      contractorCompany: { select: { name: true } },
    },
  })
  if (!project) notFound()

  const [license, pendingOffer, readings] = await Promise.all([
    getActiveLicense(project.id, companyId),
    getProjectPendingOffer(project.id, companyId),
    project.stage === 'OPERATIONAL' ? getOmReadings(project.id) : Promise.resolve([]),
  ])

  const isActive = !!license && project.stage === 'OPERATIONAL'

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-base font-semibold text-ink-900">{project.name}</h1>
          <p className="text-xs text-ink-500 mt-0.5">
            {project.site.addressLine}, {project.site.city} · {project.systemSizeKw} kW ·
            Managed by {project.contractorCompany.name}
          </p>
        </div>
        {license && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-success-500/10 text-success-600 flex-shrink-0">
            {license.tier} license active
          </span>
        )}
      </div>

      {/* Pending offer — accept + EFT flow */}
      {!isActive && pendingOffer && (
        <OfferAcceptSection
          offerId={pendingOffer.id}
          tier={pendingOffer.license.tier}
          monthlyFeeCents={pendingOffer.license.monthlyFeeCents}
          epcName={project.contractorCompany.name}
          projectName={project.name}
        />
      )}

      {/* No offer, no license — standard paywall */}
      {!isActive && !pendingOffer && (
        <PaywallGate projectName={project.name} epcName={project.contractorCompany.name} />
      )}

      {/* Active license — charts */}
      {isActive && readings.length > 0 && (
        <PlantCharts
          readings={readings.map((r) => ({
            recordedAt: r.recordedAt.toISOString(),
            productionKwh: r.productionKwh,
            batterySoCPercent: r.batterySoCPercent,
            consumptionKwh: r.consumptionKwh,
            irradianceWM2: r.irradianceWM2,
          }))}
          tier={license.tier}
        />
      )}

      {isActive && readings.length === 0 && (
        <div className="flex flex-col items-center py-12 text-center">
          <p className="text-sm font-medium text-ink-900">No readings yet</p>
          <p className="text-xs text-ink-500 mt-1">Monitoring data will appear once your inverter is connected.</p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create `components/client/offer-accept-section.tsx`**

This is a client component that handles the offer accept → EFT modal → activation animation flow:

```typescript
'use client'
// components/client/offer-accept-section.tsx

import { useState, useTransition } from 'react'
import { Zap } from 'lucide-react'
import { acceptLicenseOffer } from '@/server/actions/payments'
import { EftInstructionsModal } from '@/components/payments/eft-instructions-modal'
import { LicenseActivationAnimation } from '@/components/payments/license-activation-animation'
import { formatZAR } from '@/lib/payments/rail'
import type { OmLicenseTier } from '@/lib/generated/prisma/client'

type Props = {
  offerId: string
  tier: OmLicenseTier
  monthlyFeeCents: number
  epcName: string
  projectName: string
}

type EftState = { paymentId: string; reference: string; amountCents: number }

export function OfferAcceptSection({ offerId, tier, monthlyFeeCents, epcName, projectName }: Props) {
  const [isPending, startTransition] = useTransition()
  const [eftState, setEftState] = useState<EftState | null>(null)
  const [showAnimation, setShowAnimation] = useState(false)

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptLicenseOffer(offerId)
      setEftState(result)
    })
  }

  if (showAnimation) {
    return (
      <LicenseActivationAnimation
        tier={tier}
        projectName={projectName}
        onComplete={() => { window.location.reload() }}
      />
    )
  }

  return (
    <>
      <div className="rounded-xl border border-accent-300 bg-accent-500/5 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-accent-500/10 flex items-center justify-center flex-shrink-0">
            <Zap className="h-5 w-5 text-accent-600" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-900">
              {epcName} has proposed an O&M license for this site
            </p>
            <p className="text-xs text-ink-500 mt-0.5">
              {tier} tier · {formatZAR(monthlyFeeCents)}/month · Activate to unlock plant monitoring
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
          {[
            tier === 'BASIC' ? 'Live production data' : 'Everything in Basic',
            tier === 'AI' ? 'Prescriptive maintenance alerts' : tier === 'PREMIUM' ? '12-month analytics' : 'Battery SoC tracking',
            tier === 'AI' ? 'Fault prediction' : tier === 'PREMIUM' ? 'Maintenance scheduling' : 'Monthly performance report',
          ].map((f) => (
            <div key={f} className="flex items-center gap-1.5 text-ink-600">
              <span className="text-accent-500 font-bold">✓</span> {f}
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={handleAccept}
            disabled={isPending}
            className="flex items-center gap-1.5 h-9 px-4 rounded-md bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
          >
            <Zap className="h-4 w-4" strokeWidth={1.5} />
            Accept & pay {formatZAR(Math.round(monthlyFeeCents * 1.15))} via EFT
          </button>
          <button className="h-9 px-3 rounded-md border border-ink-200 text-ink-600 text-sm hover:bg-ink-50 transition-colors">
            View full proposal
          </button>
        </div>
      </div>

      {eftState && (
        <EftInstructionsModal
          paymentId={eftState.paymentId}
          reference={eftState.reference}
          amountCents={eftState.amountCents}
          onClose={() => setEftState(null)}
          onReconciled={() => { setEftState(null); setShowAnimation(true) }}
        />
      )}
    </>
  )
}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/client/plant/" "components/client/offer-accept-section.tsx"
git commit -m "feat(m9): client plant dashboard — pending offer acceptance + EFT flow + activation animation"
```

---

## Task 6: EPC Monitoring Tab — Paywall + Sell/Activate Flows

**Files:** Modify `app/(app)/contractor/projects/[id]/monitoring/page.tsx`

Replace the full file with:

- [ ] **Step 1: Create `components/contractor/epc-monitoring-paywall.tsx`**

```typescript
'use client'
// components/contractor/epc-monitoring-paywall.tsx

import { useState, useTransition } from 'react'
import { Lock, Zap, User } from 'lucide-react'
import { sellLicenseToClient, selfActivateLicense } from '@/server/actions/payments'
import { EftInstructionsModal } from '@/components/payments/eft-instructions-modal'
import { cn } from '@/lib/utils'
import type { OmLicenseTier } from '@/lib/generated/prisma/client'

const TIERS: { tier: OmLicenseTier; price: string; cents: number; features: string[] }[] = [
  { tier: 'BASIC', price: 'R 350/mo', cents: 35_000, features: ['Live monitoring', 'Battery SoC', 'Monthly report'] },
  { tier: 'PREMIUM', price: 'R 850/mo', cents: 85_000, features: ['Basic + analytics', 'Multi-brand', 'Maintenance calendar'], },
  { tier: 'AI', price: 'R 1,200/mo', cents: 120_000, features: ['Premium + prescriptive alerts', 'Fault prediction', 'Weather-aware BESS'] },
]

type Props = { projectId: string; hasClient: boolean }

type EftState = { paymentId: string; reference: string; amountCents: number }

export function EpcMonitoringPaywall({ projectId, hasClient }: Props) {
  const [selectedTier, setSelectedTier] = useState<OmLicenseTier>('AI')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<'pick' | 'sell-form' | 'self-form' | 'sent'>('pick')
  const [eftState, setEftState] = useState<EftState | null>(null)

  function handleSell() {
    startTransition(async () => {
      await sellLicenseToClient(projectId, selectedTier, TIERS.find(t => t.tier === selectedTier)!.cents, message)
      setMode('sent')
    })
  }

  function handleSelf() {
    startTransition(async () => {
      const result = await selfActivateLicense(projectId, selectedTier)
      setEftState(result)
    })
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col items-center text-center py-4 space-y-3">
        <div className="h-12 w-12 rounded-full bg-ink-100 flex items-center justify-center">
          <Lock className="h-5 w-5 text-ink-400" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-900">O&M Monitoring is licensed</p>
          <p className="text-xs text-ink-500 mt-1 max-w-xs">
            Activate an O&M license to access plant monitoring, maintenance tracking, and prescriptive insights for this site.
          </p>
        </div>
        {mode === 'pick' && (
          <div className="flex gap-3">
            {hasClient && (
              <button
                onClick={() => setMode('sell-form')}
                className="flex items-center gap-1.5 h-9 px-4 rounded-md bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 transition-colors"
              >
                <Zap className="h-4 w-4" strokeWidth={1.5} />
                Sell to client
              </button>
            )}
            <button
              onClick={() => setMode('self-form')}
              className="flex items-center gap-1.5 h-9 px-4 rounded-md border border-ink-200 text-ink-700 text-sm hover:bg-ink-50 transition-colors"
            >
              <User className="h-4 w-4" strokeWidth={1.5} />
              Activate for own use
            </button>
          </div>
        )}
      </div>

      {/* Tier selector */}
      {(mode === 'sell-form' || mode === 'self-form') && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-ink-700">Select tier</p>
          <div className="grid grid-cols-3 gap-3">
            {TIERS.map((t) => (
              <button
                key={t.tier}
                onClick={() => setSelectedTier(t.tier)}
                className={cn(
                  'rounded-lg border p-3 text-left transition-colors',
                  selectedTier === t.tier
                    ? 'border-accent-400 bg-accent-500/5'
                    : 'border-ink-200 bg-white hover:border-ink-300'
                )}
              >
                <p className="text-sm font-semibold text-ink-900">{t.tier}</p>
                <p className="text-xs font-medium text-ink-500 mt-0.5">{t.price}</p>
                <ul className="mt-2 space-y-1">
                  {t.features.map((f) => (
                    <li key={f} className="text-[10px] text-ink-500 flex items-start gap-1">
                      <span className="text-accent-500 font-bold mt-px">✓</span>{f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          {mode === 'sell-form' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-ink-700">Message to client (optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                placeholder="e.g., I recommend the AI tier given the BESS on this site — the prescriptive alerts will pay for themselves."
                className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 resize-none"
              />
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={mode === 'sell-form' ? handleSell : handleSelf}
              disabled={isPending}
              className="h-8 px-4 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
            >
              {mode === 'sell-form' ? 'Send proposal' : 'Proceed to payment'}
            </button>
            <button
              onClick={() => setMode('pick')}
              className="h-8 px-3 rounded-md border border-ink-200 text-ink-600 text-xs hover:bg-ink-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === 'sent' && (
        <div className="rounded-lg border border-success-500/20 bg-success-50/30 px-4 py-4 text-center space-y-1">
          <p className="text-sm font-semibold text-ink-900">Proposal sent</p>
          <p className="text-xs text-ink-500">Your client will receive an email and in-app notification. Once they accept and pay, both dashboards will activate automatically.</p>
        </div>
      )}

      {eftState && (
        <EftInstructionsModal
          paymentId={eftState.paymentId}
          reference={eftState.reference}
          amountCents={eftState.amountCents}
          onClose={() => setEftState(null)}
          onReconciled={() => { setEftState(null); window.location.reload() }}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update `app/(app)/contractor/projects/[id]/monitoring/page.tsx`**

```typescript
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getProject } from '@/server/queries/projects'
import { getOmReadings } from '@/server/queries/client'
import { getEpcLicense } from '@/server/queries/payments'
import { PlantCharts } from '@/components/client/plant-charts'
import { EpcMonitoringPaywall } from '@/components/contractor/epc-monitoring-paywall'
import { Activity } from 'lucide-react'

type Props = { params: Promise<{ id: string }> }

export default async function MonitoringPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session) redirect('/login')

  const project = await getProject(id, session.user.companyId)
  if (!project) notFound()

  if (project.stage !== 'OPERATIONAL') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6">
        <Activity className="h-8 w-8 text-ink-300 mb-3" strokeWidth={1.5} />
        <p className="text-sm font-medium text-ink-900">Monitoring unlocks at Operational stage</p>
        <p className="text-xs text-ink-500 mt-1 max-w-sm">
          O&M dashboards, plant performance, and prescriptive maintenance alerts will be available once this project reaches the Operational stage.
        </p>
      </div>
    )
  }

  const [epcLicense, readings] = await Promise.all([
    getEpcLicense(id, session.user.companyId),
    getOmReadings(id),
  ])

  if (!epcLicense) {
    return (
      <EpcMonitoringPaywall
        projectId={id}
        hasClient={!!project.clientCompanyId}
      />
    )
  }

  return (
    <div className="p-6 overflow-y-auto h-full max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-ink-900">O&M Monitoring</h2>
        <p className="text-xs text-ink-500 mt-0.5">{project.name} · {project.systemSizeKw} kW · Last 30 days</p>
      </div>

      {readings.length === 0 && (
        <p className="text-sm text-ink-500">No monitoring data available yet.</p>
      )}

      {readings.length > 0 && (
        <PlantCharts
          readings={readings.map((r) => ({
            recordedAt: r.recordedAt.toISOString(),
            productionKwh: r.productionKwh,
            batterySoCPercent: r.batterySoCPercent,
            consumptionKwh: r.consumptionKwh,
            irradianceWM2: r.irradianceWM2,
          }))}
          tier={epcLicense.tier}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/contractor/projects/[id]/monitoring/page.tsx" "components/contractor/"
git commit -m "feat(m9): EPC monitoring tab — paywall with sell-to-client and self-activate flows"
```

---

## Task 7: Contractor Wallet Page

**Files:** Create `app/(app)/contractor/wallet/page.tsx`

- [ ] **Step 1: Create `app/(app)/contractor/wallet/page.tsx`**

```typescript
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getEpcCommissions, getEpcLicensesSold } from '@/server/queries/payments'
import { formatZAR } from '@/lib/payments/rail'
import { Coins, TrendingUp, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtMonth(d: Date) {
  return `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`
}

export default async function WalletPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const companyId = session.user.companyId

  const [wallet, tokenTxs, { commissions, totalEarned, accrued }, licensesSold] = await Promise.all([
    db.walletBalance.findUnique({ where: { companyId }, select: { tokens: true, fiatCents: true } }),
    db.tokenTransaction.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    getEpcCommissions(companyId),
    getEpcLicensesSold(companyId),
  ])

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-base font-semibold text-ink-900">Wallet</h1>
        <p className="text-sm text-ink-500">Tokens, commissions, and transaction history.</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-ink-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
            <span className="text-xs text-ink-500">SEE Tokens</span>
          </div>
          <p className="text-2xl font-semibold text-ink-900 tabular-nums">{(wallet?.tokens ?? 0).toLocaleString()}</p>
          <p className="text-xs text-ink-400 mt-0.5">Used for AI verification, expert review</p>
        </div>

        <div className="rounded-lg border border-ink-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
            <span className="text-xs text-ink-500">Commission accrued</span>
          </div>
          <p className="text-2xl font-semibold text-ink-900 tabular-nums">{formatZAR(accrued)}</p>
          <p className="text-xs text-ink-400 mt-0.5">Next payout end of month</p>
        </div>

        <div className="rounded-lg border border-ink-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
            <span className="text-xs text-ink-500">Total commission earned</span>
          </div>
          <p className="text-2xl font-semibold text-ink-900 tabular-nums">{formatZAR(totalEarned)}</p>
          <p className="text-xs text-ink-400 mt-0.5">Lifetime across all licenses</p>
        </div>
      </div>

      {/* Licenses sold (reseller section) */}
      {licensesSold.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-ink-900">Licenses sold</h2>
          <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ink-25 border-b border-ink-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Tier</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-ink-500">Monthly fee</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-ink-500">Your commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {licensesSold.map((lic) => (
                  <tr key={lic.id}>
                    <td className="px-4 py-3 font-medium text-ink-900 text-xs">{lic.project.name}</td>
                    <td className="px-4 py-3 text-ink-500 text-xs">{lic.licenseeCompany.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-accent-500/10 text-accent-600">{lic.tier}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-ink-600 text-xs tabular-nums">{formatZAR(lic.monthlyFeeCents)}</td>
                    <td className="px-4 py-3 text-right text-success-600 text-xs font-semibold tabular-nums">
                      {formatZAR(Math.round(lic.monthlyFeeCents * (lic.commissionRate ?? 0.2)))}/mo
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Commission history */}
      {commissions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-ink-900">Commission history</h2>
          <div className="space-y-2">
            {commissions.map((c) => (
              <div key={c.id} className="flex items-center gap-4 rounded-lg border border-ink-200 bg-white px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-ink-900">{c.license.project.name}</p>
                  <p className="text-[10px] text-ink-400">{fmtMonth(c.period)} · {c.license.tier} tier</p>
                </div>
                <span className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded-sm flex-shrink-0',
                  c.status === 'PAID' ? 'bg-success-500/10 text-success-600' :
                  c.status === 'ACCRUED' ? 'bg-ink-100 text-ink-600' :
                  'bg-warning-50 text-warning-700'
                )}>
                  {c.status}
                </span>
                <p className="text-xs font-semibold text-ink-900 tabular-nums flex-shrink-0">{formatZAR(c.amountCents)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Token transaction history */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-ink-900">Token transactions</h2>
        {tokenTxs.length === 0 ? (
          <p className="text-sm text-ink-500">No token transactions yet.</p>
        ) : (
          <div className="space-y-1">
            {tokenTxs.map((tx) => (
              <div key={tx.id} className="flex items-center gap-4 rounded-md border border-ink-100 bg-ink-25 px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink-700">{tx.description}</p>
                  <p className="text-[10px] text-ink-400">{new Date(tx.createdAt).toLocaleDateString('en-ZA')}</p>
                </div>
                <p className={cn('text-xs font-semibold tabular-nums flex-shrink-0', tx.amount > 0 ? 'text-success-600' : 'text-ink-600')}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/contractor/wallet/"
git commit -m "feat(m9): contractor wallet — tokens, commissions, licenses sold, transaction history"
```

---

## Task 8: Admin Financial — Reconciliation Queue

**Files:** Modify `app/(app)/admin/financial/page.tsx`

- [ ] **Step 1: Replace `app/(app)/admin/financial/page.tsx`**

```typescript
import { getPaymentsForReconciliation } from '@/server/queries/payments'
import { ReconciliationQueue } from '@/components/admin/reconciliation-queue'
import { db } from '@/lib/db'
import { formatZAR } from '@/lib/payments/rail'
import { BarChart3 } from 'lucide-react'

export default async function FinancialPage() {
  const [pendingPayments, invoiceCount, paidCount] = await Promise.all([
    getPaymentsForReconciliation(),
    db.invoice.count(),
    db.invoice.count({ where: { status: 'PAID' } }),
  ])

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Financial & Reconciliation</h2>
        <p className="text-sm text-ink-500">EFT proof of payment review queue and invoice overview.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending reconciliation', value: pendingPayments.length, highlight: pendingPayments.length > 0 },
          { label: 'Total invoices', value: invoiceCount, highlight: false },
          { label: 'Paid invoices', value: paidCount, highlight: false },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-lg border px-4 py-5 ${stat.highlight && stat.value > 0 ? 'border-warning-400 bg-warning-50/30' : 'border-ink-200 bg-white'}`}>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
              <span className="text-xs text-ink-500">{stat.label}</span>
            </div>
            <p className="text-2xl font-semibold text-ink-900 tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-ink-900">
          Awaiting reconciliation ({pendingPayments.length})
        </h3>

        {pendingPayments.length === 0 && (
          <div className="rounded-lg border border-ink-100 bg-ink-25 px-4 py-8 text-center">
            <p className="text-sm text-ink-500">No payments awaiting reconciliation.</p>
          </div>
        )}

        <ReconciliationQueue payments={pendingPayments} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/admin/reconciliation-queue.tsx`**

```typescript
'use client'
// components/admin/reconciliation-queue.tsx

import { useState, useTransition } from 'react'
import { reconcilePayment } from '@/server/actions/payments'
import { formatZAR } from '@/lib/payments/rail'
import { CheckCircle, ExternalLink, Loader2 } from 'lucide-react'

type PaymentRow = {
  id: string
  reference: string | null
  amountCents: number
  proofOfPaymentUrl: string | null
  updatedAt: Date
  invoice: {
    invoiceNumber: string
    recipientCompany: { name: string }
    lineItems: { description: string; type: string }[]
  }
}

type Props = { payments: PaymentRow[] }

export function ReconciliationQueue({ payments }: Props) {
  const [reconciled, setReconciled] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [bankRef, setBankRef] = useState<Record<string, string>>({})

  function handleReconcile(id: string) {
    startTransition(async () => {
      await reconcilePayment(id, bankRef[id])
      setReconciled((prev) => new Set([...prev, id]))
    })
  }

  return (
    <div className="space-y-3">
      {payments.map((p) => {
        const done = reconciled.has(p.id)
        const description = p.invoice.lineItems[0]?.description ?? 'Payment'

        return (
          <div key={p.id} className={`rounded-lg border bg-white overflow-hidden ${done ? 'border-success-500/20 opacity-60' : 'border-ink-200'}`}>
            <div className="px-4 py-3 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-sm font-medium text-ink-900">{description}</p>
                <p className="text-xs text-ink-500">{p.invoice.recipientCompany.name} · {p.invoice.invoiceNumber}</p>
                <p className="text-xs text-ink-400 font-mono">{p.reference}</p>
              </div>
              <div className="flex-shrink-0 text-right space-y-0.5">
                <p className="text-sm font-semibold text-ink-900">{formatZAR(p.amountCents)}</p>
                <p className="text-xs text-ink-400">{new Date(p.updatedAt).toLocaleDateString('en-ZA')}</p>
              </div>
            </div>

            {p.proofOfPaymentUrl && (
              <div className="px-4 py-2 border-t border-ink-50 bg-ink-25">
                <a
                  href={p.proofOfPaymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-accent-600 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                  View proof of payment
                </a>
              </div>
            )}

            {!done && (
              <div className="px-4 py-3 border-t border-ink-100 flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Bank statement reference (optional)"
                  value={bankRef[p.id] ?? ''}
                  onChange={(e) => setBankRef((prev) => ({ ...prev, [p.id]: e.target.value }))}
                  className="flex-1 h-8 rounded-md border border-ink-200 px-3 text-xs placeholder:text-ink-400 focus:outline-none focus:ring-1 focus:ring-accent-500/30"
                />
                <button
                  onClick={() => handleReconcile(p.id)}
                  disabled={isPending}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" strokeWidth={1.5} />}
                  Reconcile
                </button>
              </div>
            )}

            {done && (
              <div className="px-4 py-2 border-t border-success-500/10 bg-success-50/20 flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-success-500" strokeWidth={1.5} />
                <p className="text-xs text-success-600 font-medium">Reconciled — license activated</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/admin/financial/" "components/admin/reconciliation-queue.tsx"
git commit -m "feat(m9): admin reconciliation queue — review POP, mark paid, license activates"
```

---

## Task 9: Admin Enterprise Accounts

**Files:**
- Modify: `components/shell/sidebar.tsx` (add Enterprise nav item)
- Create: `app/(app)/admin/enterprise/page.tsx`

- [ ] **Step 1: Add Enterprise to ADMIN_NAV in `components/shell/sidebar.tsx`**

Find the `ADMIN_NAV` array and add after `Users & Companies`:

```typescript
export const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'KYC Queue', href: '/admin/kyc', icon: FolderOpen },
  { label: 'Submissions', href: '/admin/submissions', icon: ClipboardList },
  { label: 'Users & Companies', href: '/admin/users', icon: Building2 },
  { label: 'Enterprise', href: '/admin/enterprise', icon: Layers },
  { label: 'Templates', href: '/admin/templates', icon: ShoppingBag },
  { label: 'Financial', href: '/admin/financial', icon: BarChart3 },
  { label: 'Disputes', href: '/admin/disputes', icon: Scale },
  { label: 'Helpdesk', href: '/admin/helpdesk', icon: HelpCircle },
  { label: 'Configuration', href: '/admin/configuration', icon: Settings },
]
```

Add `Layers` to the lucide import at the top.

- [ ] **Step 2: Create `app/(app)/admin/enterprise/page.tsx`**

```typescript
import { getEnterpriseLicenses, getProjectsNotInEnterpriseScope } from '@/server/queries/payments'
import { addProjectToEnterpriseScope } from '@/server/actions/payments'
import { EnterpriseAccountsView } from '@/components/admin/enterprise-accounts-view'

export default async function EnterpriseAccountsPage() {
  const licenses = await getEnterpriseLicenses()
  const spazaLicense = licenses.find((l) => l.id === 'enterprise-spaza')
  const eligibleProjects = spazaLicense
    ? await getProjectsNotInEnterpriseScope(spazaLicense.id, spazaLicense.clientCompany.id)
    : []

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Enterprise Accounts</h2>
        <p className="text-sm text-ink-500">{licenses.length} active Enterprise license{licenses.length !== 1 ? 's' : ''}.</p>
      </div>

      {/* License list */}
      <div className="space-y-3">
        {licenses.map((lic) => (
          <div key={lic.id} className="rounded-lg border border-ink-200 bg-white p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink-900">{lic.clientCompany.name}</p>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm ${lic.status === 'ACTIVE' ? 'bg-success-500/10 text-success-600' : 'bg-ink-100 text-ink-600'}`}>
                    {lic.status}
                  </span>
                </div>
                <p className="text-xs text-ink-500 mt-0.5">{lic.contractReference} · {lic.seats.filter(s => s.isActive).length} active seats · {lic.integrations.filter(i => i.status === 'ACTIVE').length} integrations</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-ink-900">
                  R {((lic.baseMonthlyFeeCents + lic.perSeatMonthlyFeeCents * lic.seats.filter(s => s.isActive).length) / 100).toLocaleString()}/mo base
                </p>
                <p className="text-xs text-ink-400">{lic.reviewCadence.toLowerCase()} review</p>
              </div>
            </div>

            {/* Project scopes */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-ink-700">Projects in scope ({lic.projectScopes.length})</p>
              <div className="flex flex-wrap gap-2">
                {lic.projectScopes.map((scope) => (
                  <span key={scope.project.id} className="text-[10px] font-medium px-2 py-1 rounded-md border border-ink-200 bg-ink-25 text-ink-600">
                    {scope.project.name} · {scope.project.site?.city}
                  </span>
                ))}
              </div>
            </div>

            {/* Add project to scope (Act 4 demo moment) */}
            {eligibleProjects.length > 0 && lic.id === 'enterprise-spaza' && (
              <EnterpriseAccountsView
                licenseId={lic.id}
                eligibleProjects={eligibleProjects}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `components/admin/enterprise-accounts-view.tsx`**

```typescript
'use client'
// components/admin/enterprise-accounts-view.tsx

import { useState, useTransition } from 'react'
import { addProjectToEnterpriseScope } from '@/server/actions/payments'
import { Plus, CheckCircle, Loader2 } from 'lucide-react'

type Project = { id: string; name: string; stage: string }

type Props = { licenseId: string; eligibleProjects: Project[] }

export function EnterpriseAccountsView({ licenseId, eligibleProjects }: Props) {
  const [selectedId, setSelectedId] = useState(eligibleProjects[0]?.id ?? '')
  const [isPending, startTransition] = useTransition()
  const [added, setAdded] = useState<string | null>(null)

  function handleAdd() {
    if (!selectedId) return
    startTransition(async () => {
      await addProjectToEnterpriseScope(licenseId, selectedId)
      const project = eligibleProjects.find((p) => p.id === selectedId)
      setAdded(project?.name ?? selectedId)
    })
  }

  if (added) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-success-500/20 bg-success-50/30 px-3 py-2">
        <CheckCircle className="h-4 w-4 text-success-500" strokeWidth={1.5} />
        <p className="text-xs font-medium text-success-700">{added} added to Enterprise scope</p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 pt-1 border-t border-ink-100">
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="flex-1 h-8 rounded-md border border-ink-200 px-2 text-xs bg-white focus:outline-none"
      >
        {eligibleProjects.map((p) => (
          <option key={p.id} value={p.id}>{p.name} ({p.stage.toLowerCase()})</option>
        ))}
      </select>
      <button
        onClick={handleAdd}
        disabled={isPending || !selectedId}
        className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />}
        Add to scope
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add "components/shell/sidebar.tsx" "app/(app)/admin/enterprise/" "components/admin/enterprise-accounts-view.tsx"
git commit -m "feat(m9): admin Enterprise Accounts — license overview, project scope, Act 4 add-to-scope"
```

---

## Task 10: Final Checks + CLAUDE.md Update

- [ ] **Step 1: Run all unit tests**

```bash
npm run test:unit
```
Expected: 23 tests PASS.

- [ ] **Step 2: Full lint + typecheck**

```bash
npm run lint && npm run typecheck
```
Expected: 0 errors (warnings on pre-existing items are OK).

- [ ] **Step 3: Update CLAUDE.md current milestone**

Change:
```
> **Currently working on:** M9 Payments + O&M Licensing Commercial Substrate
```
To:
```
> **Currently working on:** M10 SEE.AI Assistant + Polish Pass
> **Last completed:** M9 — Payments + Licensing complete (EFT flow, EPC paywall, sell-to-client, reconciliation queue, contractor wallet, admin Enterprise Accounts).
```

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: M9 — Payments, Licensing & Wallet complete"
```

---

## Spec Coverage Self-Review

| Requirement | Task |
|---|---|
| EFT banking details modal with reference + POP upload | Task 4 |
| Invoice creation on license activation | Task 2 (invoice.ts) |
| Payment state machine (AWAITING_PROOF → AWAITING_RECONCILIATION → PAID) | Task 3 |
| Admin reconciliation queue with mark-paid action | Task 8 |
| License activation → OmLicense ACTIVE + bundled EPC + commission | Task 3 (reconcilePayment) |
| License activation animation (Framer Motion paywall dissolve) | Task 4 |
| EPC paywall with "Sell to client" (primary) + "Activate for own use" (secondary) | Task 6 |
| Client paywall with pending offer acceptance | Task 5 |
| Contractor wallet: tokens + commissions + licenses sold | Task 7 |
| Admin Enterprise Accounts: list + scope management (Act 4 demo) | Task 9 |
| Seed: Sandton/Boksburg/Durbanville OPERATIONAL | Task 1 |
| Seed: EnterpriseLicense for Spaza Holdings | Task 1 |
| Seed: PlatformBankAccount | Task 1 |
| Seed: LicenseCommission history | Task 1 |

**Deferred to M10 or post-prototype:**
- PayFast mock gateway (hardware checkout still uses simple PAID flow)
- Hardware checkout EFT rail (≥R10k → EFT) — functional but not wired to Invoice model
- Service marketplace escrow via Invoice/Payment — JobCard still uses EscrowStatus enum directly
- Invoice HTML detail view (SARS-compliant) — list view built; detail scaffold only
- Monthly renewal billing (manual trigger in admin)
