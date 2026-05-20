import { describe, it, expect } from 'vitest'
import { deriveTechnology } from '../tech-scope'
import type { TechScope } from '../tech-scope'

const base: TechScope = {
  hasPv: false, hasBess: false, hasWind: false, hasWheeling: false,
  designObjectives: ['SELF_CONSUMPTION'],
  exportToGrid: false,
}

describe('deriveTechnology', () => {
  it('returns SOLAR_PV when only PV is selected', () => {
    expect(deriveTechnology({ ...base, hasPv: true })).toBe('SOLAR_PV')
  })

  it('returns BESS when only BESS is selected', () => {
    expect(deriveTechnology({ ...base, hasBess: true })).toBe('BESS')
  })

  it('returns WIND when only wind is selected', () => {
    expect(deriveTechnology({ ...base, hasWind: true })).toBe('WIND')
  })

  it('returns HYBRID for PV+BESS', () => {
    expect(deriveTechnology({ ...base, hasPv: true, hasBess: true })).toBe('HYBRID')
  })

  it('returns HYBRID for PV+BESS+Wind', () => {
    expect(deriveTechnology({ ...base, hasPv: true, hasBess: true, hasWind: true })).toBe('HYBRID')
  })

  it('returns SOLAR_PV for PV+Wheeling (wheeling does not change primary tech)', () => {
    expect(deriveTechnology({ ...base, hasPv: true, hasWheeling: true })).toBe('SOLAR_PV')
  })

  it('throws when no technology flags are set', () => {
    expect(() => deriveTechnology(base)).toThrow('TechScope must have at least one technology flag set')
  })

  it('returns HYBRID for wheeling-only (no generation tech)', () => {
    expect(deriveTechnology({ ...base, hasWheeling: true })).toBe('HYBRID')
  })
})
