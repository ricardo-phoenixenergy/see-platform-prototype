'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Prisma } from '@/lib/generated/prisma/client'
import { selectMilestoneTemplate } from '@/lib/milestone-templates'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const CreateProjectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  clientName: z.string().min(2, 'Client name required'),
  technology: z.enum(['SOLAR_PV', 'WIND', 'BESS', 'HYBRID']),
  systemSizeKw: z.coerce.number().positive('System size must be positive'),
  dealStructure: z.enum(['OUTRIGHT', 'PPA', 'LEASE']),
  gridConnectionStatus: z.enum(['GRID_TIED', 'OFF_GRID', 'GRID_TIED_WITH_BACKUP']),
  addressLine: z.string().min(2),
  city: z.string().min(2),
  province: z.string().min(2),
  clientNeeds: z.string().optional(),
})

type CreateProjectInput = z.infer<typeof CreateProjectSchema>

type ActionResult = { ok: true; projectId: string } | { ok: false; error: string }

export async function createProject(input: CreateProjectInput): Promise<ActionResult> {
  const session = await auth()
  if (!session) return { ok: false, error: 'Not authenticated' }

  const parsed = CreateProjectSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const data = parsed.data

  try {
    const template = await selectMilestoneTemplate(data.technology, data.systemSizeKw, data.dealStructure)

    const templateSnapshot = template.items.map(item => ({
      id: item.id,
      order: item.order,
      phase: item.phase,
      name: item.name,
      description: item.description,
      isHardGate: item.isHardGate,
      requiredArtefacts: item.requiredArtefacts,
      estimatedDays: item.estimatedDays,
    }))

    const project = await db.$transaction(async (tx) => {
      const site = await tx.site.create({
        data: {
          addressLine: data.addressLine,
          city: data.city,
          province: data.province,
        },
      })

      const proj = await tx.project.create({
        data: {
          name: data.name,
          contractorCompanyId: session.user.companyId,
          externalClientName: data.clientName,
          siteId: site.id,
          technology: data.technology,
          systemSizeKw: data.systemSizeKw,
          dealStructure: data.dealStructure,
          gridConnectionStatus: data.gridConnectionStatus,
          ...(data.clientNeeds !== undefined ? { clientNeeds: data.clientNeeds } : {}),
          templateSnapshot,
          templateVersion: template.version,
        },
      })

      // Instantiate milestones from template
      await tx.milestone.createMany({
        data: template.items.map(item => ({
          projectId: proj.id,
          templateItemId: item.id,
          order: item.order,
          phase: item.phase,
          name: item.name,
          description: item.description,
          isHardGate: item.isHardGate,
          // requiredArtefacts is JsonValue (includes null); use Prisma.JsonNull for null values
          requiredArtefacts: item.requiredArtefacts === null
            ? Prisma.JsonNull
            : item.requiredArtefacts as Prisma.InputJsonValue,
          status: item.order === 1 ? 'AVAILABLE' : 'LOCKED',
        })),
      })

      // Award tokens for project creation
      await tx.walletBalance.update({
        where: { companyId: session.user.companyId },
        data: { tokens: { increment: 2000 } },
      })

      await tx.tokenTransaction.create({
        data: {
          companyId: session.user.companyId,
          amount: 2000,
          type: 'EARN_PROJECT_CREATE',
          description: `Project created: ${data.name}`,
          metadata: { projectId: proj.id },
        },
      })

      return proj
    })

    revalidatePath('/contractor/projects')
    return { ok: true, projectId: project.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create project'
    return { ok: false, error: message }
  }
}
