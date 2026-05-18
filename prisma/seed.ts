import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, type MilestoneTemplateItem } from '../lib/generated/prisma/client'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] ?? '' })
const db = new PrismaClient({ adapter })

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function daysFromNow(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🌱 Seeding demo data...')

  const passwordHash = await bcrypt.hash('demo1234', 12)

  // -------------------------------------------------------------------------
  // Users
  // -------------------------------------------------------------------------

  const marcus = await db.user.upsert({
    where: { email: 'marcus@adebayorenewables.co.za' },
    update: {},
    create: {
      email: 'marcus@adebayorenewables.co.za',
      name: 'Marcus Adebayo',
      emailVerified: new Date(),
      passwordHash,
    },
  })

  const lerato = await db.user.upsert({
    where: { email: 'lerato@mokoenaeng.co.za' },
    update: {},
    create: {
      email: 'lerato@mokoenaeng.co.za',
      name: 'Lerato Mokoena',
      emailVerified: new Date(),
      passwordHash,
    },
  })

  const sipho = await db.user.upsert({
    where: { email: 'sipho@spazaholdings.co.za' },
    update: {},
    create: {
      email: 'sipho@spazaholdings.co.za',
      name: 'Sipho Dlamini',
      emailVerified: new Date(),
      passwordHash,
    },
  })

  const erin = await db.user.upsert({
    where: { email: 'erin@see.platform' },
    update: {},
    create: {
      email: 'erin@see.platform',
      name: 'Erin Berman-Levy',
      emailVerified: new Date(),
      passwordHash,
    },
  })

  console.log('  ✓ Users')

  // -------------------------------------------------------------------------
  // Companies
  // -------------------------------------------------------------------------

  const adebayo = await db.company.upsert({
    where: { id: 'company-adebayo' },
    update: {},
    create: {
      id: 'company-adebayo',
      name: 'Adebayo Renewables',
      type: 'CONTRACTOR',
      registrationNo: '2018/234567/07',
      vatNo: '4230567890',
      beeeLevel: 2,
      about: 'C&I solar and hybrid specialist with 8 years experience across Southern Africa.',
      phone: '+27 11 234 5678',
      email: 'info@adebayorenewables.co.za',
      websiteUrl: 'https://adebayorenewables.co.za',
    },
  })

  const mokoena = await db.company.upsert({
    where: { id: 'company-mokoena' },
    update: {},
    create: {
      id: 'company-mokoena',
      name: 'Mokoena Structural Engineering',
      type: 'SERVICE_PROVIDER',
      registrationNo: '2015/112233/07',
      vatNo: '4180112233',
      beeeLevel: 1,
      about: 'Structural and civil engineering for large-scale solar PV installations.',
      phone: '+27 21 456 7890',
      email: 'info@mokoenaeng.co.za',
    },
  })

  const spaza = await db.company.upsert({
    where: { id: 'company-spaza' },
    update: {},
    create: {
      id: 'company-spaza',
      name: 'Spaza Holdings',
      type: 'END_CLIENT',
      registrationNo: '2010/056789/06',
      vatNo: '4120056789',
      about: 'Retail property group operating 120+ spaza and convenience store locations across Gauteng.',
      phone: '+27 11 789 0123',
      email: 'info@spazaholdings.co.za',
    },
  })

  const durbanville = await db.company.upsert({
    where: { id: 'company-durbanville' },
    update: {},
    create: {
      id: 'company-durbanville',
      name: 'Durbanville Mall Properties',
      type: 'END_CLIENT',
      registrationNo: '2005/098765/06',
      about: 'Regional shopping mall in Durbanville, Cape Town.',
      phone: '+27 21 975 4321',
      email: 'fm@durbanvillemall.co.za',
    },
  })

  const kruger = await db.company.upsert({
    where: { id: 'company-kruger' },
    update: {},
    create: {
      id: 'company-kruger',
      name: 'Kruger Family Farm',
      type: 'END_CLIENT',
      registrationNo: '2001/045678/23',
      about: 'Mixed livestock and grain farm in the Northern Cape with off-grid energy requirements.',
      phone: '+27 53 456 7890',
      email: 'info@krugerfarm.co.za',
    },
  })

  const platformAdmin = await db.company.upsert({
    where: { id: 'company-see-admin' },
    update: {},
    create: {
      id: 'company-see-admin',
      name: 'SEE Platform Operations',
      type: 'PLATFORM_ADMIN',
      about: 'Internal platform administration company.',
    },
  })

  console.log('  ✓ Companies')

  // -------------------------------------------------------------------------
  // Memberships
  // -------------------------------------------------------------------------

  await db.membership.upsert({
    where: { userId_companyId: { userId: marcus.id, companyId: adebayo.id } },
    update: {},
    create: { userId: marcus.id, companyId: adebayo.id, role: 'CONTRACTOR', isOwner: true },
  })

  await db.membership.upsert({
    where: { userId_companyId: { userId: lerato.id, companyId: mokoena.id } },
    update: {},
    create: { userId: lerato.id, companyId: mokoena.id, role: 'SERVICE_PROVIDER', isOwner: true },
  })

  await db.membership.upsert({
    where: { userId_companyId: { userId: sipho.id, companyId: spaza.id } },
    update: {},
    create: { userId: sipho.id, companyId: spaza.id, role: 'CLIENT', isOwner: true },
  })

  await db.membership.upsert({
    where: { userId_companyId: { userId: erin.id, companyId: platformAdmin.id } },
    update: {},
    create: { userId: erin.id, companyId: platformAdmin.id, role: 'ADMIN', isOwner: true },
  })

  console.log('  ✓ Memberships')

  // -------------------------------------------------------------------------
  // Tier, Wallet, KYC
  // -------------------------------------------------------------------------

  await db.tierStatus.upsert({
    where: { companyId: adebayo.id },
    update: {},
    create: {
      companyId: adebayo.id,
      tier: 'SILVER',
      compliantProjectCount: 3,
      pointsToNextTier: 5,
    },
  })

  await db.walletBalance.upsert({
    where: { companyId: adebayo.id },
    update: {},
    create: { companyId: adebayo.id, tokens: 12400, fiatCents: 0 },
  })

  await db.kycSubmission.upsert({
    where: { id: 'kyc-adebayo' },
    update: {},
    create: {
      id: 'kyc-adebayo',
      companyId: adebayo.id,
      status: 'APPROVED',
      reviewedBy: erin.id,
      reviewedAt: daysAgo(30),
      cipcDocUrl: 'https://example.com/seed/adebayo-cipc.pdf',
      vatDocUrl: 'https://example.com/seed/adebayo-vat.pdf',
      directorIdUrl: 'https://example.com/seed/adebayo-id.pdf',
    },
  })

  await db.kycSubmission.upsert({
    where: { id: 'kyc-mokoena' },
    update: {},
    create: {
      id: 'kyc-mokoena',
      companyId: mokoena.id,
      status: 'APPROVED',
      reviewedBy: erin.id,
      reviewedAt: daysAgo(60),
      cipcDocUrl: 'https://example.com/seed/mokoena-cipc.pdf',
      vatDocUrl: 'https://example.com/seed/mokoena-vat.pdf',
      directorIdUrl: 'https://example.com/seed/mokoena-id.pdf',
    },
  })

  console.log('  ✓ Tier, wallet, KYC')

  // -------------------------------------------------------------------------
  // Service Provider Profile
  // -------------------------------------------------------------------------

  await db.serviceProviderProfile.upsert({
    where: { companyId: mokoena.id },
    update: {},
    create: {
      companyId: mokoena.id,
      headline: 'Structural & Civil Engineering for Solar PV — Cape Town & Gauteng',
      description:
        'Specialist structural engineering firm with 80+ completed solar PV foundation and mounting system designs across C&I and utility-scale projects. SACPCMP registered. PI insured.',
      categories: ['STRUCTURAL_CIVILS', 'ENGINEERING'],
      serviceAreas: ['Western Cape', 'Gauteng', 'KwaZulu-Natal'],
      rating: 4.8,
      ratingCount: 23,
      responseTimeHrs: 4,
    },
  })

  console.log('  ✓ Service provider profile')

  // -------------------------------------------------------------------------
  // Milestone Templates
  // -------------------------------------------------------------------------

  const templatePpa = await db.milestoneTemplate.upsert({
    where: { id: 'template-solar-ci-ppa' },
    update: {},
    create: {
      id: 'template-solar-ci-ppa',
      name: 'Solar C&I <1MW PPA',
      version: 1,
      isActive: true,
      technology: 'SOLAR_PV',
      minSizeKw: 50,
      maxSizeKw: 1000,
      dealStructure: ['PPA'],
      items: {
        create: [
          {
            order: 1, phase: 'DEVELOPMENT', name: 'Site Assessment Report',
            description: 'Geotechnical and structural assessment of the site.',
            isHardGate: true, estimatedDays: 14,
            requiredArtefacts: [{ name: 'Site Assessment Report', allowedTypes: ['application/pdf'] }],
          },
          {
            order: 2, phase: 'DEVELOPMENT', name: 'Structural Engineering Report',
            description: 'Roof/ground mounting structural engineering sign-off.',
            isHardGate: true, estimatedDays: 21,
            requiredArtefacts: [{ name: 'Structural Report', allowedTypes: ['application/pdf'] }, { name: 'Engineering Letter', allowedTypes: ['application/pdf'] }],
          },
          {
            order: 3, phase: 'DEVELOPMENT', name: 'Environmental Impact Assessment',
            description: 'EIA submission and approval for projects in sensitive areas.',
            isHardGate: true, estimatedDays: 45,
            requiredArtefacts: [{ name: 'EIA Report', allowedTypes: ['application/pdf'] }, { name: 'NEMA Approval Letter', allowedTypes: ['application/pdf'] }],
          },
          {
            order: 4, phase: 'DEVELOPMENT', name: 'Grid Connection Application',
            description: 'Eskom/Municipality grid connection application and approval.',
            isHardGate: true, estimatedDays: 60,
            requiredArtefacts: [{ name: 'Grid Application', allowedTypes: ['application/pdf'] }, { name: 'Approval Letter', allowedTypes: ['application/pdf'] }],
          },
          {
            order: 5, phase: 'FINANCING', name: 'Financial Close Documentation',
            description: 'Signed PPA agreement and financial close documents.',
            isHardGate: true, estimatedDays: 30,
            requiredArtefacts: [{ name: 'Signed PPA', allowedTypes: ['application/pdf'] }, { name: 'Bank Confirmation', allowedTypes: ['application/pdf'] }],
          },
          {
            order: 6, phase: 'CONSTRUCTION', name: 'Construction Commencement',
            description: 'Site handover and construction commencement certificate.',
            isHardGate: false, estimatedDays: 5,
            requiredArtefacts: [{ name: 'Commencement Certificate', allowedTypes: ['application/pdf'] }],
          },
          {
            order: 7, phase: 'CONSTRUCTION', name: 'Commissioning Certificate',
            description: 'CoC and commissioning test results.',
            isHardGate: true, estimatedDays: 7,
            requiredArtefacts: [{ name: 'CoC', allowedTypes: ['application/pdf'] }, { name: 'Commissioning Report', allowedTypes: ['application/pdf'] }],
          },
          {
            order: 8, phase: 'OPERATIONAL', name: 'Operational Handover',
            description: 'Handover to client O&M team with all documentation.',
            isHardGate: true, estimatedDays: 3,
            requiredArtefacts: [{ name: 'Handover Pack', allowedTypes: ['application/pdf'] }],
          },
        ],
      },
    },
    include: { items: true },
  })

  await db.milestoneTemplate.upsert({
    where: { id: 'template-solar-ci-outright' },
    update: {},
    create: {
      id: 'template-solar-ci-outright',
      name: 'Solar C&I <1MW Outright',
      version: 1,
      isActive: true,
      technology: 'SOLAR_PV',
      minSizeKw: 50,
      maxSizeKw: 1000,
      dealStructure: ['OUTRIGHT', 'LEASE'],
      items: {
        create: [
          { order: 1, phase: 'DEVELOPMENT', name: 'Site Assessment', description: 'Site assessment report', isHardGate: true, estimatedDays: 10, requiredArtefacts: [{ name: 'Site Assessment', allowedTypes: ['application/pdf'] }] },
          { order: 2, phase: 'DEVELOPMENT', name: 'Structural Report', description: 'Engineering sign-off', isHardGate: true, estimatedDays: 14, requiredArtefacts: [{ name: 'Structural Report', allowedTypes: ['application/pdf'] }] },
          { order: 3, phase: 'DEVELOPMENT', name: 'Grid Connection', description: 'Grid application', isHardGate: true, estimatedDays: 45, requiredArtefacts: [{ name: 'Grid Approval', allowedTypes: ['application/pdf'] }] },
          { order: 4, phase: 'CONSTRUCTION', name: 'Installation', description: 'Construction complete', isHardGate: false, estimatedDays: 30, requiredArtefacts: [{ name: 'Progress Photos', allowedTypes: ['image/jpeg', 'image/png'] }] },
          { order: 5, phase: 'COMMISSIONING', name: 'CoC & Commissioning', description: 'Commissioning certificate', isHardGate: true, estimatedDays: 5, requiredArtefacts: [{ name: 'CoC', allowedTypes: ['application/pdf'] }] },
          { order: 6, phase: 'OPERATIONAL', name: 'Handover', description: 'Client handover', isHardGate: true, estimatedDays: 2, requiredArtefacts: [{ name: 'Handover Pack', allowedTypes: ['application/pdf'] }] },
        ],
      },
    },
    include: { items: true },
  })

  console.log('  ✓ Milestone templates')

  // -------------------------------------------------------------------------
  // Sites
  // -------------------------------------------------------------------------

  const siteSoweto = await db.site.upsert({
    where: { id: 'site-soweto' },
    update: {},
    create: {
      id: 'site-soweto',
      addressLine: '45 Klipspruit Valley Road',
      city: 'Soweto',
      province: 'Gauteng',
      latitude: -26.2485,
      longitude: 27.8546,
      irradianceKwhM2Day: 5.8,
    },
  })

  const siteDurbanville = await db.site.upsert({
    where: { id: 'site-durbanville' },
    update: {},
    create: {
      id: 'site-durbanville',
      addressLine: 'Willie van Schoor Avenue',
      city: 'Durbanville',
      province: 'Western Cape',
      latitude: -33.8318,
      longitude: 18.6538,
      irradianceKwhM2Day: 5.2,
    },
  })

  const siteKruger = await db.site.upsert({
    where: { id: 'site-kruger' },
    update: {},
    create: {
      id: 'site-kruger',
      addressLine: 'Farm Witfontein 234',
      city: 'Upington',
      province: 'Northern Cape',
      latitude: -28.4478,
      longitude: 21.2567,
      irradianceKwhM2Day: 7.1,
    },
  })

  console.log('  ✓ Sites')

  // -------------------------------------------------------------------------
  // Projects
  // -------------------------------------------------------------------------

  const templateSnapshot = templatePpa.items.map((item: MilestoneTemplateItem) => ({
    id: item.id,
    order: item.order,
    phase: item.phase,
    name: item.name,
    description: item.description,
    isHardGate: item.isHardGate,
    requiredArtefacts: item.requiredArtefacts,
    estimatedDays: item.estimatedDays,
  }))

  const projectAlpha = await db.project.upsert({
    where: { id: 'project-alpha' },
    update: {},
    create: {
      id: 'project-alpha',
      name: 'Spaza Soweto Retail Solar PPA',
      contractorCompanyId: adebayo.id,
      clientCompanyId: spaza.id,
      siteId: siteSoweto.id,
      technology: 'SOLAR_PV',
      gridConnectionStatus: 'GRID_TIED',
      systemSizeKw: 450,
      dealStructure: 'PPA',
      ppaTariffCents: 198,
      stage: 'CONSTRUCTION',
      templateSnapshot,
      templateVersion: 1,
      clientNeeds: 'Reduce energy costs across 3 flagship Soweto locations. Target: 60% grid displacement.',
      completionPercentage: 52,
    },
  })

  await db.project.upsert({
    where: { id: 'project-durbanville' },
    update: {},
    create: {
      id: 'project-durbanville',
      name: 'Durbanville Mall Solar PPA',
      contractorCompanyId: adebayo.id,
      clientCompanyId: durbanville.id,
      siteId: siteDurbanville.id,
      technology: 'SOLAR_PV',
      gridConnectionStatus: 'GRID_TIED',
      systemSizeKw: 850,
      dealStructure: 'PPA',
      ppaTariffCents: 185,
      stage: 'DEVELOPMENT',
      templateSnapshot,
      templateVersion: 1,
      clientNeeds: 'Long-term energy cost certainty. Mall operates 6am–10pm seven days a week.',
      completionPercentage: 15,
    },
  })

  const projectKruger = await db.project.upsert({
    where: { id: 'project-kruger' },
    update: {},
    create: {
      id: 'project-kruger',
      name: 'Kruger Family Farm Hybrid System',
      contractorCompanyId: adebayo.id,
      clientCompanyId: kruger.id,
      siteId: siteKruger.id,
      technology: 'HYBRID',
      gridConnectionStatus: 'OFF_GRID',
      systemSizeKw: 120,
      storageSizeKwh: 240,
      dealStructure: 'OUTRIGHT',
      contractValueCents: 1_850_000_00,
      stage: 'OPERATIONAL',
      templateSnapshot: [],
      templateVersion: 1,
      clientNeeds: 'Complete grid independence. Diesel generator elimination target within 18 months.',
      completionPercentage: 100,
      completedAt: daysAgo(90),
    },
  })

  console.log('  ✓ Projects')

  // -------------------------------------------------------------------------
  // Milestones for Project Alpha (deliberate mixed states)
  // -------------------------------------------------------------------------

  const alphaMs = [
    { id: 'ms-alpha-1', order: 1, phase: 'DEVELOPMENT' as const, name: 'Site Assessment Report', status: 'APPROVED' as const, isHardGate: true, completedAt: daysAgo(120) },
    { id: 'ms-alpha-2', order: 2, phase: 'DEVELOPMENT' as const, name: 'Structural Engineering Report', status: 'APPROVED' as const, isHardGate: true, completedAt: daysAgo(100) },
    { id: 'ms-alpha-3', order: 3, phase: 'DEVELOPMENT' as const, name: 'Environmental Impact Assessment', status: 'APPROVED' as const, isHardGate: true, completedAt: daysAgo(65) },
    { id: 'ms-alpha-4', order: 4, phase: 'DEVELOPMENT' as const, name: 'Grid Connection Application', status: 'AUTO_GOLD' as const, isHardGate: true, completedAt: daysAgo(45) },
    { id: 'ms-alpha-5', order: 5, phase: 'FINANCING' as const, name: 'Financial Close Documentation', status: 'UNDER_REVIEW' as const, isHardGate: true, completedAt: null },
    { id: 'ms-alpha-6', order: 6, phase: 'CONSTRUCTION' as const, name: 'Construction Commencement', status: 'AVAILABLE' as const, isHardGate: false, completedAt: null },
    { id: 'ms-alpha-7', order: 7, phase: 'CONSTRUCTION' as const, name: 'Commissioning Certificate', status: 'LOCKED' as const, isHardGate: true, completedAt: null },
    { id: 'ms-alpha-8', order: 8, phase: 'OPERATIONAL' as const, name: 'Operational Handover', status: 'LOCKED' as const, isHardGate: true, completedAt: null },
  ]

  for (const ms of alphaMs) {
    await db.milestone.upsert({
      where: { id: ms.id },
      update: {},
      create: {
        id: ms.id,
        projectId: projectAlpha.id,
        order: ms.order,
        phase: ms.phase,
        name: ms.name,
        description: `${ms.name} for Project Alpha.`,
        isHardGate: ms.isHardGate,
        requiredArtefacts: [{ name: `${ms.name} Document`, allowedTypes: ['application/pdf'] }],
        status: ms.status,
        startedAt: ms.completedAt ? new Date(ms.completedAt.getTime() - 14 * 24 * 60 * 60 * 1000) : null,
        completedAt: ms.completedAt,
        dueDate: ms.completedAt ? null : daysFromNow(ms.order * 7),
      },
    })
  }

  // Submission for UNDER_REVIEW milestone (EIA — ms-alpha-3 was approved, ms-alpha-5 is under review)
  await db.milestoneSubmission.upsert({
    where: { id: 'sub-alpha-5-v1' },
    update: {},
    create: {
      id: 'sub-alpha-5-v1',
      milestoneId: 'ms-alpha-5',
      submittedBy: marcus.id,
      version: 1,
      status: 'UNDER_REVIEW',
      notes: 'All financial close documents attached. Awaiting admin review.',
      artefacts: [
        { name: 'Signed PPA Agreement.pdf', url: 'https://example.com/seed/ppa-signed.pdf', fileSize: 2_100_000, sha256: 'abc123' },
        { name: 'Standard Bank Confirmation.pdf', url: 'https://example.com/seed/bank-confirmation.pdf', fileSize: 450_000, sha256: 'def456' },
      ],
    },
  })

  // Submission for EIA (ms-alpha-3 — APPROVED, note this is the rejected-then-approved story)
  await db.milestoneSubmission.upsert({
    where: { id: 'sub-alpha-3-v1' },
    update: {},
    create: {
      id: 'sub-alpha-3-v1',
      milestoneId: 'ms-alpha-3',
      submittedBy: marcus.id,
      version: 1,
      status: 'REJECTED',
      feedback: 'The EIA does not adequately address stormwater runoff impacts on the adjacent wetland. Please resubmit with section 4.3 revised.',
      notes: 'Initial submission.',
      artefacts: [{ name: 'EIA Report v1.pdf', url: 'https://example.com/seed/eia-v1.pdf', fileSize: 8_500_000, sha256: 'eia-v1' }],
    },
  })

  await db.milestoneSubmission.upsert({
    where: { id: 'sub-alpha-3-v2' },
    update: {},
    create: {
      id: 'sub-alpha-3-v2',
      milestoneId: 'ms-alpha-3',
      submittedBy: marcus.id,
      version: 2,
      status: 'APPROVED',
      reviewedBy: erin.id,
      reviewedAt: daysAgo(65),
      notes: 'Revised per admin feedback — stormwater section updated.',
      artefacts: [{ name: 'EIA Report v2.pdf', url: 'https://example.com/seed/eia-v2.pdf', fileSize: 9_200_000, sha256: 'eia-v2' }],
    },
  })

  console.log('  ✓ Milestones (Project Alpha — mixed states)')

  // -------------------------------------------------------------------------
  // Hardware Listings
  // -------------------------------------------------------------------------

  const hardware = [
    {
      id: 'hw-panel-longi', category: 'SOLAR_PANEL' as const,
      manufacturer: 'LONGi', model: 'Hi-MO 6 550W', sku: 'LONGI-HM6-550',
      description: '550W mono PERC half-cell panel, 21.3% efficiency. Tier 1 manufacturer.',
      priceCents: 320_00, stockQty: 2400,
      specs: { wattage: 550, efficiency: 21.3, dimensions: '2256×1133×35mm', weight: 28.2, warranty: '25 years product, 30 years performance' },
    },
    {
      id: 'hw-battery-byd', category: 'BATTERY' as const,
      manufacturer: 'BYD', model: 'Battery-Box Premium HVS 10.2', sku: 'BYD-HVS-10',
      description: '10.2kWh stackable lithium iron phosphate battery. Compatible with SunSynk, Victron, Deye.',
      priceCents: 4_800_00, stockQty: 85,
      specs: { capacityKwh: 10.2, chemistry: 'LFP', maxContinuousPower: 5, roundTripEfficiency: '97%', warranty: '10 years' },
    },
    {
      id: 'hw-inverter-sunsynk', category: 'INVERTER' as const,
      manufacturer: 'SunSynk', model: '8kW Hybrid Inverter', sku: 'SUNSYNK-8KW-HYB',
      description: '8kW hybrid inverter with built-in MPPT. Single phase. WiFi monitoring included.',
      priceCents: 2_250_00, stockQty: 156,
      specs: { powerKw: 8, phases: 1, mpptChannels: 2, batteryVoltage: '48V', warranty: '5 years' },
    },
    {
      id: 'hw-generator-perkins', category: 'GENERATOR' as const,
      manufacturer: 'Perkins', model: '20kVA Diesel Generator', sku: 'PERKINS-20KVA',
      description: 'Perkins-powered 20kVA diesel generator with auto-start, weatherproof canopy.',
      priceCents: 85_000_00, stockQty: 12,
      specs: { powerKva: 20, fuelType: 'Diesel', tankLitres: 120, noiseDb: 72, warranty: '2 years / 2000 hours' },
    },
    {
      id: 'hw-combiner-dc', category: 'ACCESSORY' as const,
      manufacturer: 'Schneider Electric', model: 'DC Combiner Box 8-string', sku: 'SE-DCB8',
      description: '8-string DC combiner box with surge protection and string monitoring.',
      priceCents: 1_800_00, stockQty: 340,
      specs: { strings: 8, maxInputVoltage: '1000V', protection: 'IP65', monitoring: 'Per-string current' },
    },
  ]

  for (const hw of hardware) {
    await db.hardwareListing.upsert({
      where: { id: hw.id },
      update: {},
      create: hw,
    })
  }

  console.log('  ✓ Hardware listings')

  // -------------------------------------------------------------------------
  // O&M Readings — Kruger Family Farm (30 days of daily data)
  // -------------------------------------------------------------------------

  for (let i = 29; i >= 0; i--) {
    const date = daysAgo(i)
    const irradiance = 600 + Math.sin(i * 0.4) * 200 + Math.random() * 100
    const production = (irradiance / 1000) * 120 * 5.5 * (0.85 + Math.random() * 0.1)
    const soc = 40 + Math.sin(i * 0.3 + 1) * 35 + Math.random() * 10

    await db.omReading.create({
      data: {
        projectId: projectKruger.id,
        inverterBrand: 'SunSynk',
        recordedAt: date,
        productionKwh: Math.round(production * 10) / 10,
        batterySoCPercent: Math.min(98, Math.max(15, Math.round(soc * 10) / 10)),
        consumptionKwh: Math.round((production * 0.7 + Math.random() * 20) * 10) / 10,
        gridImportKwh: 0,
        gridExportKwh: 0,
        irradianceWM2: Math.round(irradiance),
        ambientTempC: 22 + Math.random() * 8,
      },
    })
  }

  console.log('  ✓ O&M readings (30 days, Kruger Farm)')

  // -------------------------------------------------------------------------
  // News Items
  // -------------------------------------------------------------------------

  const news = [
    {
      id: 'news-1', title: 'REIPPPP Round 7 shortlist: 24 projects selected', summary: 'The Department of Energy has announced the Round 7 shortlist with 2.6GW of new capacity across solar, wind, and storage technologies.', source: 'EE Publishers', sourceUrl: 'https://example.com/news/1', category: 'Policy', publishedAt: daysAgo(2),
    },
    {
      id: 'news-2', title: 'Eskom grid availability update: 2.8GW available for C&I connections', summary: 'Eskom confirms improved grid availability in Gauteng and Western Cape following successful load reduction programme.', source: 'Engineering News', sourceUrl: 'https://example.com/news/2', category: 'Grid', publishedAt: daysAgo(4),
    },
    {
      id: 'news-3', title: 'National Treasury extends Section 12B tax incentive through 2027', summary: 'Enhanced accelerated depreciation allowance of 125% on qualifying solar assets extended to support C&I adoption.', source: 'BusinessDay', sourceUrl: 'https://example.com/news/3', category: 'Finance', publishedAt: daysAgo(7),
    },
    {
      id: 'news-4', title: 'New wheeling framework opens opportunities for multi-site clients', summary: 'NERSA approves revised wheeling framework allowing energy trading across distribution networks for commercial customers.', source: 'Daily Maverick', sourceUrl: 'https://example.com/news/4', category: 'Regulation', publishedAt: daysAgo(10),
    },
    {
      id: 'news-5', title: 'Battery storage costs decline 18% in 12 months — SEE market data', summary: 'Lithium iron phosphate battery prices fall to R4,500/kWh installed, making hybrid systems viable for farms and light industrial.', source: 'SEE Platform', sourceUrl: 'https://example.com/news/5', category: 'Market', publishedAt: daysAgo(14),
    },
  ]

  for (const item of news) {
    await db.newsItem.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    })
  }

  console.log('  ✓ News items')

  // -------------------------------------------------------------------------
  // Done
  // -------------------------------------------------------------------------

  console.log('\n✅ Demo seed complete!')
  console.log(`   Users: 4 | Companies: 6 | Projects: 3 | Milestones: 8 | Hardware: 5 | O&M readings: 30 | News: 5`)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
