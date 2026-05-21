import { describe, it, expect } from 'vitest'
import { getTierForCount, getCashbackRate, getCountToNextTier } from '../rules'

// Current thresholds: SILVER=5, GOLD=25, PLATINUM=40 (project count only)

describe('getTierForCount', () => {
  it('returns BRONZE for 0 projects', () => {
    expect(getTierForCount(0)).toBe('BRONZE')
  })
  it('returns BRONZE for 4 projects', () => {
    expect(getTierForCount(4)).toBe('BRONZE')
  })
  it('returns SILVER at threshold (5)', () => {
    expect(getTierForCount(5)).toBe('SILVER')
  })
  it('returns SILVER for 10 projects', () => {
    expect(getTierForCount(10)).toBe('SILVER')
  })
  it('returns GOLD at threshold (25)', () => {
    expect(getTierForCount(25)).toBe('GOLD')
  })
  it('returns PLATINUM at threshold (40)', () => {
    expect(getTierForCount(40)).toBe('PLATINUM')
  })
  it('returns PLATINUM for any count above 40', () => {
    expect(getTierForCount(100)).toBe('PLATINUM')
  })
})

describe('getCashbackRate', () => {
  it('returns 2% for BRONZE', () => {
    expect(getCashbackRate('BRONZE')).toBe(2)
  })
  it('returns 5% for SILVER', () => {
    expect(getCashbackRate('SILVER')).toBe(5)
  })
  it('returns 8% for GOLD', () => {
    expect(getCashbackRate('GOLD')).toBe(8)
  })
  it('returns 10% for PLATINUM', () => {
    expect(getCashbackRate('PLATINUM')).toBe(10)
  })
})

describe('getCountToNextTier', () => {
  it('returns 5 for BRONZE at 0 projects', () => {
    expect(getCountToNextTier('BRONZE', 0)).toBe(5)
  })
  it('returns 1 for BRONZE at 4 projects', () => {
    expect(getCountToNextTier('BRONZE', 4)).toBe(1)
  })
  it('returns 15 for SILVER at 10 projects (GOLD at 25)', () => {
    expect(getCountToNextTier('SILVER', 10)).toBe(15)
  })
  it('returns null for PLATINUM (no next tier)', () => {
    expect(getCountToNextTier('PLATINUM', 40)).toBeNull()
  })
})
