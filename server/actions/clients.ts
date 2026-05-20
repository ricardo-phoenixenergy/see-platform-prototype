'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const clientSchema = z.object({
  name: z.string().min(2, 'Client name required'),
  contactName: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  industry: z.string().optional(),
  notes: z.string().optional(),
})

export async function createClient(data: unknown) {
  const session = await auth()
  if (!session) throw new Error('Unauthorised')

  const parsed = clientSchema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid data')

  const client = await db.clientRecord.create({
    data: {
      contractorCompanyId: session.user.companyId,
      name: parsed.data.name,
      contactName: parsed.data.contactName || null,
      contactEmail: parsed.data.contactEmail || null,
      contactPhone: parsed.data.contactPhone || null,
      industry: parsed.data.industry || null,
      notes: parsed.data.notes || null,
    },
  })

  revalidatePath('/contractor/clients')
  return client.id
}

export async function updateClient(id: string, data: unknown) {
  const session = await auth()
  if (!session) throw new Error('Unauthorised')

  const parsed = clientSchema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid data')

  const existing = await db.clientRecord.findFirst({
    where: { id, contractorCompanyId: session.user.companyId },
  })
  if (!existing) throw new Error('Client not found')

  await db.clientRecord.update({
    where: { id },
    data: {
      name: parsed.data.name,
      contactName: parsed.data.contactName || null,
      contactEmail: parsed.data.contactEmail || null,
      contactPhone: parsed.data.contactPhone || null,
      industry: parsed.data.industry || null,
      notes: parsed.data.notes || null,
    },
  })

  revalidatePath(`/contractor/clients/${id}`)
  revalidatePath('/contractor/clients')
}
