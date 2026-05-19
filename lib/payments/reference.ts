// lib/payments/reference.ts

export function generatePaymentReference(): string {
  const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const random = Array.from(
    { length: 6 },
    () => CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join('')
  const year = new Date().getFullYear()
  return `SEE-${random}-${year}`
}
