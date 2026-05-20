'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateCompanySchema = z.object({
  name: z.string().min(2, 'Company name required'),
  about: z.string().max(500).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  registrationNo: z.string().optional(),
  vatNo: z.string().optional(),
  beeeLevel: z.number().int().min(1).max(8).nullable(),
  logoUrl: z.string().url().optional().or(z.literal('')).nullable(),
})

export async function updateCompany(data: unknown) {
  const session = await auth()
  if (!session) throw new Error('Unauthorised')

  const parsed = updateCompanySchema.safeParse(data)
  if (!parsed.success) throw new Error('Invalid data')

  const { name, about, phone, email, websiteUrl, registrationNo, vatNo, beeeLevel, logoUrl } = parsed.data

  await db.company.update({
    where: { id: session.user.companyId },
    data: {
      name,
      about: about || null,
      phone: phone || null,
      email: email || null,
      websiteUrl: websiteUrl || null,
      registrationNo: registrationNo || null,
      vatNo: vatNo || null,
      beeeLevel,
      ...(logoUrl !== undefined ? { logoUrl: logoUrl || null } : {}),
    },
  })

  return { ok: true }
}
