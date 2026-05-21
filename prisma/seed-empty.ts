import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../lib/generated/prisma/client'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] ?? '' })
const db = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding minimal empty state...')

  const passwordHash = await bcrypt.hash('demo1234', 12)

  const marcus = await db.user.upsert({
    where: { email: 'marcus@adebayorenewables.co.za' },
    update: {},
    create: { email: 'marcus@adebayorenewables.co.za', name: 'Marcus Adebayo', emailVerified: new Date(), passwordHash },
  })

  const lerato = await db.user.upsert({
    where: { email: 'lerato@mokoenaeng.co.za' },
    update: {},
    create: { email: 'lerato@mokoenaeng.co.za', name: 'Lerato Mokoena', emailVerified: new Date(), passwordHash },
  })

  const sipho = await db.user.upsert({
    where: { email: 'sipho@spazaholdings.co.za' },
    update: {},
    create: { email: 'sipho@spazaholdings.co.za', name: 'Sipho Dlamini', emailVerified: new Date(), passwordHash },
  })

  const erin = await db.user.upsert({
    where: { email: 'erin@see.platform' },
    update: {},
    create: { email: 'erin@see.platform', name: 'Erin Berman-Levy', emailVerified: new Date(), passwordHash },
  })

  const adebayo = await db.company.upsert({
    where: { id: 'company-adebayo' },
    update: {},
    create: { id: 'company-adebayo', name: 'Adebayo Renewables', type: 'CONTRACTOR' },
  })

  const mokoena = await db.company.upsert({
    where: { id: 'company-mokoena' },
    update: {},
    create: { id: 'company-mokoena', name: 'Mokoena Structural Engineering', type: 'SERVICE_PROVIDER' },
  })

  const spaza = await db.company.upsert({
    where: { id: 'company-spaza' },
    update: {},
    create: { id: 'company-spaza', name: 'Spaza Holdings', type: 'END_CLIENT' },
  })

  const platformAdmin = await db.company.upsert({
    where: { id: 'company-see-admin' },
    update: {},
    create: { id: 'company-see-admin', name: 'SEE Platform Operations', type: 'PLATFORM_ADMIN' },
  })

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

  await db.tierStatus.upsert({
    where: { companyId: adebayo.id },
    update: {},
    create: { companyId: adebayo.id, tier: 'BRONZE', compliantProjectCount: 0 },
  })


  console.log('✅ Empty seed complete — 4 users, minimal companies and memberships')
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1) })
  .finally(() => db.$disconnect())
