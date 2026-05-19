'use server'
// server/actions/client.ts

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { z } from 'zod'
import type { OmEventType } from '@/lib/generated/prisma/client'

const createEventSchema = z.object({
  projectId: z.string(),
  type: z.string(),
  title: z.string().min(2),
  description: z.string().optional(),
  scheduledAt: z.string().datetime(),
})

export async function createOmEvent(data: z.infer<typeof createEventSchema>) {
  const parsed = createEventSchema.parse(data)
  await db.omEvent.create({
    data: {
      projectId: parsed.projectId,
      type: parsed.type as OmEventType,
      title: parsed.title,
      description: parsed.description ?? null,
      scheduledAt: new Date(parsed.scheduledAt),
    },
  })
  revalidatePath('/client/o-and-m')
}
