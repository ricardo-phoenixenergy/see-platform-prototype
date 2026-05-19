// lib/ai/tools.ts

import { db } from '@/lib/db'

export const AI_TOOL_DEFINITIONS = [
  {
    name: 'get_project_details',
    description: "Get detailed information about one of the user's projects by ID or partial name.",
    input_schema: {
      type: 'object' as const,
      properties: {
        identifier: { type: 'string', description: 'Project ID or partial name match' },
      },
      required: ['identifier'],
    },
  },
  {
    name: 'list_projects_at_risk',
    description: "List the user's projects that have overdue milestones, rejected submissions, or are stalled.",
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'summarise_milestone_status',
    description: 'Summarise milestone completion status across all active projects.',
    input_schema: {
      type: 'object' as const,
      properties: {
        stageFilter: {
          type: 'string',
          enum: ['DEVELOPMENT', 'FINANCING', 'CONSTRUCTION', 'COMMISSIONING', 'OPERATIONAL'],
          description: 'Optional: filter to projects in a specific stage',
        },
      },
    },
  },
  {
    name: 'recommend_service_provider',
    description: 'Recommend Service Providers from the marketplace for a given category.',
    input_schema: {
      type: 'object' as const,
      properties: {
        category: {
          type: 'string',
          enum: ['STRUCTURAL_CIVILS', 'ENGINEERING', 'LEGAL', 'LOGISTICS_PLANT_HIRE', 'FINANCE_INSURANCE'],
        },
        province: { type: 'string', description: 'South African province (optional)' },
      },
      required: ['category'],
    },
  },
  {
    name: 'generate_company_profile_draft',
    description: "Generate a draft portfolio overview for the user's company, suitable for sending to a prospective client.",
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'list_license_upsell_opportunities',
    description: 'List operational sites where the contractor could sell or upgrade O&M licenses to their clients, with estimated monthly commission.',
    input_schema: { type: 'object' as const, properties: {} },
  },
]

type ToolInput = Record<string, unknown>

