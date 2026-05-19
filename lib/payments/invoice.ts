// lib/payments/invoice.ts

import { db } from '@/lib/db'
import { generatePaymentReference } from './reference'
import type { OmLicenseTier } from '@/lib/generated/prisma/client'

const VAT_RATE = 0.15

function nextInvoiceNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 90000) + 10000
  return `SEE-INV-${year}-${random}`
}

export async function createOmLicenseInvoice({
  licenseId,
  recipientCompanyId,
  tier,
  monthlyFeeCents,
}: {
  licenseId: string
  recipientCompanyId: string
  tier: OmLicenseTier
  monthlyFeeCents: number
}) {
  const subtotalCents = monthlyFeeCents
  const vatCents = Math.round(subtotalCents * VAT_RATE)
  const totalCents = subtotalCents + vatCents
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 7)

  const invoice = await db.invoice.create({
    data: {
      invoiceNumber: nextInvoiceNumber(),
      issuerType: 'PLATFORM',
      issuerCompanyId: null,
      recipientCompanyId,
      status: 'AWAITING_PAYMENT',
      subtotalCents,
      vatRate: VAT_RATE,
      vatCents,
      totalCents,
      dueDate,
      notes: `O&M ${tier} License activation (first month)`,
      lineItems: {
        create: [{
          description: `O&M ${tier} License — activation (first month)`,
          quantity: 1,
          unitPriceCents: monthlyFeeCents,
          totalCents: monthlyFeeCents,
          type: 'OM_LICENSE_ACTIVATION' as const,
          relatedEntityId: licenseId,
        }],
      },
      payments: {
        create: [{
          rail: 'EFT' as const,
          amountCents: totalCents,
          status: 'AWAITING_PROOF' as const,
          reference: generatePaymentReference(),
          expiresAt: (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d })(),
        }],
      },
    },
    include: { payments: true },
  })

  const payment = invoice.payments[0]
  if (!payment) throw new Error('Payment not created')
  return { invoice, payment }
}
