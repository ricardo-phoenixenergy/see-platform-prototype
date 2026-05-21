// lib/service-commission.ts
// Pure commission calculator for the SEE platform service marketplace.
// All amounts are in cents (integer). No I/O — import anywhere safely.

import { getDiscountRate } from '@/lib/tier/rules'
import type { Tier } from '@/lib/tier/rules'

export const SEE_MARKUP_PERCENT = 10

export type CommissionBreakdown = {
  spAmountCents: number
  markedUpAmountCents: number
  contractorAmountCents: number
  spPayoutCents: number
  seePlatformFeeCents: number
  tierDiscountPercent: number
  spCommissionPercent: number
}

/**
 * Returns the commission percentage withheld from the SP payout.
 * High-rated SPs (>= 4.5) pay 3%; everyone else pays 5%.
 */
export function getSpCommissionPercent(rating: number | null): number {
  if (rating === null || rating < 4.5) return 5
  return 3
}

/**
 * Calculates the full commission breakdown for a marketplace service transaction.
 *
 * Flow:
 *  1. SP quotes spAmountCents (their take-home before commission).
 *  2. SEE marks up by SEE_MARKUP_PERCENT (10%) → markedUpAmountCents (what contractor sees).
 *  3. Contractor tier discount applied → contractorAmountCents (what contractor pays).
 *  4. SP payout = spAmountCents minus SP commission rate → spPayoutCents.
 *  5. SEE earns the spread: contractorAmountCents − spPayoutCents.
 */
export function calculateServiceCommission(
  spAmountCents: number,
  contractorTier: Tier,
  spRating: number | null,
): CommissionBreakdown {
  const tierDiscountPercent = getDiscountRate(contractorTier)
  const spCommissionPercent = getSpCommissionPercent(spRating)

  const markedUpAmountCents = Math.round(spAmountCents * (1 + SEE_MARKUP_PERCENT / 100))
  const contractorAmountCents = Math.round(markedUpAmountCents * (1 - tierDiscountPercent / 100))
  const spPayoutCents = Math.round(spAmountCents * (1 - spCommissionPercent / 100))
  const seePlatformFeeCents = contractorAmountCents - spPayoutCents

  return {
    spAmountCents,
    markedUpAmountCents,
    contractorAmountCents,
    spPayoutCents,
    seePlatformFeeCents,
    tierDiscountPercent,
    spCommissionPercent,
  }
}