export async function executeToolCall(
  toolName: string,
  input: ToolInput,
  companyId: string
): Promise<string> {
  switch (toolName) {
    case 'get_project_details': {
      const id = String(input['identifier'] ?? '')
      const project = await db.project.findFirst({
        where: {
          contractorCompanyId: companyId,
          OR: [{ id }, { name: { contains: id, mode: 'insensitive' } }],
        },
        include: {
          site: { select: { city: true, province: true } },
          milestones: { select: { name: true, status: true, phase: true }, orderBy: { order: 'asc' } },
          clientCompany: { select: { name: true } },
        },
      })
      if (!project) return `No project found matching "${id}".`
      const mileSummary = project.milestones
        .map((m) => `  - ${m.name} (${m.phase}): ${m.status}`)
        .join('\n')
      return `**${project.name}**\nClient: ${project.clientCompany?.name ?? 'None'}\nStage: ${project.stage}\nLocation: ${project.site.city}, ${project.site.province}\nSize: ${project.systemSizeKw} kW\n\nMilestones:\n${mileSummary}`
    }

    case 'list_projects_at_risk': {
      const projects = await db.project.findMany({
        where: { contractorCompanyId: companyId, deletedAt: null },
        include: {
          milestones: {
            where: {
              OR: [
                { status: 'SUBMITTED' },
                { status: 'ACTION_REQUIRED' },
                { AND: [{ dueDate: { lt: new Date() } }, { status: { notIn: ['APPROVED', 'AUTO_GOLD', 'LOCKED'] } }] },
              ],
            },
            select: { name: true, status: true, dueDate: true },
          },
        },
      })
      const atRisk = projects.filter((p) => p.milestones.length > 0)
      if (atRisk.length === 0) return 'No projects currently at risk.'
      return atRisk
        .map(
          (p) =>
            `**${p.name}** (${p.stage}):\n${p.milestones
              .map(
                (m) =>
                  `  - ${m.name}: ${m.status}${m.dueDate && m.dueDate < new Date() ? ' (overdue)' : ''}`
              )
              .join('\n')}`
        )
        .join('\n\n')
    }

    case 'summarise_milestone_status': {
      const stage = input['stageFilter'] as string | undefined
      const projects = await db.project.findMany({
        where: {
          contractorCompanyId: companyId,
          deletedAt: null,
          ...(stage ? { stage: stage as never } : {}),
        },
        include: { milestones: { select: { status: true } } },
      })
      const counts: Record<string, number> = {}
      let total = 0
      for (const p of projects) {
        for (const m of p.milestones) {
          counts[m.status] = (counts[m.status] ?? 0) + 1
          total++
        }
      }
      if (total === 0) return 'No milestones found.'
      const summary = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .map(([status, count]) => `  - ${status}: ${count}`)
        .join('\n')
      return `**Milestone summary** (${projects.length} project${projects.length !== 1 ? 's' : ''}, ${total} milestones):\n${summary}`
    }

    case 'recommend_service_provider': {
      const category = String(input['category'] ?? '')
      const province = input['province'] as string | undefined
      const providers = await db.serviceProviderProfile.findMany({
        where: {
          categories: { has: category as never },
          ...(province ? { serviceAreas: { has: province } } : {}),
        },
        include: { company: { select: { name: true, email: true } } },
        orderBy: { rating: 'desc' },
        take: 3,
      })
      if (providers.length === 0)
        return `No ${category} providers found${province ? ` in ${province}` : ''}.`
      return providers
        .map(
          (p) =>
            `**${p.company.name}**\n${p.headline}\nRating: ${p.rating?.toFixed(1) ?? 'N/A'} (${p.ratingCount} reviews)\nAreas: ${p.serviceAreas.join(', ')}\nContact: ${p.company.email ?? 'N/A'}`
        )
        .join('\n\n')
    }

    case 'generate_company_profile_draft': {
      const company = await db.company.findUnique({
        where: { id: companyId },
        include: {
          tierStatus: { select: { tier: true, compliantProjectCount: true } },
          projects: { where: { deletedAt: null }, select: { stage: true, systemSizeKw: true } },
        },
      })
      if (!company) return 'Company data not found.'
      const operationalKw = company.projects
        .filter((p) => p.stage === 'OPERATIONAL')
        .reduce((s, p) => s + p.systemSizeKw, 0)
      return `Here is a draft company profile for **${company.name}**:\n\n---\n\n${company.about ?? company.name + ' is a renewable energy EPC.'}\n\nWe hold **${company.tierStatus?.tier ?? 'Bronze'} tier** accreditation on the SEE platform, with ${company.tierStatus?.compliantProjectCount ?? 0} verified compliant projects. Our installed portfolio includes ${company.projects.length} projects totalling ${Math.round(operationalKw).toLocaleString()} kW of operational capacity.\n\n*[Customise with specific project names, client references, and technical specialisations before sending.]*`
    }

    case 'list_license_upsell_opportunities': {
      const projects = await db.project.findMany({
        where: { contractorCompanyId: companyId, stage: 'OPERATIONAL', deletedAt: null },
        include: {
          clientCompany: { select: { name: true } },
          omLicenses: {
            where: { viewerType: 'CLIENT', status: 'ACTIVE' },
            select: { tier: true, monthlyFeeCents: true },
            take: 1,
          },
        },
      })
      const opportunities = projects.filter((p) => p.clientCompanyId && p.omLicenses.length === 0)
      if (opportunities.length === 0)
        return 'All operational sites with clients already have active licenses.'
      return (
        `**Upsell opportunities** (${opportunities.length} site${opportunities.length !== 1 ? 's' : ''} without a client license):\n\n` +
        opportunities
          .map(
            (p) =>
              `- **${p.name}** — client: ${p.clientCompany?.name ?? 'none'}\n  Estimated AI tier commission: R ${Math.round((180_000 * 0.2) / 100).toLocaleString()}/month`
          )
          .join('\n')
      )
    }

    default:
      return `Unknown tool: ${toolName}`
  }
}
