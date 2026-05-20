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

// Token earn rates — differentiated by review type, not milestone type
export const TOKEN_AI_REVIEW      = 100   // milestone accepted via AI verification
export const TOKEN_EXPERT_REVIEW  = 300   // milestone accepted via expert peer review (3×)
export const TOKEN_PROJECT_DONE   = 1_000 // project reaches OPERATIONAL stage

// Exchange rate: 10 tokens = R1 (i.e. 1 token = R0.10)
export const TOKENS_PER_RAND = 10

export const TIER_TOKEN_MULTIPLIERS: Record<Tier, number> = {
  BRONZE:   1,
  SILVER:   1.5,
  GOLD:     2,
  PLATINUM: 3,
}

export function tokensForMilestone(tier: Tier, isExpertReview: boolean): number {
  const base = isExpertReview ? TOKEN_EXPERT_REVIEW : TOKEN_AI_REVIEW
  return Math.round(base * TIER_TOKEN_MULTIPLIERS[tier])
}

export function tokensToRand(tokens: number): number {
  return tokens / TOKENS_PER_RAND
}

export function randToTokens(rand: number): number {
  return Math.floor(rand * TOKENS_PER_RAND)
}

// Net discount cap: tier discount + token discount must not exceed 10%.
// discountedTotalCents is the cart total AFTER tier discount is applied.
// Returns max tokens burnable without breaching the 10% cap.
export function maxTokenBurnForHardware(
  discountedTotalCents: number,
  tierDiscountPercent: number,
  tokenBalance: number
): number {
  if (tierDiscountPercent >= 10) return 0
  // remaining room = (10 - tierDiscount)% of the ORIGINAL price
  // originalCents = discountedCents / (1 - tierDiscount/100)
  const originalCents = discountedTotalCents / (1 - tierDiscountPercent / 100)
  const maxSavingsCents = Math.floor(originalCents * (10 - tierDiscountPercent) / 100)
  return Math.min(Math.floor(maxSavingsCents / TOKENS_PER_RAND), tokenBalance)
}

// For service payments (no tier discount already applied):
// cap is simply 10% of the bid amount.
export function maxTokenBurnForService(
  bidAmountCents: number,
  tokenBalance: number
): number {
  const maxSavingsCents = Math.floor(bidAmountCents * 10 / 100)
  return Math.min(Math.floor(maxSavingsCents / TOKENS_PER_RAND), tokenBalance)
}

// Keep legacy aliases so existing imports don't break
export const TOKEN_BASE_MILESTONE    = TOKEN_AI_REVIEW
export const TOKEN_BASE_HARD_GATE    = TOKEN_EXPERT_REVIEW
export const TOKEN_BASE_PROJECT_DONE = TOKEN_PROJECT_DONE

export function getNextTier(tier: Tier): Tier | null {
  const idx = TIER_ORDER.indexOf(tier)
  return idx < TIER_ORDER.length - 1 ? (TIER_ORDER[idx + 1] ?? null) : null
}

export function getCountToNextTier(tier: Tier, currentCount: number): number | null {
  const next = getNextTier(tier)
  if (!next) return null
  return Math.max(0, TIER_THRESHOLDS[next].projects - currentCount)
}
