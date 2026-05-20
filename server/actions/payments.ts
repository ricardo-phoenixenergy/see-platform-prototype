'use server'
// server/actions/payments.ts

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { createOmLicenseInvoice } from '@/lib/payments/invoice'
import type { OmLicenseTier } from '@/lib/generated/prisma/client'

export async function sellLicenseToClient(
  projectId: string,
  tier: OmLicenseTier,
  monthlyFeeCents: number,
  message?: string
) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { contractorCompanyId: true, clientCompanyId: true },
  })
  if (!project || project.contractorCompanyId !== session.user.companyId) {
    throw new Error('Not authorized for this project')
  }
  if (!project.clientCompanyId) throw new Error('Project has no client company')

  const license = await db.omLicense.create({
    data: {
      projectId,
      licenseeCompanyId: project.clientCompanyId,
      viewerType: 'CLIENT',
      tier,
      status: 'PENDING_PAYMENT',
      monthlyFeeCents,
      resellerCompanyId: session.user.companyId,
      commissionRate: 0.20,
    },
  })

  await db.licenseOffer.create({
    data: {
      licenseId: license.id,
      proposedByCompanyId: session.user.companyId,
      proposedToCompanyId: project.clientCompanyId,
      tier,
      monthlyFeeCents,
      commissionRateOffered: 0.20,
      message: message ?? null,
      status: 'PENDING',
    },
  })

  revalidatePath(`/contractor/projects/${projectId}/monitoring`)
}

export async function selfActivateLicense(projectId: string, tier: OmLicenseTier) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { contractorCompanyId: true },
  })
  if (!project || project.contractorCompanyId !== session.user.companyId) {
    throw new Error('Not authorized for this project')
  }

  const monthlyFeeCents = tier === 'BASIC' ? 35_000 : tier === 'PREMIUM' ? 85_000 : 120_000

  const license = await db.omLicense.create({
    data: {
      projectId,
      licenseeCompanyId: session.user.companyId,
      viewerType: 'EPC',
      tier,
      status: 'PENDING_PAYMENT',
      monthlyFeeCents,
    },
  })

  const { payment } = await createOmLicenseInvoice({
    licenseId: license.id,
    recipientCompanyId: session.user.companyId,
    tier,
    monthlyFeeCents,
  })

  revalidatePath(`/contractor/projects/${projectId}/monitoring`)
  return { paymentId: payment.id, reference: payment.reference!, amountCents: payment.amountCents }
}

export async function acceptLicenseOffer(offerId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const offer = await db.licenseOffer.findUnique({
    where: { id: offerId },
    include: { license: { select: { id: true, tier: true, monthlyFeeCents: true, projectId: true } } },
  })
  if (!offer || offer.proposedToCompanyId !== session.user.companyId) {
    throw new Error('Offer not found or not authorized')
  }
  if (offer.status !== 'PENDING') throw new Error('Offer is no longer pending')

  await db.licenseOffer.update({
    where: { id: offerId },
    data: { status: 'ACCEPTED', respondedAt: new Date() },
  })

  const { payment } = await createOmLicenseInvoice({
    licenseId: offer.license.id,
    recipientCompanyId: session.user.companyId,
    tier: offer.license.tier,
    monthlyFeeCents: offer.license.monthlyFeeCents,
  })

  revalidatePath(`/client/plant/${offer.license.projectId}`)
  return { paymentId: payment.id, reference: payment.reference!, amountCents: payment.amountCents }
}

export async function uploadProofOfPayment(paymentId: string, proofUrl: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  await db.payment.update({
    where: { id: paymentId },
    data: { proofOfPaymentUrl: proofUrl, status: 'AWAITING_RECONCILIATION' },
  })

  revalidatePath('/admin/financial')
}

export async function reconcilePayment(paymentId: string, bankReference?: string) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') throw new Error('Admin only')

  // session.user.id is string | undefined in Auth.js v5's DefaultSession.
  // We already verified session is not null above; id will always be set for
  // authenticated users. Narrow here rather than propagating the undefined.
  const adminUserId = session.user.id ?? null

  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: {
      invoice: {
        include: {
          lineItems: true,
          recipientCompany: { select: { id: true } },
        },
      },
    },
  })
  if (!payment) throw new Error('Payment not found')

  const licenseLineItem = payment.invoice.lineItems.find(
    (li) => li.type === 'OM_LICENSE_ACTIVATION' && li.relatedEntityId
  )
  const escrowLineItem = payment.invoice.lineItems.find(
    (li) => li.type === 'SERVICE_ESCROW' && li.relatedEntityId
  )

  await db.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        reconciledAt: new Date(),
        reconciledByUserId: adminUserId,
        bankReference: bankReference ?? null,
      },
    })

    await tx.invoice.update({
      where: { id: payment.invoiceId },
      data: { status: 'PAID', paidAt: new Date() },
    })

    if (licenseLineItem?.relatedEntityId) {
      const licenseId = licenseLineItem.relatedEntityId
      const nextBillingAt = new Date()
      nextBillingAt.setDate(nextBillingAt.getDate() + 30)

      const activatedLicense = await tx.omLicense.update({
        where: { id: licenseId },
        data: { status: 'ACTIVE', activatedAt: new Date(), nextBillingAt },
        select: {
          resellerCompanyId: true,
          commissionRate: true,
          monthlyFeeCents: true,
          viewerType: true,
          projectId: true,
          tier: true,
        },
      })

      if (activatedLicense.viewerType === 'CLIENT' && activatedLicense.resellerCompanyId) {
        const existingEpc = await tx.omLicense.findFirst({
          where: {
            projectId: activatedLicense.projectId,
            viewerType: 'EPC',
            licenseeCompanyId: activatedLicense.resellerCompanyId,
          },
        })
        if (!existingEpc) {
          await tx.omLicense.create({
            data: {
              projectId: activatedLicense.projectId,
              licenseeCompanyId: activatedLicense.resellerCompanyId,
              viewerType: 'EPC',
              tier: activatedLicense.tier,
              status: 'ACTIVE',
              monthlyFeeCents: 0,
              activatedAt: new Date(),
              nextBillingAt,
            },
          })
        }

        if (activatedLicense.commissionRate && activatedLicense.monthlyFeeCents) {
          const commissionCents = Math.round(
            activatedLicense.monthlyFeeCents * activatedLicense.commissionRate
          )
          const period = new Date()
          period.setDate(1)
          period.setHours(0, 0, 0, 0)

          await tx.licenseCommission.create({
            data: {
              licenseId,
              resellerCompanyId: activatedLicense.resellerCompanyId,
              period,
              amountCents: commissionCents,
              status: 'ACCRUED',
            },
          })
        }
      }
    }

    // Activate service escrow job card if this is an escrow payment
    if (escrowLineItem?.relatedEntityId) {
      await tx.jobCard.update({
        where: { id: escrowLineItem.relatedEntityId },
        data: { escrowStatus: 'LOCKED' },
      })
    }
  })

  revalidatePath('/admin/financial')
  revalidatePath('/contractor/wallet')
  revalidatePath('/contractor/service-center')
  revalidatePath('/client')
}

export async function addProjectToEnterpriseScope(licenseId: string, projectId: string) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') throw new Error('Admin only')

  await db.enterpriseProjectScope.create({
    data: { licenseId, projectId },
  })

  revalidatePath('/admin/enterprise')
  revalidatePath('/client/enterprise/operations')
}
