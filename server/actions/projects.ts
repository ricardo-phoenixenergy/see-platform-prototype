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

  // session.user.id is string | undefined in Auth.js v5's DefaultSession.
  // We already checked session is not null above; id will always be set for
  // authenticated users. Narrow here rather than propagating the undefined.
  const currentUserId = session.user.id
  if (!currentUserId) return { ok: false, error: 'User ID missing from session' }

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

      // ── Auto-create project workspace ──────────────────────────────────────
      // Get all contractor company members to add as channel owners
      const contractorMembers = await tx.membership.findMany({
        where: { companyId: session.user.companyId },
        select: { userId: true },
      })
      const memberUserIds = contractorMembers.map(m => m.userId)

      // Get all ADMIN users to add as observers to #admin
      const adminMemberships = await tx.membership.findMany({
        where: { company: { type: 'PLATFORM_ADMIN' } },
        select: { userId: true },
      })
      const adminUserIds = adminMemberships.map(m => m.userId)

      // Create workspace
      const workspace = await tx.projectWorkspace.create({
        data: { projectId: proj.id },
      })

      // Create 4 default channels
      const defaultChannels = [
        { name: 'general', displayName: 'General', description: 'Broad project discussion', isPinned: true },
        { name: 'site-updates', displayName: 'Site Updates', description: 'Field updates, photos, and site conditions', isPinned: false },
        { name: 'client', displayName: 'Client', description: 'Client-facing communications', isPinned: false },
        { name: 'admin', displayName: 'Admin', description: 'Platform administration', isPinned: false },
      ] as const

      for (const ch of defaultChannels) {
        const channel = await tx.channel.create({
          data: {
            workspaceId: workspace.id,
            name: ch.name,
            displayName: ch.displayName,
            description: ch.description,
            kind: 'DEFAULT',
            isPinned: ch.isPinned,
          },
        })

        // Add contractor members as OWNER to all default channels
        if (memberUserIds.length > 0) {
          await tx.channelMembership.createMany({
            data: memberUserIds.map(userId => ({
              channelId: channel.id,
              userId,
              role: 'OWNER' as const,
            })),
            skipDuplicates: true,
          })
        }

        // Add admin users as OBSERVER to #admin channel only
        if (ch.name === 'admin' && adminUserIds.length > 0) {
          await tx.channelMembership.createMany({
            data: adminUserIds
              .filter(uid => !memberUserIds.includes(uid)) // avoid duplicates
              .map(userId => ({
                channelId: channel.id,
                userId,
                role: 'OBSERVER' as const,
              })),
            skipDuplicates: true,
          })
        }
      }

      // Post system welcome message in #general
      const generalChannel = await tx.channel.findUnique({
        where: { workspaceId_name: { workspaceId: workspace.id, name: 'general' } },
      })
      if (generalChannel) {
        await tx.message.create({
          data: {
            channelId: generalChannel.id,
            authorUserId: currentUserId,
            body: 'Project workspace created. Add your team members and start collaborating.',
          },
        })

        // Update lastMessageAt on the channel
        await tx.channel.update({
          where: { id: generalChannel.id },
          data: { lastMessageAt: new Date() },
        })
      }

      // Create MILESTONE_THREAD channels for each milestone
      const projectMilestones = await tx.milestone.findMany({
        where: { projectId: proj.id },
        orderBy: { order: 'asc' },
      })

      for (const milestone of projectMilestones) {
        const slug = `${milestone.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${milestone.order}`
        const milestoneChannel = await tx.channel.create({
          data: {
            workspaceId: workspace.id,
            name: slug,
            displayName: milestone.name,
            description: `Thread for milestone: ${milestone.name}`,
            kind: 'MILESTONE_THREAD',
            milestoneId: milestone.id,
          },
        })

        // Add contractor members as OWNER to milestone threads
        if (memberUserIds.length > 0) {
          await tx.channelMembership.createMany({
            data: memberUserIds.map(userId => ({
              channelId: milestoneChannel.id,
              userId,
              role: 'OWNER' as const,
            })),
            skipDuplicates: true,
          })
        }

        // Add admin users as OBSERVER to milestone threads
        if (adminUserIds.length > 0) {
          await tx.channelMembership.createMany({
            data: adminUserIds
              .filter(uid => !memberUserIds.includes(uid))
              .map(userId => ({
                channelId: milestoneChannel.id,
                userId,
                role: 'OBSERVER' as const,
              })),
            skipDuplicates: true,
          })
        }
      }
      // ── End workspace auto-creation ──────────────────────────────────────────

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
