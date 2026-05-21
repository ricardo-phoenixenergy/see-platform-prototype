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

  const naledi = await db.user.upsert({
    where: { email: 'naledi@adebayorenewables.co.za' },
    update: {},
    create: {
      email: 'naledi@adebayorenewables.co.za',
      name: 'Naledi Khumalo',
      emailVerified: new Date(),
      passwordHash,
    },
  })

  const tess = await db.user.upsert({
    where: { email: 'tess@durbanvillemall.co.za' },
    update: {},
    create: {
      email: 'tess@durbanvillemall.co.za',
      name: 'Tess de Wet',
      emailVerified: new Date(),
      passwordHash,
    },
  })

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

  // Second service provider — used for the "rejected bid" demo on rfq-kruger-eia
  const capeGrid = await db.company.upsert({
    where: { id: 'company-cape-grid' },
    update: {},
    create: {
      id: 'company-cape-grid',
      name: 'Cape Grid Environmental Consultants',
      type: 'SERVICE_PROVIDER',
      registrationNo: '2018/334455/07',
      beeeLevel: 2,
      about: 'Environmental impact assessments and grid compliance for renewable energy projects.',
      phone: '+27 21 334 5678',
      email: 'info@capegrid.co.za',
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

  const bnsolar = await db.company.upsert({
    where: { id: 'company-bnsolar' },
    update: {},
    create: { id: 'company-bnsolar', name: 'BN Solar', type: 'CONTRACTOR', registrationNo: '2024/098765/07', beeeLevel: 4, about: 'Residential and small commercial solar specialist based in Cape Town.', phone: '+27 21 555 0123', email: 'info@bnsolar.co.za' },
  })
  const solarace = await db.company.upsert({
    where: { id: 'company-solarace' },
    update: {},
    create: { id: 'company-solarace', name: 'Solar Ace Group', type: 'CONTRACTOR', registrationNo: '2012/445566/07', beeeLevel: 2, about: 'Large-scale C&I and utility solar EPC with 22 completed projects.', phone: '+27 31 456 7890', email: 'info@solaracegroup.co.za' },
  })
  const manchester = await db.company.upsert({
    where: { id: 'company-manchester' },
    update: {},
    create: { id: 'company-manchester', name: 'Manchester Restaurant Group', type: 'END_CLIENT', registrationNo: '2018/334455/06', about: 'Small restaurant group, 3 Sandton locations.', phone: '+27 11 883 1234', email: 'ops@manchesterrestaurants.co.za' },
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

  await db.membership.upsert({
    where: { userId_companyId: { userId: naledi.id, companyId: adebayo.id } },
    update: {},
    create: { userId: naledi.id, companyId: adebayo.id, role: 'CONTRACTOR', isOwner: false },
  })

  await db.membership.upsert({
    where: { userId_companyId: { userId: tess.id, companyId: durbanville.id } },
    update: {},
    create: { userId: tess.id, companyId: durbanville.id, role: 'CLIENT', isOwner: true },
  })

  await db.membership.upsert({ where: { userId_companyId: { userId: tumi.id, companyId: bnsolar.id } }, update: {}, create: { userId: tumi.id, companyId: bnsolar.id, role: 'CONTRACTOR', isOwner: true } })
  await db.membership.upsert({ where: { userId_companyId: { userId: johan.id, companyId: solarace.id } }, update: {}, create: { userId: johan.id, companyId: solarace.id, role: 'CONTRACTOR', isOwner: true } })
  await db.tierStatus.upsert({ where: { companyId: bnsolar.id }, update: {}, create: { companyId: bnsolar.id, tier: 'BRONZE', compliantProjectCount: 1, pointsToNextTier: 9 } })
  await db.tierStatus.upsert({ where: { companyId: solarace.id }, update: {}, create: { companyId: solarace.id, tier: 'GOLD', compliantProjectCount: 22, pointsToNextTier: 3 } })
  await db.walletBalance.upsert({ where: { companyId: bnsolar.id }, update: {}, create: { companyId: bnsolar.id, tokens: 1200, fiatCents: 0 } })
  await db.walletBalance.upsert({ where: { companyId: solarace.id }, update: {}, create: { companyId: solarace.id, tokens: 48000, fiatCents: 0 } })

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

  await db.milestoneTemplate.upsert({
    where: { id: 'template-bess-ci' },
    update: {},
    create: {
      id: 'template-bess-ci',
      name: 'BESS C&I (Standalone)',
      version: 1,
      isActive: true,
      technology: 'BESS',
      minSizeKw: null,
      maxSizeKw: null,
      dealStructure: ['OUTRIGHT', 'PPA', 'LEASE'],
      items: {
        create: [
          {
            order: 1, phase: 'DEVELOPMENT', name: 'Load & Demand Analysis',
            description: 'Detailed load profile analysis and peak demand characterisation to size the BESS correctly.',
            isHardGate: true, estimatedDays: 10,
            requiredArtefacts: [{ name: 'Load Analysis Report', allowedTypes: ['application/pdf'] }],
          },
          {
            order: 2, phase: 'DEVELOPMENT', name: 'BESS Engineering Study',
            description: 'Sizing study, battery chemistry selection, and power conversion system specification.',
            isHardGate: true, estimatedDays: 14,
            requiredArtefacts: [{ name: 'BESS Engineering Report', allowedTypes: ['application/pdf'] }],
          },
          {
            order: 3, phase: 'DEVELOPMENT', name: 'Grid / Utility Application',
            description: 'Grid connection or embedded generation application to the relevant authority (Eskom or municipality).',
            isHardGate: true, estimatedDays: 45,
            requiredArtefacts: [{ name: 'Grid Application', allowedTypes: ['application/pdf'] }, { name: 'Approval Letter', allowedTypes: ['application/pdf'] }],
          },
          {
            order: 4, phase: 'DEVELOPMENT', name: 'BESS Safety & Compliance Review',
            description: 'Safety study covering thermal runaway, fire suppression, and SANS 10142 / IEC 62619 compliance.',
            isHardGate: true, estimatedDays: 14,
            requiredArtefacts: [{ name: 'BESS Safety Study', allowedTypes: ['application/pdf'] }],
          },
          {
            order: 5, phase: 'CONSTRUCTION', name: 'BESS Installation',
            description: 'Physical installation of battery modules, PCS, and BMS.',
            isHardGate: false, estimatedDays: 14,
            requiredArtefacts: [{ name: 'Installation Progress Photos', allowedTypes: ['image/jpeg', 'image/png'] }],
          },
          {
            order: 6, phase: 'COMMISSIONING', name: 'BESS Commissioning & Protection Testing',
            description: 'BMS commissioning, protection relay testing, and grid synchronisation test.',
            isHardGate: true, estimatedDays: 5,
            requiredArtefacts: [{ name: 'Commissioning Report', allowedTypes: ['application/pdf'] }, { name: 'CoC', allowedTypes: ['application/pdf'] }],
          },
          {
            order: 7, phase: 'OPERATIONAL', name: 'Operational Handover',
            description: 'Handover to client including O&M manual, warranty documentation, and BMS access credentials.',
            isHardGate: true, estimatedDays: 2,
            requiredArtefacts: [{ name: 'Handover Pack', allowedTypes: ['application/pdf'] }],
          },
        ],
      },
    },
    include: { items: true },
  })

  await db.milestoneTemplate.upsert({
    where: { id: 'template-hybrid-ci-ppa' },
    update: {},
    create: {
      id: 'template-hybrid-ci-ppa',
      name: 'Hybrid (PV + BESS) C&I PPA',
      version: 1,
      isActive: true,
      technology: 'HYBRID',
      minSizeKw: null,
      maxSizeKw: null,
      dealStructure: ['PPA'],
      items: {
        create: [
          {
            order: 1, phase: 'DEVELOPMENT', name: 'Site Assessment Report',
            description: 'Geotechnical, structural, and irradiance assessment covering both PV array placement and BESS installation area.',
            isHardGate: true, estimatedDays: 14,
            requiredArtefacts: [{ name: 'Site Assessment Report', allowedTypes: ['application/pdf'] }],
          },
          {
            order: 2, phase: 'DEVELOPMENT', name: 'Structural Engineering Report',
            description: 'Roof/ground mounting structural sign-off for PV array. Includes civil works specification for BESS enclosure if applicable.',
            isHardGate: true, estimatedDays: 21,
            requiredArtefacts: [{ name: 'Structural Report', allowedTypes: ['application/pdf'] }, { name: 'Engineering Letter', allowedTypes: ['application/pdf'] }],
          },
          {
            order: 3, phase: 'DEVELOPMENT', name: 'BESS Safety & Compliance Review',
            description: 'Safety study for battery system: thermal runaway, fire suppression, and SANS/IEC compliance.',
            isHardGate: true, estimatedDays: 14,
            requiredArtefacts: [{ name: 'BESS Safety Study', allowedTypes: ['application/pdf'] }],
          },
          {
            order: 4, phase: 'DEVELOPMENT', name: 'Grid / Utility Application',
            description: 'Embedded generation application to the relevant authority. NMD and supply voltage determine the correct form and approving body.',
            isHardGate: true, estimatedDays: 60,
            requiredArtefacts: [{ name: 'Grid Application', allowedTypes: ['application/pdf'] }, { name: 'Approval Letter', allowedTypes: ['application/pdf'] }],
          },
          {
            order: 5, phase: 'FINANCING', name: 'Financial Close Documentation',
            description: 'Signed PPA agreement, financial model, and bank/funder confirmation letter.',
            isHardGate: true, estimatedDays: 30,
            requiredArtefacts: [{ name: 'Signed PPA', allowedTypes: ['application/pdf'] }, { name: 'Bank Confirmation', allowedTypes: ['application/pdf'] }],
          },
          {
            order: 6, phase: 'CONSTRUCTION', name: 'Construction Commencement',
            description: 'Site handover and commencement certificate. PV and BESS installation begin.',
            isHardGate: false, estimatedDays: 5,
            requiredArtefacts: [{ name: 'Commencement Certificate', allowedTypes: ['application/pdf'] }],
          },
          {
            order: 7, phase: 'COMMISSIONING', name: 'CoC & System Commissioning',
            description: 'Certificate of Compliance, PV commissioning report, BESS commissioning report, and protection relay test results.',
            isHardGate: true, estimatedDays: 7,
            requiredArtefacts: [{ name: 'CoC', allowedTypes: ['application/pdf'] }, { name: 'PV Commissioning Report', allowedTypes: ['application/pdf'] }, { name: 'BESS Commissioning Report', allowedTypes: ['application/pdf'] }],
          },
          {
            order: 8, phase: 'OPERATIONAL', name: 'Operational Handover',
            description: 'Full handover pack including O&M manuals, warranty documents, BMS credentials, and monitoring system setup.',
            isHardGate: true, estimatedDays: 3,
            requiredArtefacts: [{ name: 'Handover Pack', allowedTypes: ['application/pdf'] }],
          },
        ],
      },
    },
    include: { items: true },
  })

  await db.milestoneTemplate.upsert({
    where: { id: 'template-hybrid-ci-outright' },
    update: {},
    create: {
      id: 'template-hybrid-ci-outright',
      name: 'Hybrid (PV + BESS) C&I Outright / Lease / Wheeling',
      version: 1,
      isActive: true,
      technology: 'HYBRID',
      minSizeKw: null,
      maxSizeKw: null,
      dealStructure: ['OUTRIGHT', 'LEASE', 'WHEELING_AGREEMENT'],
      items: {
        create: [
          {
            order: 1, phase: 'DEVELOPMENT', name: 'Site Assessment Report',
            description: 'Geotechnical, structural, and irradiance assessment covering both PV array placement and BESS installation area.',
            isHardGate: true, estimatedDays: 14,
            requiredArtefacts: [{ name: 'Site Assessment Report', allowedTypes: ['application/pdf'] }],
          },
          {
            order: 2, phase: 'DEVELOPMENT', name: 'Structural Engineering Report',
            description: 'Roof/ground mounting structural sign-off for PV array.',
            isHardGate: true, estimatedDays: 21,
            requiredArtefacts: [{ name: 'Structural Report', allowedTypes: ['application/pdf'] }, { name: 'Engineering Letter', allowedTypes: ['application/pdf'] }],
          },
          {
            order: 3, phase: 'DEVELOPMENT', name: 'BESS Safety & Compliance Review',
            description: 'Safety study: thermal runaway, fire suppression, SANS/IEC compliance.',
            isHardGate: true, estimatedDays: 14,
            requiredArtefacts: [{ name: 'BESS Safety Study', allowedTypes: ['application/pdf'] }],
          },
          {
            order: 4, phase: 'DEVELOPMENT', name: 'Grid / Utility Application',
            description: 'Embedded generation application to the relevant authority.',
            isHardGate: true, estimatedDays: 45,
            requiredArtefacts: [{ name: 'Grid Application', allowedTypes: ['application/pdf'] }, { name: 'Approval Letter', allowedTypes: ['application/pdf'] }],
          },
          {
            order: 5, phase: 'CONSTRUCTION', name: 'Installation',
            description: 'PV array and BESS installation. Progress documentation required at 50% and 100% completion.',
            isHardGate: false, estimatedDays: 30,
            requiredArtefacts: [{ name: 'Progress Photos', allowedTypes: ['image/jpeg', 'image/png'] }],
          },
          {
            order: 6, phase: 'COMMISSIONING', name: 'CoC & System Commissioning',
            description: 'Certificate of Compliance, PV commissioning report, and BESS commissioning report.',
            isHardGate: true, estimatedDays: 7,
            requiredArtefacts: [{ name: 'CoC', allowedTypes: ['application/pdf'] }, { name: 'PV Commissioning Report', allowedTypes: ['application/pdf'] }, { name: 'BESS Commissioning Report', allowedTypes: ['application/pdf'] }],
          },
          {
            order: 7, phase: 'OPERATIONAL', name: 'Operational Handover',
            description: 'Full handover pack including O&M manuals, warranty documents, BMS credentials.',
            isHardGate: true, estimatedDays: 2,
            requiredArtefacts: [{ name: 'Handover Pack', allowedTypes: ['application/pdf'] }],
          },
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

  const siteSandton = await db.site.upsert({ where: { id: 'site-sandton' }, update: {}, create: { id: 'site-sandton', addressLine: '88 Maude Street', city: 'Sandton', province: 'Gauteng', latitude: -26.1076, longitude: 28.0567, irradianceKwhM2Day: 5.6 } })
  const siteBoksburg = await db.site.upsert({ where: { id: 'site-boksburg' }, update: {}, create: { id: 'site-boksburg', addressLine: '14 Atlas Road', city: 'Boksburg', province: 'Gauteng', latitude: -26.2163, longitude: 28.2614, irradianceKwhM2Day: 5.7 } })
  const siteManchester = await db.site.upsert({ where: { id: 'site-manchester' }, update: {}, create: { id: 'site-manchester', addressLine: '22 Rivonia Road', city: 'Sandton', province: 'Gauteng', latitude: -26.1052, longitude: 28.0578, irradianceKwhM2Day: 5.6 } })

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

  const projectSandton = await db.project.upsert({
    where: { id: 'project-sandton' },
    update: {},
    create: { id: 'project-sandton', name: 'Spaza Sandton Office Solar', contractorCompanyId: adebayo.id, clientCompanyId: spaza.id, siteId: siteSandton.id, technology: 'SOLAR_PV', gridConnectionStatus: 'GRID_TIED', systemSizeKw: 220, dealStructure: 'PPA', ppaTariffCents: 192, stage: 'OPERATIONAL', templateSnapshot: [], templateVersion: 1, clientNeeds: 'Reduce grid reliance at flagship Sandton office. ESG reporting requirement.', completionPercentage: 100, completedAt: daysAgo(545) },
  })
  const projectBoksburg = await db.project.upsert({
    where: { id: 'project-boksburg' },
    update: {},
    create: { id: 'project-boksburg', name: 'Spaza Boksburg Warehouse Solar + BESS', contractorCompanyId: adebayo.id, clientCompanyId: spaza.id, siteId: siteBoksburg.id, technology: 'HYBRID', gridConnectionStatus: 'GRID_TIED_WITH_BACKUP', systemSizeKw: 850, storageSizeKwh: 800, dealStructure: 'PPA', ppaTariffCents: 188, stage: 'OPERATIONAL', templateSnapshot: [], templateVersion: 1, clientNeeds: 'Cold chain backup power and peak demand reduction for distribution warehouse.', completionPercentage: 100, completedAt: daysAgo(28) },
  })
  await db.project.upsert({
    where: { id: 'project-manchester' },
    update: {},
    create: { id: 'project-manchester', name: 'Manchester Sandton Restaurant Solar', contractorCompanyId: adebayo.id, clientCompanyId: manchester.id, siteId: siteManchester.id, technology: 'SOLAR_PV', gridConnectionStatus: 'GRID_TIED', systemSizeKw: 35, dealStructure: 'OUTRIGHT', contractValueCents: 42_000_00, stage: 'OPERATIONAL', templateSnapshot: [], templateVersion: 1, clientNeeds: 'Reduce electricity costs. Client did not want the monitoring dashboard.', completionPercentage: 100, completedAt: daysAgo(200) },
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
  // RFQs, Bids, Job Card (Marketplace demo data)
  // -------------------------------------------------------------------------

  // Open RFQ — Structural Engineering needed for Project Alpha
  const rfqStructural = await db.rfq.upsert({
    where: { id: 'rfq-alpha-structural' },
    update: {},
    create: {
      id: 'rfq-alpha-structural',
      projectId: projectAlpha.id,
      milestoneId: 'ms-alpha-4',
      category: 'STRUCTURAL_CIVILS',
      title: 'Structural Engineering Report — Spaza Soweto Retail Solar PPA',
      description: 'Require a SACPCMP-registered structural engineer to produce a roof loading analysis and mounting system specification for a 450kW commercial solar installation on a retail centre.',
      scopeOfWork: 'Roof structural assessment, loading calculations per SANS 10160-2, mounting system specification, PE-stamped report, drawings.',
      budgetCentsMax: 85_000_00,
      deadlineDays: 21,
      status: 'OPEN',
    },
  })

  // AWARDED RFQ — Grid Connection Application (demo: escrow payment flow)
  const rfqGrid = await db.rfq.upsert({
    where: { id: 'rfq-alpha-grid' },
    update: {},
    create: {
      id: 'rfq-alpha-grid',
      projectId: projectAlpha.id,
      category: 'ENGINEERING',
      title: 'Grid Connection Application Support — 450kW Embedded Generation',
      description: 'Require an electrical engineer to prepare and submit the grid connection application to City Power for a 450kW embedded generation installation.',
      scopeOfWork: 'Single-line diagram, protection relay specification, grid application submission, liaison with City Power.',
      budgetCentsMax: 35_000_00,
      deadlineDays: 30,
      status: 'AWARDED',
    },
  })

  // Bid from Mokoena on the grid connection RFQ — ACCEPTED (bid is awarded)
  await db.bid.upsert({
    where: { id: 'bid-grid-mokoena' },
    update: {},
    create: {
      id: 'bid-grid-mokoena',
      rfqId: rfqGrid.id,
      providerCompanyId: mokoena.id,
      amountCents: 28_500_00,
      proposalText: 'We have extensive experience with City Power and Eskom grid connection applications for embedded generation up to 1MW. Our team includes a registered professional electrical engineer (Pr.Eng) who will prepare the full SLD, protection relay specification, and manage the submission process end-to-end. Typical approval timeline is 6–8 weeks after submission.',
      estimatedDays: 25,
      status: 'ACCEPTED',
    },
  })

  // Escrow invoice + payment for grid job card (AWAITING_PROOF — demo starting state)
  const gridPlatformFee = Math.round(28_500_00 * 0.05)
  const gridVat = Math.round(28_500_00 * 0.15)
  const gridInvoice = await db.invoice.upsert({
    where: { invoiceNumber: 'SEE-INV-2026-GRID1' },
    update: {},
    create: {
      invoiceNumber: 'SEE-INV-2026-GRID1',
      issuerType: 'PLATFORM',
      issuerCompanyId: null,
      recipientCompanyId: adebayo.id,
      status: 'AWAITING_PAYMENT',
      subtotalCents: 28_500_00,
      vatRate: 0.15,
      vatCents: gridVat,
      totalCents: 28_500_00 + gridVat,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notes: 'Service escrow — Grid Connection Application Support — 450kW Embedded Generation',
      lineItems: {
        create: [{
          description: 'Grid Connection Application Support — 450kW Embedded Generation',
          quantity: 1,
          unitPriceCents: 28_500_00,
          totalCents: 28_500_00,
          type: 'SERVICE_ESCROW',
          relatedEntityId: 'jobcard-grid',
        }],
      },
      payments: {
        create: [{
          id: 'payment-grid-escrow',
          rail: 'EFT',
          amountCents: 28_500_00 + gridVat,
          status: 'AWAITING_PROOF',
          reference: 'SEE-ESC-240101',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }],
      },
    },
    include: { payments: true },
  })
  void gridInvoice // suppress unused warning

  // Delete any existing job card for this RFQ (may have been created by acceptBid during testing)
  await db.jobCard.deleteMany({ where: { rfqId: rfqGrid.id } })
  await db.jobCard.create({
    data: {
      id: 'jobcard-grid',
      rfqId: rfqGrid.id,
      providerCompanyId: mokoena.id,
      scopeOfWork: 'Single-line diagram, protection relay specification, grid application submission, liaison with City Power.',
      amountCents: 28_500_00,
      seePlatformFeeCents: gridPlatformFee,
      escrowStatus: 'AWAITING_PAYMENT',
      status: 'ACTIVE',
      escrowPaymentId: 'payment-grid-escrow',
    },
  })

  // Bid from Lerato's company on the structural RFQ
  await db.bid.upsert({
    where: { id: 'bid-structural-mokoena' },
    update: {},
    create: {
      id: 'bid-structural-mokoena',
      rfqId: rfqStructural.id,
      providerCompanyId: mokoena.id,
      amountCents: 72_000_00,
      proposalText: 'We have completed 80+ commercial solar structural assessments across Gauteng. Our team is SACPCMP registered and we carry full PI insurance. Turnaround: 14 working days from site visit. Includes two revision cycles and PE stamp.',
      estimatedDays: 18,
      status: 'SUBMITTED',
    },
  })

  // Awarded RFQ for Kruger Farm (full lifecycle demo)
  const rfqKrugerEia = await db.rfq.upsert({
    where: { id: 'rfq-kruger-eia' },
    update: {},
    create: {
      id: 'rfq-kruger-eia',
      projectId: projectKruger.id,
      category: 'LEGAL',
      title: 'Environmental Impact Assessment — Kruger Family Farm 120kW',
      description: 'Completed EIA for the Kruger Family Farm 120kW hybrid solar installation.',
      scopeOfWork: 'Full EIA including public participation, wetland assessment, NEMA compliance.',
      budgetCentsMax: 45_000_00,
      deadlineDays: 60,
      status: 'AWARDED',
    },
  })

  await db.bid.upsert({
    where: { id: 'bid-kruger-eia-mokoena' },
    update: {},
    create: {
      id: 'bid-kruger-eia-mokoena',
      rfqId: rfqKrugerEia.id,
      providerCompanyId: mokoena.id,
      amountCents: 38_500_00,
      proposalText: 'Completed over 40 EIAs for renewable energy projects. Wetland specialist on team. NEMA-compliant reports.',
      estimatedDays: 45,
      status: 'ACCEPTED',
    },
  })

  // Second bid on the same RFQ — rejected to demonstrate the full bid comparison flow
  await db.bid.upsert({
    where: { id: 'bid-kruger-eia-capegrid' },
    update: {},
    create: {
      id: 'bid-kruger-eia-capegrid',
      rfqId: rfqKrugerEia.id,
      providerCompanyId: capeGrid.id,
      amountCents: 52_000_00,
      proposalText: 'Extensive EIA experience across the Western Cape and Northern Cape regions. Our team includes a registered environmental assessment practitioner (EAP) and a hydrology specialist.',
      estimatedDays: 60,
      status: 'REJECTED',
    },
  })

  const existingJobCard = await db.jobCard.findUnique({ where: { id: 'jobcard-kruger-eia' } })
  if (!existingJobCard) {
    await db.jobCard.create({
      data: {
        id: 'jobcard-kruger-eia',
        rfqId: rfqKrugerEia.id,
        providerCompanyId: mokoena.id,
        scopeOfWork: 'Full EIA including public participation, wetland assessment, NEMA compliance. PE-stamped report and supporting hydrological model.',
        amountCents: 38_500_00,
        seePlatformFeeCents: 38_500_00 * 0.05, // 5% SEE commission
        escrowStatus: 'LOCKED',
        status: 'ACTIVE',
        deliverables: {
          create: [
            { id: 'del-kruger-eia-v1', name: 'EIA Draft v1.pdf', url: 'https://example.com/seed/eia-draft-v1.pdf', version: 1 },
          ],
        },
        messages: {
          create: [
            { senderUserId: lerato.id, body: 'Site visit completed on 12 May. Draft report in progress — will upload for review by 20 May.' },
            { senderUserId: marcus.id, body: 'Thanks Lerato. Please ensure section 4.3 covers the stormwater management plan in detail — admin flagged this on the previous version.' },
          ],
        },
      },
    })
  }

  // Reviews for Mokoena — shown on their profile page
  await db.review.upsert({
    where: { id: 'review-mokoena-1' } as never,
    update: {},
    create: {
      id: 'review-mokoena-1',
      jobCardId: 'jobcard-kruger-eia',
      reviewedCompanyId: mokoena.id,
      rating: 5,
      text: 'Lerato and her team were exceptional — PE-stamped report delivered ahead of schedule, and they flagged a stormwater issue we had missed. Would use again without hesitation.',
    } as never,
  })

  console.log('  ✓ RFQs, bids, job card (marketplace demo data)')

  // -------------------------------------------------------------------------
  // O&M License — Kruger Farm (AI tier, ACTIVE — for contractor monitoring + client demo)
  // -------------------------------------------------------------------------

  await db.omLicense.upsert({
    where: { id: 'license-kruger-ai' },
    update: {},
    create: {
      id: 'license-kruger-ai',
      projectId: projectKruger.id,
      licenseeCompanyId: kruger.id,
      viewerType: 'CLIENT',
      tier: 'AI',
      status: 'ACTIVE',
      monthlyFeeCents: 1_200_00,
      activatedAt: daysAgo(180),
      nextBillingAt: daysFromNow(15),
      resellerCompanyId: adebayo.id,
      commissionRate: 0.20,
    },
  })

  await db.omLicense.upsert({
    where: { id: 'license-kruger-epc' },
    update: {},
    create: {
      id: 'license-kruger-epc',
      projectId: projectKruger.id,
      licenseeCompanyId: adebayo.id,
      viewerType: 'EPC',
      tier: 'AI',
      status: 'ACTIVE',
      monthlyFeeCents: 0,
      activatedAt: daysAgo(180),
      nextBillingAt: daysFromNow(15),
    },
  })

  console.log('  ✓ O&M licenses (Kruger Farm — AI tier, active)')

  // PlatformBankAccount
  await db.platformBankAccount.upsert({ where: { id: 'bank-see-fnb' }, update: {}, create: { id: 'bank-see-fnb', accountName: 'SEE Platform Operations (Pty) Ltd', bankName: 'First National Bank', accountNumber: '62850012345', branchCode: '250655', accountType: 'Business Cheque', swiftCode: 'FIRNZAJJ', isActive: true, notes: 'Primary ZAR account' } })
  console.log('  ✓ Platform bank account')

  // EnterpriseLicense — Spaza Holdings (covers Soweto + Sandton, NOT Boksburg)
  const enterpriseLicense = await db.enterpriseLicense.upsert({
    where: { contractReference: 'ENT-2025-SPAZA-001' },
    update: {},
    create: { id: 'enterprise-spaza', clientCompanyId: spaza.id, status: 'ACTIVE', contractReference: 'ENT-2025-SPAZA-001', contractStartDate: daysAgo(240), reviewCadence: 'ANNUAL', nextReviewDate: daysFromNow(125), baseMonthlyFeeCents: 850_000, perSeatMonthlyFeeCents: 25_000, perIntegrationFees: { OUTBOUND_WEBHOOK: 120_000, SCHEDULED_EXPORT: 80_000 }, usageRates: { apiCallsPer1000Cents: 50 }, oneTimeSetupFeeCents: 500_000, oneTimeSetupInvoiced: true, resellerCompanyId: adebayo.id, negotiatedCommissionRate: 0.10, notes: 'MSA signed 2025-09-20. Annual review.', activatedAt: daysAgo(240) },
  })
  await db.enterpriseProjectScope.upsert({ where: { licenseId_projectId: { licenseId: enterpriseLicense.id, projectId: projectAlpha.id } }, update: {}, create: { licenseId: enterpriseLicense.id, projectId: projectAlpha.id } })
  await db.enterpriseProjectScope.upsert({ where: { licenseId_projectId: { licenseId: enterpriseLicense.id, projectId: projectSandton.id } }, update: {}, create: { licenseId: enterpriseLicense.id, projectId: projectSandton.id } })
  await db.enterpriseIntegration.upsert({ where: { id: 'ent-int-webhook' }, update: {}, create: { id: 'ent-int-webhook', licenseId: enterpriseLicense.id, type: 'OUTBOUND_WEBHOOK', status: 'ACTIVE', config: { url: 'https://erp.spazaholdings.co.za/webhooks/see', events: ['alert.raised', 'milestone.hit'] }, lastActivityAt: daysAgo(1), monthlyFeeCents: 120_000 } })
  await db.enterpriseIntegration.upsert({ where: { id: 'ent-int-export' }, update: {}, create: { id: 'ent-int-export', licenseId: enterpriseLicense.id, type: 'SCHEDULED_EXPORT', status: 'ACTIVE', config: { destination: 's3://spaza-analytics/see/', format: 'CSV', schedule: 'daily 01:00' }, lastActivityAt: daysAgo(1), monthlyFeeCents: 80_000 } })
  await db.enterpriseUsageRecord.upsert({ where: { licenseId_period_metric: { licenseId: enterpriseLicense.id, period: new Date('2026-05-01'), metric: 'API_CALLS' } }, update: {}, create: { licenseId: enterpriseLicense.id, period: new Date('2026-05-01'), metric: 'API_CALLS', units: 47392, billedCents: Math.round(47392 / 1000 * 50) } })
  await db.enterpriseUsageRecord.upsert({ where: { licenseId_period_metric: { licenseId: enterpriseLicense.id, period: new Date('2026-05-01'), metric: 'WEBHOOK_DELIVERIES' } }, update: {}, create: { licenseId: enterpriseLicense.id, period: new Date('2026-05-01'), metric: 'WEBHOOK_DELIVERIES', units: 1284, billedCents: 0 } })
  console.log('  ✓ Enterprise license (Spaza Holdings)')

  // OmLicenses — Sandton: EPC + CLIENT both ACTIVE (Adebayo resells)
  await db.omLicense.upsert({ where: { id: 'license-sandton-epc' }, update: {}, create: { id: 'license-sandton-epc', projectId: projectSandton.id, licenseeCompanyId: adebayo.id, viewerType: 'EPC', tier: 'AI', status: 'ACTIVE', monthlyFeeCents: 0, activatedAt: daysAgo(540), nextBillingAt: daysFromNow(20) } })
  await db.omLicense.upsert({ where: { id: 'license-sandton-client' }, update: {}, create: { id: 'license-sandton-client', projectId: projectSandton.id, licenseeCompanyId: spaza.id, viewerType: 'CLIENT', tier: 'AI', status: 'ACTIVE', monthlyFeeCents: 180_000, activatedAt: daysAgo(540), nextBillingAt: daysFromNow(20), resellerCompanyId: adebayo.id, commissionRate: 0.20 } })
  // Manchester: EPC ACTIVE (self-licensed, Flow B)
  await db.omLicense.upsert({ where: { id: 'license-manchester-epc' }, update: {}, create: { id: 'license-manchester-epc', projectId: 'project-manchester', licenseeCompanyId: adebayo.id, viewerType: 'EPC', tier: 'BASIC', status: 'ACTIVE', monthlyFeeCents: 35_000, activatedAt: daysAgo(190), nextBillingAt: daysFromNow(10) } })
  console.log('  ✓ O&M licenses (Sandton + Manchester)')

  // LicenseCommission history — Sandton (5 PAID + 1 ACCRUED)
  const commissionMonths = [
    { period: new Date('2025-12-01'), status: 'PAID' as const, paidAt: daysAgo(135) },
    { period: new Date('2026-01-01'), status: 'PAID' as const, paidAt: daysAgo(104) },
    { period: new Date('2026-02-01'), status: 'PAID' as const, paidAt: daysAgo(76) },
    { period: new Date('2026-03-01'), status: 'PAID' as const, paidAt: daysAgo(45) },
    { period: new Date('2026-04-01'), status: 'PAID' as const, paidAt: daysAgo(14) },
    { period: new Date('2026-05-01'), status: 'ACCRUED' as const, paidAt: null },
  ]
  for (const cm of commissionMonths) {
    await db.licenseCommission.upsert({ where: { licenseId_period: { licenseId: 'license-sandton-client', period: cm.period } }, update: {}, create: { licenseId: 'license-sandton-client', resellerCompanyId: adebayo.id, period: cm.period, amountCents: 36_000, status: cm.status, paidAt: cm.paidAt } })
  }
  console.log('  ✓ License commissions (Sandton)')

  // Historical invoice + payment (Kruger Farm AI license activation, paid 6 months ago)
  await db.invoice.upsert({
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
      notes: 'O&M AI License activation — Kruger Farm',
      lineItems: { create: [{ description: 'O&M AI License — Kruger Farm (first month)', quantity: 1, unitPriceCents: 120_000, totalCents: 120_000, type: 'OM_LICENSE_ACTIVATION', relatedEntityId: 'license-kruger-ai' }] },
      payments: { create: [{ id: 'pay-kruger-activation', rail: 'EFT', amountCents: 138_000, status: 'PAID', reference: 'SEE-KR001-2025', reconciledAt: daysAgo(177), bankReference: 'SEE-KR001-2025', expiresAt: daysAgo(171) }] },
    },
  })
  console.log('  ✓ Historical invoice + payment (Kruger Farm)')

  // -------------------------------------------------------------------------
  // O&M Events — Kruger Farm (maintenance history)
  // -------------------------------------------------------------------------

  const omEvents = [
    {
      id: 'ome-1', projectId: projectKruger.id, type: 'MAINTENANCE' as const,
      title: 'Quarterly inverter service', description: 'SunSynk inverter firmware update + capacitor check.',
      scheduledAt: daysAgo(45), completedAt: daysAgo(44),
    },
    {
      id: 'ome-2', projectId: projectKruger.id, type: 'CLEANING' as const,
      title: 'Panel cleaning — North array',
      description: 'Dust accumulation identified via performance drop. 48 panels cleaned.',
      scheduledAt: daysAgo(22), completedAt: daysAgo(21),
    },
    {
      id: 'ome-3', projectId: projectKruger.id, type: 'INSPECTION' as const,
      title: 'Semi-annual electrical inspection',
      description: 'Full installation inspection per COC requirements. No defects found.',
      scheduledAt: daysFromNow(14),
    },
    {
      id: 'ome-4', projectId: projectKruger.id, type: 'CLEANING' as const,
      title: 'Panel cleaning — South array',
      scheduledAt: daysFromNow(28),
    },
  ]

  for (const event of omEvents) {
    await db.omEvent.upsert({
      where: { id: event.id },
      update: {},
      create: event,
    })
  }

  console.log('  ✓ O&M events (Kruger Farm)')

  // -------------------------------------------------------------------------
  // Project Documents — Kruger Farm
  // -------------------------------------------------------------------------

  const projectDocs = [
    {
      id: 'doc-kruger-1', projectId: projectKruger.id, uploadedBy: marcus.id,
      category: 'Commissioning Certificate', name: 'Commissioning Certificate — Kruger Farm 120kW.pdf',
      url: 'https://example.com/seed/kruger-commissioning-cert.pdf', fileSize: 1_200_000,
    },
    {
      id: 'doc-kruger-2', projectId: projectKruger.id, uploadedBy: marcus.id,
      category: 'Warranty',
      name: 'SunSynk 8kW Inverter Warranty Registration.pdf',
      url: 'https://example.com/seed/kruger-inverter-warranty.pdf', fileSize: 340_000,
    },
    {
      id: 'doc-kruger-3', projectId: projectKruger.id, uploadedBy: marcus.id,
      category: 'O&M Manual', name: 'Operations & Maintenance Manual — Kruger Hybrid System.pdf',
      url: 'https://example.com/seed/kruger-om-manual.pdf', fileSize: 4_800_000,
    },
  ]

  for (const doc of projectDocs) {
    await db.projectDocument.upsert({
      where: { id: doc.id },
      update: {},
      create: doc,
    })
  }

  console.log('  ✓ Project documents (Kruger Farm)')

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

  // Sandton — 30 days
  for (let i = 29; i >= 0; i--) {
    const d = daysAgo(i)
    const base = 880 + Math.sin(i * 0.3) * 120
    await db.omReading.upsert({ where: { id: `reading-sandton-${i}` }, update: {}, create: { id: `reading-sandton-${i}`, projectId: projectSandton.id, inverterBrand: 'Victron', recordedAt: d, productionKwh: Math.round((base + Math.random() * 80) * 10) / 10, batterySoCPercent: null, consumptionKwh: Math.round((base * 0.75 + Math.random() * 60) * 10) / 10, irradianceWM2: Math.round(680 + Math.sin(i * 0.4) * 200 + Math.random() * 100) } })
  }
  // Boksburg — 28 days
  for (let i = 27; i >= 0; i--) {
    const d = daysAgo(i)
    const base = 3400 + Math.sin(i * 0.25) * 500
    await db.omReading.upsert({ where: { id: `reading-boksburg-${i}` }, update: {}, create: { id: `reading-boksburg-${i}`, projectId: projectBoksburg.id, inverterBrand: 'SunSynk', recordedAt: d, productionKwh: Math.round((base + Math.random() * 200) * 10) / 10, batterySoCPercent: Math.round(55 + Math.sin(i * 0.5) * 30 + Math.random() * 15), consumptionKwh: Math.round((base * 0.82 + Math.random() * 150) * 10) / 10, irradianceWM2: Math.round(700 + Math.sin(i * 0.35) * 220 + Math.random() * 120) } })
  }
  // Durbanville — 21 days
  for (let i = 20; i >= 0; i--) {
    const d = daysAgo(i)
    const base = 1160 + Math.sin(i * 0.4) * 180
    await db.omReading.upsert({ where: { id: `reading-durbanville-${i}` }, update: {}, create: { id: `reading-durbanville-${i}`, projectId: projectDurbanville.id, inverterBrand: 'Deye', recordedAt: d, productionKwh: Math.round((base + Math.random() * 100) * 10) / 10, batterySoCPercent: null, consumptionKwh: Math.round((base * 0.8 + Math.random() * 80) * 10) / 10, irradianceWM2: Math.round(640 + Math.sin(i * 0.4) * 190 + Math.random() * 80) } })
  }
  console.log('  ✓ O&M readings (Sandton, Boksburg, Durbanville)')

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
  // Project Communications — Project Alpha Workspace
  // -------------------------------------------------------------------------

  // Skip if workspace already exists (idempotent)
  const existingWorkspace = await db.projectWorkspace.findUnique({
    where: { projectId: projectAlpha.id },
  })

  if (!existingWorkspace) {
    const workspace = await db.projectWorkspace.create({
      data: { projectId: projectAlpha.id },
    })

    // Default channels
    const generalCh = await db.channel.create({
      data: { workspaceId: workspace.id, name: 'general', displayName: 'General', description: 'Broad project discussion', kind: 'DEFAULT', isPinned: true },
    })
    const siteUpdatesCh = await db.channel.create({
      data: { workspaceId: workspace.id, name: 'site-updates', displayName: 'Site Updates', description: 'Field updates, photos, and site conditions', kind: 'DEFAULT' },
    })
    const clientCh = await db.channel.create({
      data: { workspaceId: workspace.id, name: 'client', displayName: 'Client', description: 'Client-facing communications', kind: 'DEFAULT' },
    })
    const adminCh = await db.channel.create({
      data: { workspaceId: workspace.id, name: 'admin', displayName: 'Admin', description: 'Platform administration', kind: 'DEFAULT' },
    })

    // Milestone thread channels
    const eiaCh = await db.channel.create({
      data: { workspaceId: workspace.id, name: 'environmental-impact-assessment-3', displayName: 'Environmental Impact Assessment', description: 'Thread for milestone: Environmental Impact Assessment', kind: 'MILESTONE_THREAD', milestoneId: 'ms-alpha-3' },
    })
    const civilCh = await db.channel.create({
      data: { workspaceId: workspace.id, name: 'site-assessment-report-1', displayName: 'Site Assessment Report', description: 'Thread for milestone: Site Assessment Report', kind: 'MILESTONE_THREAD', milestoneId: 'ms-alpha-1' },
    })
    const structuralCh = await db.channel.create({
      data: { workspaceId: workspace.id, name: 'structural-engineering-report-2', displayName: 'Structural Engineering Report', description: 'Thread for milestone: Structural Engineering Report', kind: 'MILESTONE_THREAD', milestoneId: 'ms-alpha-2' },
    })
    const gridCh = await db.channel.create({
      data: { workspaceId: workspace.id, name: 'grid-connection-application-4', displayName: 'Grid Connection Application', description: 'Thread for milestone: Grid Connection Application', kind: 'MILESTONE_THREAD', milestoneId: 'ms-alpha-4' },
    })
    const financialCh = await db.channel.create({
      data: { workspaceId: workspace.id, name: 'financial-close-documentation-5', displayName: 'Financial Close Documentation', description: 'Thread for milestone: Financial Close Documentation', kind: 'MILESTONE_THREAD', milestoneId: 'ms-alpha-5' },
    })
    const constructionCh = await db.channel.create({
      data: { workspaceId: workspace.id, name: 'construction-commencement-6', displayName: 'Construction Commencement', description: 'Thread for milestone: Construction Commencement', kind: 'MILESTONE_THREAD', milestoneId: 'ms-alpha-6' },
    })
    const commissioningCh = await db.channel.create({
      data: { workspaceId: workspace.id, name: 'commissioning-certificate-7', displayName: 'Commissioning Certificate', description: 'Thread for milestone: Commissioning Certificate', kind: 'MILESTONE_THREAD', milestoneId: 'ms-alpha-7' },
    })
    const handoverCh = await db.channel.create({
      data: { workspaceId: workspace.id, name: 'operational-handover-8', displayName: 'Operational Handover', description: 'Thread for milestone: Operational Handover', kind: 'MILESTONE_THREAD', milestoneId: 'ms-alpha-8' },
    })

    // Contractor team (Marcus + Naledi) as OWNER in all channels
    const contractorChannels = [generalCh, siteUpdatesCh, clientCh, adminCh, eiaCh, civilCh, structuralCh, gridCh, financialCh, constructionCh, commissioningCh, handoverCh]
    for (const ch of contractorChannels) {
      await db.channelMembership.createMany({
        data: [
          { channelId: ch.id, userId: marcus.id, role: 'OWNER' },
          { channelId: ch.id, userId: naledi.id, role: 'OWNER' },
        ],
        skipDuplicates: true,
      })
    }

    // Lerato (service provider) as GUEST in site-updates + EIA milestone thread + structural thread
    await db.channelMembership.createMany({
      data: [
        { channelId: siteUpdatesCh.id, userId: lerato.id, role: 'GUEST' },
        { channelId: eiaCh.id, userId: lerato.id, role: 'GUEST' },
        { channelId: structuralCh.id, userId: lerato.id, role: 'OWNER' },
        { channelId: civilCh.id, userId: lerato.id, role: 'OWNER' },
      ],
      skipDuplicates: true,
    })

    // Sipho (client) as GUEST in client channel only
    await db.channelMembership.create({
      data: { channelId: clientCh.id, userId: sipho.id, role: 'GUEST' },
    })

    // Erin (admin) as OBSERVER in admin channel + all milestone threads
    const adminChannels = [adminCh, eiaCh, civilCh, structuralCh, gridCh, financialCh, constructionCh, commissioningCh, handoverCh]
    for (const ch of adminChannels) {
      await db.channelMembership.create({
        data: { channelId: ch.id, userId: erin.id, role: 'OBSERVER' },
      })
    }

    // -----------------------------------------------------------------------
    // Messages — #general
    // -----------------------------------------------------------------------

    await db.message.create({ data: {
      channelId: generalCh.id, authorUserId: null, isSystem: true,
      body: 'Project workspace created. Add your team members and start collaborating.',
      createdAt: daysAgo(540), updatedAt: daysAgo(540),
    }})

    await db.message.create({ data: {
      channelId: generalCh.id, authorUserId: marcus.id,
      body: 'Kicking off Project Alpha. Site assessment scheduled for next week. Naledi, can you coordinate with the site team?',
      createdAt: daysAgo(539), updatedAt: daysAgo(539),
    }})

    await db.message.create({ data: {
      channelId: generalCh.id, authorUserId: naledi.id,
      body: 'On it. Site team confirmed for Tuesday 9am. Will send the pre-visit checklist.',
      createdAt: daysAgo(538), updatedAt: daysAgo(538),
    }})

    await db.message.create({ data: {
      channelId: generalCh.id, authorUserId: marcus.id,
      body: 'Site assessment report received and signed off. Moving to structural next.',
      createdAt: daysAgo(450), updatedAt: daysAgo(450),
    }})

    await db.message.create({ data: {
      channelId: generalCh.id, authorUserId: naledi.id,
      body: 'EIA submission in. Environmental consultant says we should have the approval within 45 days. Fingers crossed.',
      createdAt: daysAgo(350), updatedAt: daysAgo(350),
    }})

    await db.message.create({ data: {
      channelId: generalCh.id, authorUserId: marcus.id,
      body: 'EIA came back rejected. Not ideal but we know what to fix. Naledi is on it with the consultant.',
      createdAt: daysAgo(200), updatedAt: daysAgo(200),
    }})

    await db.message.create({ data: {
      channelId: generalCh.id, authorUserId: marcus.id,
      body: 'EIA approved. The revised stormwater section did it. Now onto grid connection.',
      createdAt: daysAgo(130), updatedAt: daysAgo(130),
    }})

    await db.message.create({ data: {
      channelId: generalCh.id, authorUserId: naledi.id,
      body: 'Grid connection came through via the marketplace — Auto-Gold verified. Clean result.',
      createdAt: daysAgo(95), updatedAt: daysAgo(95),
    }})

    await db.message.create({ data: {
      channelId: generalCh.id, authorUserId: naledi.id,
      body: 'BESS install scheduled for next Thursday. Van der Berg confirmed equipment delivery Wednesday.',
      createdAt: daysAgo(7), updatedAt: daysAgo(7),
    }})

    await db.message.create({ data: {
      channelId: generalCh.id, authorUserId: marcus.id,
      body: 'Good. Let Sipho know so the site is clear. Has the financial close submission been reviewed yet?',
      createdAt: daysAgo(6), updatedAt: daysAgo(6),
    }})

    await db.message.create({ data: {
      channelId: generalCh.id, authorUserId: naledi.id,
      body: 'Still under review. Erin indicated it should be done by end of week.',
      createdAt: daysAgo(5), updatedAt: daysAgo(5),
    }})

    await db.channel.update({ where: { id: generalCh.id }, data: { lastMessageAt: daysAgo(5) } })

    // -----------------------------------------------------------------------
    // Messages — #site-updates
    // -----------------------------------------------------------------------

    await db.message.create({ data: {
      channelId: siteUpdatesCh.id, authorUserId: lerato.id,
      body: 'Site visit complete. Roof structure is solid — no structural concerns for the mounting system. Uploading photos.',
      createdAt: daysAgo(519), updatedAt: daysAgo(519),
    }})

    await db.message.create({ data: {
      channelId: siteUpdatesCh.id, authorUserId: marcus.id,
      body: 'Great. Any concerns about the north-facing sections?',
      createdAt: daysAgo(518), updatedAt: daysAgo(518),
    }})

    await db.message.create({ data: {
      channelId: siteUpdatesCh.id, authorUserId: lerato.id,
      body: 'North sections are fine. Slight shading from the storage building 10am–12pm but nothing that materially affects yield. Noted in the report.',
      createdAt: daysAgo(517), updatedAt: daysAgo(517),
    }})

    await db.message.create({ data: {
      channelId: siteUpdatesCh.id, authorUserId: lerato.id,
      body: 'Structural report submitted. Full sign-off included. Report is in the milestone thread.',
      createdAt: daysAgo(460), updatedAt: daysAgo(460),
    }})

    await db.message.create({ data: {
      channelId: siteUpdatesCh.id, authorUserId: lerato.id,
      body: 'Site visit postponed — heavy rain forecast through Thursday. Rescheduling EIA field assessment to next week.',
      createdAt: daysAgo(380), updatedAt: daysAgo(380),
    }})

    await db.message.create({ data: {
      channelId: siteUpdatesCh.id, authorUserId: naledi.id,
      body: 'Noted. Keep us posted. Environmental consultant is flexible on timing.',
      createdAt: daysAgo(379), updatedAt: daysAgo(379),
    }})

    await db.message.create({ data: {
      channelId: siteUpdatesCh.id, authorUserId: lerato.id,
      body: 'Civil works milestone hit. Trenching complete, cable conduits laid. Photos attached.',
      attachments: JSON.parse(JSON.stringify([
        { name: 'civil-completion-1.jpg', url: 'https://example.com/seed/civil-1.jpg', fileSize: 1_200_000, mimeType: 'image/jpeg' },
        { name: 'civil-completion-2.jpg', url: 'https://example.com/seed/civil-2.jpg', fileSize: 980_000, mimeType: 'image/jpeg' },
      ])),
      createdAt: daysAgo(180), updatedAt: daysAgo(180),
    }})

    await db.message.create({ data: {
      channelId: siteUpdatesCh.id, authorUserId: marcus.id,
      body: 'Good work. Filing this against the structural milestone.',
      entityRefs: JSON.parse(JSON.stringify([{ type: 'milestone', id: 'ms-alpha-2' }])),
      createdAt: daysAgo(179), updatedAt: daysAgo(179),
    }})

    await db.message.create({ data: {
      channelId: siteUpdatesCh.id, authorUserId: lerato.id,
      body: 'BESS delivery vehicle confirmed. ETA Wednesday 2pm at gate 2. Site manager notified.',
      createdAt: daysAgo(3), updatedAt: daysAgo(3),
    }})

    await db.message.create({ data: {
      channelId: siteUpdatesCh.id, authorUserId: naledi.id,
      body: 'Perfect. Site visit scheduled Thursday 10am for the BESS install inspection.',
      createdAt: daysAgo(2), updatedAt: daysAgo(2),
    }})

    await db.channel.update({ where: { id: siteUpdatesCh.id }, data: { lastMessageAt: daysAgo(2) } })

    // -----------------------------------------------------------------------
    // Messages — #client
    // -----------------------------------------------------------------------

    await db.message.create({ data: {
      channelId: clientCh.id, authorUserId: marcus.id,
      body: 'Welcome to the Spaza Soweto project workspace, Sipho. This channel is your direct line to the project team.',
      createdAt: daysAgo(530), updatedAt: daysAgo(530),
    }})

    await db.message.create({ data: {
      channelId: clientCh.id, authorUserId: sipho.id,
      body: 'Thanks Marcus. Quick question on the PPA tariff — the R1.98/kWh is fixed for the full 20 years, correct?',
      createdAt: daysAgo(529), updatedAt: daysAgo(529),
    }})

    await db.message.create({ data: {
      channelId: clientCh.id, authorUserId: marcus.id,
      body: 'Correct — fixed for 20 years with a 3% annual escalation clause as per the signed PPA. The bank confirmation covers this.',
      createdAt: daysAgo(528), updatedAt: daysAgo(528),
    }})

    await db.message.create({ data: {
      channelId: clientCh.id, authorUserId: naledi.id,
      body: 'Monthly update: EIA submission in progress, grid connection application submitted to City Power. On track for financial close Q2.',
      createdAt: daysAgo(300), updatedAt: daysAgo(300),
    }})

    await db.message.create({ data: {
      channelId: clientCh.id, authorUserId: sipho.id,
      body: 'Understood. Any impact from the EIA process on the construction timeline?',
      createdAt: daysAgo(299), updatedAt: daysAgo(299),
    }})

    await db.message.create({ data: {
      channelId: clientCh.id, authorUserId: naledi.id,
      body: 'Potentially 3–4 weeks if approval is delayed. We have contingency built into the programme. Will update you immediately if anything changes.',
      createdAt: daysAgo(298), updatedAt: daysAgo(298),
    }})

    await db.message.create({ data: {
      channelId: clientCh.id, authorUserId: marcus.id,
      body: 'BESS installation begins next week. The storage unit will increase your grid displacement from 60% to approximately 78%. Site access required Wednesday morning for delivery.',
      createdAt: daysAgo(8), updatedAt: daysAgo(8),
    }})

    await db.message.create({ data: {
      channelId: clientCh.id, authorUserId: sipho.id,
      body: 'Confirmed. I will have the site manager meet the delivery team at 2pm Wednesday at gate 2.',
      createdAt: daysAgo(7), updatedAt: daysAgo(7),
    }})

    await db.channel.update({ where: { id: clientCh.id }, data: { lastMessageAt: daysAgo(7) } })

    // -----------------------------------------------------------------------
    // Messages — #admin
    // -----------------------------------------------------------------------

    await db.message.create({ data: {
      channelId: adminCh.id, authorUserId: marcus.id,
      body: 'Project Alpha comms workspace active. Erin, you have observer access to all milestone threads.',
      createdAt: daysAgo(540), updatedAt: daysAgo(540),
    }})

    await db.message.create({ data: {
      channelId: adminCh.id, authorUserId: erin.id,
      body: 'Confirmed. Quick note on the EIA — please ensure the engineer has stamped the document before resubmission. Required per NEMA Section 24.',
      createdAt: daysAgo(210), updatedAt: daysAgo(210),
    }})

    await db.message.create({ data: {
      channelId: adminCh.id, authorUserId: marcus.id,
      body: 'Noted — will make sure the consulting engineer stamps v2 before we upload.',
      createdAt: daysAgo(209), updatedAt: daysAgo(209),
    }})

    await db.channel.update({ where: { id: adminCh.id }, data: { lastMessageAt: daysAgo(209) } })

    // -----------------------------------------------------------------------
    // Messages — EIA milestone thread (rejected-then-approved story)
    // -----------------------------------------------------------------------

    await db.message.create({ data: {
      channelId: eiaCh.id, authorUserId: naledi.id,
      body: 'EIA Report v1 submitted for review. Consultant confirms full NEMA Section 24 compliance. Awaiting admin decision.',
      createdAt: daysAgo(280), updatedAt: daysAgo(280),
    }})

    await db.message.create({ data: {
      channelId: eiaCh.id, authorUserId: marcus.id,
      body: 'Good. Erin has been notified of the submission.',
      createdAt: daysAgo(279), updatedAt: daysAgo(279),
    }})

    await db.message.create({ data: {
      channelId: eiaCh.id, authorUserId: erin.id,
      body: 'I am reviewing the EIA. One question — is section 4.3 on stormwater runoff referring to the wetland adjacent to the northern boundary?',
      createdAt: daysAgo(270), updatedAt: daysAgo(270),
    }})

    await db.message.create({ data: {
      channelId: eiaCh.id, authorUserId: marcus.id,
      body: 'Yes — the seasonal wetland on the northern boundary. The consultant assessed it but I can ask them to provide more detail.',
      createdAt: daysAgo(269), updatedAt: daysAgo(269),
    }})

    await db.message.create({ data: {
      channelId: eiaCh.id, authorUserId: erin.id,
      body: 'Submission v1 of "Environmental Impact Assessment" was rejected. Feedback: "The EIA does not adequately address stormwater runoff impacts on the adjacent wetland. Please resubmit with section 4.3 revised."',
      createdAt: daysAgo(260), updatedAt: daysAgo(260),
    }})

    await db.message.create({ data: {
      channelId: eiaCh.id, authorUserId: marcus.id,
      body: 'Understood. Will get the consultant to revise section 4.3 with the full hydrological assessment.',
      createdAt: daysAgo(259), updatedAt: daysAgo(259),
    }})

    await db.message.create({ data: {
      channelId: eiaCh.id, authorUserId: naledi.id,
      body: 'Consultant confirmed — they will conduct the additional site survey and update section 4.3. Estimated 3 weeks.',
      createdAt: daysAgo(258), updatedAt: daysAgo(258),
    }})

    await db.message.create({ data: {
      channelId: eiaCh.id, authorUserId: lerato.id,
      body: 'I can assist with the site measurements if the consultant needs structural data for the drainage assessment.',
      createdAt: daysAgo(255), updatedAt: daysAgo(255),
    }})

    await db.message.create({ data: {
      channelId: eiaCh.id, authorUserId: naledi.id,
      body: 'EIA Report v2 submitted. Section 4.3 fully revised with hydrological model and engineer stamp included.',
      createdAt: daysAgo(220), updatedAt: daysAgo(220),
    }})

    const eiaApprovalMsg = await db.message.create({ data: {
      channelId: eiaCh.id, authorUserId: erin.id,
      body: "Submission v2 of \"Environmental Impact Assessment\" was approved. Feedback: \"Engineer's stamp now present. All NEMA Section 24 references confirmed.\"",
      createdAt: daysAgo(200), updatedAt: daysAgo(200),
    }})

    await db.message.create({ data: {
      channelId: eiaCh.id, authorUserId: marcus.id,
      body: 'Excellent. Thank you Erin. On to grid connection.',
      createdAt: daysAgo(199), updatedAt: daysAgo(199),
    }})

    await db.message.create({ data: {
      channelId: eiaCh.id, authorUserId: naledi.id,
      body: 'Good news. The consultant will be pleased.',
      createdAt: daysAgo(198), updatedAt: daysAgo(198),
    }})

    await db.messageReaction.createMany({
      data: [
        { messageId: eiaApprovalMsg.id, userId: marcus.id, emoji: '🎉' },
        { messageId: eiaApprovalMsg.id, userId: naledi.id, emoji: '🎉' },
        { messageId: eiaApprovalMsg.id, userId: marcus.id, emoji: '👍' },
      ],
      skipDuplicates: true,
    })

    await db.channel.update({ where: { id: eiaCh.id }, data: { lastMessageAt: daysAgo(198) } })

    // -----------------------------------------------------------------------
    // Messages — financial close thread (UNDER_REVIEW)
    // -----------------------------------------------------------------------

    await db.message.create({ data: {
      channelId: financialCh.id, authorUserId: marcus.id,
      body: 'Financial close documents submitted. Signed PPA and Standard Bank confirmation both uploaded.',
      createdAt: daysAgo(10), updatedAt: daysAgo(10),
    }})

    await db.message.create({ data: {
      channelId: financialCh.id, authorUserId: naledi.id,
      body: 'Confirming — submission v1 is under review. Erin has been notified.',
      createdAt: daysAgo(9), updatedAt: daysAgo(9),
    }})

    await db.message.create({ data: {
      channelId: financialCh.id, authorUserId: marcus.id,
      body: 'Any timeline on the review? We want to keep the BESS install on schedule.',
      createdAt: daysAgo(8), updatedAt: daysAgo(8),
    }})

    await db.message.create({ data: {
      channelId: financialCh.id, authorUserId: naledi.id,
      body: `@${erin.id} — can you confirm the panel schedule review timeline by EOD?`,
      mentions: JSON.parse(JSON.stringify([{ type: 'user', userId: erin.id }])),
      createdAt: daysAgo(1), updatedAt: daysAgo(1),
    }})

    await db.channel.update({ where: { id: financialCh.id }, data: { lastMessageAt: daysAgo(1) } })

    // -----------------------------------------------------------------------
    // Messages — structural thread
    // -----------------------------------------------------------------------

    await db.message.create({ data: {
      channelId: structuralCh.id, authorUserId: lerato.id,
      body: 'Structural site survey complete. Roof loading capacity assessed — suitable for the specified panel layout.',
      createdAt: daysAgo(460), updatedAt: daysAgo(460),
    }})

    await db.message.create({ data: {
      channelId: structuralCh.id, authorUserId: lerato.id,
      body: 'Structural Engineering Report v1 submitted. PI-stamped with all load calculations.',
      createdAt: daysAgo(450), updatedAt: daysAgo(450),
    }})

    await db.message.create({ data: {
      channelId: structuralCh.id, authorUserId: marcus.id,
      body: 'Report approved. Great work Lerato.',
      createdAt: daysAgo(440), updatedAt: daysAgo(440),
    }})

    await db.channel.update({ where: { id: structuralCh.id }, data: { lastMessageAt: daysAgo(440) } })

    console.log('  ✓ Project Alpha comms workspace seeded (~70 messages, 12 channels)')
  } // end if (!existingWorkspace)

  console.log('\n✅ Demo seed complete!')
  console.log(`   Users: 8 | Companies: 9 | Projects: 6 | Milestones: 8 | Hardware: 5 | O&M readings: 30+79 | News: 5 | EnterpriseLicense: 1 | OmLicenses: +3 | Commissions: 6 | Invoices: 1`)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
