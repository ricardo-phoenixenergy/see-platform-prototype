import { describe, it, expect } from 'vitest'
import { isTOUTariff, guidanceForSupplier, ESKOM_TARIFFS, MUNICIPAL_TARIFFS } from '../site-info'

describe('isTOUTariff', () => {
  it('returns true for Megaflex', () => {
    expect(isTOUTariff('ESKOM', 'MEGAFLEX')).toBe(true)
  })

  it('returns false for Businessrate', () => {
    expect(isTOUTariff('ESKOM', 'BUSINESSRATE')).toBe(false)
  })

  it('returns true for LPU TOU', () => {
    expect(isTOUTariff('MUNICIPAL', 'LPU_TOU')).toBe(true)
  })

  it('returns false for SPU', () => {
    expect(isTOUTariff('MUNICIPAL', 'SPU')).toBe(false)
  })

  it('returns false for unknown tariff', () => {
    expect(isTOUTariff('ESKOM', 'UNKNOWN')).toBe(false)
  })
})

describe('guidanceForSupplier', () => {
  it('returns Eskom guidance for ESKOM', () => {
    const g = guidanceForSupplier('ESKOM')
    expect(g).toContain('Eskom')
  })

  it('returns municipal guidance for MUNICIPAL', () => {
    const g = guidanceForSupplier('MUNICIPAL')
    expect(g).toContain('municipal')
  })
})

describe('tariff lists', () => {
  it('all Eskom tariffs have a value and label', () => {
    ESKOM_TARIFFS.forEach(t => {
      expect(t.value).toBeTruthy()
      expect(t.label).toBeTruthy()
      expect(typeof t.isTOU).toBe('boolean')
    })
  })

  it('all municipal tariffs have a value and label', () => {
    MUNICIPAL_TARIFFS.forEach(t => {
      expect(t.value).toBeTruthy()
      expect(t.label).toBeTruthy()
      expect(typeof t.isTOU).toBe('boolean')
    })
  })
})
