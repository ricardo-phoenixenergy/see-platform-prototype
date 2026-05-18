import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the db module — milestone-templates.ts queries the DB
vi.mock('@/lib/db', () => ({
  db: {
    milestoneTemplate: {
      findMany: vi.fn(),
    },
  },
}))

import { selectMilestoneTemplate } from '@/lib/milestone-templates'
import { db } from '@/lib/db'

const MOCK_PPA_TEMPLATE = {
  id: 'template-solar-ci-ppa',
  name: 'Solar C&I <1MW PPA',
  technology: 'SOLAR_PV',
  dealStructure: ['PPA'],
  minSizeKw: 50,
  maxSizeKw: 1000,
  version: 1,
  isActive: true,
  items: [
    { id: 'item-1', order: 1, phase: 'DEVELOPMENT', name: 'Site Assessment', description: 'Site assessment', isHardGate: true, estimatedDays: 14, requiredArtefacts: [], templateId: 'template-solar-ci-ppa' },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
}

const MOCK_OUTRIGHT_TEMPLATE = {
  id: 'template-solar-ci-outright',
  name: 'Solar C&I <1MW Outright',
  technology: 'SOLAR_PV',
  dealStructure: ['OUTRIGHT', 'LEASE'],
  minSizeKw: 50,
  maxSizeKw: 1000,
  version: 1,
  isActive: true,
  items: [],
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('selectMilestoneTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('selects PPA template for solar PPA project', async () => {
    vi.mocked(db.milestoneTemplate.findMany).mockResolvedValue([MOCK_PPA_TEMPLATE] as never)
    const result = await selectMilestoneTemplate('SOLAR_PV', 450, 'PPA')
    expect(result.id).toBe('template-solar-ci-ppa')
  })

  it('selects Outright template for outright deal', async () => {
    vi.mocked(db.milestoneTemplate.findMany).mockResolvedValue([MOCK_OUTRIGHT_TEMPLATE] as never)
    const result = await selectMilestoneTemplate('SOLAR_PV', 200, 'OUTRIGHT')
    expect(result.id).toBe('template-solar-ci-outright')
  })

  it('throws when no matching template found', async () => {
    vi.mocked(db.milestoneTemplate.findMany).mockResolvedValue([])
    await expect(selectMilestoneTemplate('WIND', 5000, 'PPA')).rejects.toThrow('No milestone template found')
  })

  it('returns the template with most items (highest specificity) when multiple match', async () => {
    const generic = { ...MOCK_PPA_TEMPLATE, id: 'generic', items: [] }
    const specific = { ...MOCK_PPA_TEMPLATE, id: 'specific', items: [MOCK_PPA_TEMPLATE.items[0]!] }
    vi.mocked(db.milestoneTemplate.findMany).mockResolvedValue([generic, specific] as never)
    const result = await selectMilestoneTemplate('SOLAR_PV', 450, 'PPA')
    expect(result.id).toBe('specific')
  })
})
