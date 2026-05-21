// lib/tier/rules.ts
// Canonical tier thresholds, rates, and calculation functions.
// Single source of truth — import from here, never hardcode elsewhere.

export type Tier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'

// Both conditions must be met to unlock a tier
export const TIER_THRESHOLDS: Record<Tier, { projects: number; kw: number }> = {
  BRONZE:   { projects: 0,  kw: 0      },
  SILVER:   { projects: 5,  kw: 1_000  },
  GOLD:     { projects: 25, kw: 5_000  },
  PLATINUM: { projects: 40, kw: 10_000 },
}

// Marketplace discount (previously called cashback)
export const TIER_DISCOUNT_RATES: Record<Tier, number> = {
  BRONZE:   2,
  SILVER:   5,
  GOLD:     8,
  PLATINUM: 10,
}

// Commission earned on O&M license sales
export const TIER_COMMISSION_RATES: Record<Tier, number> = {
  BRONZE:   10,
  SILVER:   20,
  GOLD:     30,
  PLATINUM: 40,
}

// Keep for backwards-compat with any components that import it
export const TIER_CASHBACK_RATES = TIER_DISCOUNT_RATES

export const TIER_ORDER: Tier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']

export function getTierForMetrics(projectCount: number, totalKw: number): Tier {
  if (
    projectCount >= TIER_THRESHOLDS.PLATINUM.projects &&
    totalKw    >= TIER_THRESHOLDS.PLATINUM.kw
  ) return 'PLATINUM'
  if (
    projectCount >= TIER_THRESHOLDS.GOLD.projects &&
    totalKw    >= TIER_THRESHOLDS.GOLD.kw
  ) return 'GOLD'
  if (
    projectCount >= TIER_THRESHOLDS.SILVER.projects &&
    totalKw    >= TIER_THRESHOLDS.SILVER.kw
  ) return 'SILVER'
  return 'BRONZE'
}

// Legacy single-metric version kept for callers that haven't migrated yet
export function getTierForCount(compliantProjectCount: number): Tier {
  if (compliantProjectCount >= TIER_THRESHOLDS.PLATINUM.projects) return 'PLATINUM'
  if (compliantProjectCount >= TIER_THRESHOLDS.GOLD.projects) return 'GOLD'
  if (compliantProjectCount >= TIER_THRESHOLDS.SILVER.projects) return 'SILVER'
  return 'BRONZE'
}

export function getDiscountRate(tier: Tier): number {
  return TIER_DISCOUNT_RATES[tier]
}

export function getCommissionRate(tier: Tier): number {
  return TIER_COMMISSION_RATES[tier]
}

// Keep for backwards-compat
export function getCashbackRate(tier: Tier): number {
  return TIER_DISCOUNT_RATES[tier]
}

export function getNextTier(tier: Tier): Tier | null {
  const idx = TIER_ORDER.indexOf(tier)
  return idx < TIER_ORDER.length - 1 ? (TIER_ORDER[idx + 1] ?? null) : null
}

export function getCountToNextTier(tier: Tier, currentCount: number): number | null {
  const next = getNextTier(tier)
  if (!next) return null
  return Math.max(0, TIER_THRESHOLDS[next].projects - currentCount)
}
