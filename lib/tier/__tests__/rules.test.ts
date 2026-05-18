import { describe, it, expect } from 'vitest'
import { getTierForCount, getCashbackRate, getCountToNextTier } from '../rules'

describe('getTierForCount', () => {
  it('returns BRONZE for 0 projects', () => {
    expect(getTierForCount(0)).toBe('BRONZE')
  })
  it('returns BRONZE for 2 projects', () => {
    expect(getTierForCount(2)).toBe('BRONZE')
  })
  it('returns SILVER at threshold (3)', () => {
    expect(getTierForCount(3)).toBe('SILVER')
  })
  it('returns SILVER for 5 projects', () => {
    expect(getTierForCount(5)).toBe('SILVER')
  })
  it('returns GOLD at threshold (8)', () => {
    expect(getTierForCount(8)).toBe('GOLD')
  })
  it('returns PLATINUM at threshold (15)', () => {
    expect(getTierForCount(15)).toBe('PLATINUM')
  })
  it('returns PLATINUM for any count above 15', () => {
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
  it('returns 12% for PLATINUM', () => {
    expect(getCashbackRate('PLATINUM')).toBe(12)
  })
})

describe('getCountToNextTier', () => {
  it('returns 3 for BRONZE at 0 projects', () => {
    expect(getCountToNextTier('BRONZE', 0)).toBe(3)
  })
  it('returns 1 for BRONZE at 2 projects', () => {
    expect(getCountToNextTier('BRONZE', 2)).toBe(1)
  })
  it('returns 5 for SILVER at 3 projects (GOLD at 8)', () => {
    expect(getCountToNextTier('SILVER', 3)).toBe(5)
  })
  it('returns null for PLATINUM (no next tier)', () => {
    expect(getCountToNextTier('PLATINUM', 15)).toBeNull()
  })
})
