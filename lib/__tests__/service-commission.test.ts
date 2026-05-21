import { describe, it, expect } from 'vitest'
import {
  getSpCommissionPercent,
  calculateServiceCommission,
} from '../service-commission'

describe('getSpCommissionPercent', () => {
  it('returns 3 for rating >= 4.5', () => {
    expect(getSpCommissionPercent(4.5)).toBe(3)
    expect(getSpCommissionPercent(5.0)).toBe(3)
    expect(getSpCommissionPercent(4.9)).toBe(3)
  })

  it('returns 5 for rating < 4.5', () => {
    expect(getSpCommissionPercent(4.4)).toBe(5)
    expect(getSpCommissionPercent(3.0)).toBe(5)
    expect(getSpCommissionPercent(1.0)).toBe(5)
  })

  it('returns 5 for null rating', () => {
    expect(getSpCommissionPercent(null)).toBe(5)
  })
})

describe('calculateServiceCommission', () => {
  it('marks up SP amount by 10%', () => {
    const result = calculateServiceCommission(10_000_00, 'GOLD', 4.8)
    expect(result.markedUpAmountCents).toBe(11_000_00)
  })

  it('applies Gold 8% discount to marked-up price', () => {
    // markedUp = 1_100_000, 8% off = 1_012_000
    const result = calculateServiceCommission(10_000_00, 'GOLD', 4.8)
    expect(result.contractorAmountCents).toBe(1_012_000)
  })

  it('applies 3% SP commission for high-rated SP', () => {
    // SP gets 10_000_00 * 0.97 = 970_000
    const result = calculateServiceCommission(10_000_00, 'GOLD', 4.8)
    expect(result.spPayoutCents).toBe(970_000)
  })

  it('SEE earns the spread (contractorAmount - spPayout)', () => {
    const result = calculateServiceCommission(10_000_00, 'GOLD', 4.8)
    expect(result.seePlatformFeeCents).toBe(result.contractorAmountCents - result.spPayoutCents)
  })

  it('applies Platinum 10% discount', () => {
    const result = calculateServiceCommission(10_000_00, 'PLATINUM', 5.0)
    // markedUp = 1_100_000, 10% off = 990_000
    expect(result.contractorAmountCents).toBe(990_000)
  })

  it('applies Bronze 2% discount', () => {
    const result = calculateServiceCommission(10_000_00, 'BRONZE', 3.0)
    // markedUp = 1_100_000, 2% off = 1_078_000
    expect(result.contractorAmountCents).toBe(1_078_000)
  })

  it('applies Silver 5% discount', () => {
    const result = calculateServiceCommission(10_000_00, 'SILVER', 4.5)
    // markedUp = 1_100_000, 5% off = 1_045_000
    expect(result.contractorAmountCents).toBe(1_045_000)
  })

  it('applies 5% SP commission for low-rated SP', () => {
    // SP gets 10_000_00 * 0.95 = 950_000
    const result = calculateServiceCommission(10_000_00, 'GOLD', 4.0)
    expect(result.spPayoutCents).toBe(950_000)
  })

  it('returns all breakdown fields', () => {
    const result = calculateServiceCommission(10_000_00, 'GOLD', 4.8)
    expect(result).toMatchObject({
      spAmountCents: 10_000_00,
      markedUpAmountCents: expect.any(Number),
      contractorAmountCents: expect.any(Number),
      spPayoutCents: expect.any(Number),
      seePlatformFeeCents: expect.any(Number),
      tierDiscountPercent: expect.any(Number),
      spCommissionPercent: expect.any(Number),
    })
  })
})
