// lib/tier/rules.ts
// Canonical tier thresholds and calculation functions.
// Single source of truth — import from here, never hardcode thresholds elsewhere.

export type Tier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'

export const TIER_THRESHOLDS: Record<Tier, number> = {
  BRONZE: 0,
  SILVER: 3,
  GOLD: 8,
  PLATINUM: 15,
}

export const TIER_CASHBACK_RATES: Record<Tier, number> = {
  BRONZE: 2,
  SILVER: 5,
  GOLD: 8,
  PLATINUM: 12,
}

export const TIER_ORDER: Tier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']

export function getTierForCount(compliantProjectCount: number): Tier {
  if (compliantProjectCount >= TIER_THRESHOLDS.PLATINUM) return 'PLATINUM'
  if (compliantProjectCount >= TIER_THRESHOLDS.GOLD) return 'GOLD'
  if (compliantProjectCount >= TIER_THRESHOLDS.SILVER) return 'SILVER'
  return 'BRONZE'
}

export function getCashbackRate(tier: Tier): number {
  return TIER_CASHBACK_RATES[tier]
}

export function getNextTier(tier: Tier): Tier | null {
  const idx = TIER_ORDER.indexOf(tier)
  return idx < TIER_ORDER.length - 1 ? (TIER_ORDER[idx + 1] ?? null) : null
}

export function getCountToNextTier(tier: Tier, currentCount: number): number | null {
  const next = getNextTier(tier)
  if (!next) return null
  return Math.max(0, TIER_THRESHOLDS[next] - currentCount)
}
