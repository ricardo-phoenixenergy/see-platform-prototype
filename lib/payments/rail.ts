// lib/payments/rail.ts

export type PaymentPurpose =
  | 'OM_LICENSE'
  | 'HARDWARE'
  | 'ESCROW'
  | 'SUBSCRIPTION'

export type PaymentRail = 'EFT' | 'PAYFAST'

export function suggestPaymentRail(amountCents: number, purpose: PaymentPurpose): PaymentRail {
  if (purpose === 'SUBSCRIPTION') return 'PAYFAST'
  if (amountCents < 1_000_000) return 'PAYFAST'
  return 'EFT'
}

export function formatZAR(cents: number): string {
  return `R ${(cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
