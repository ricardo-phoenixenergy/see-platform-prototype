'use client'

import { useState, useEffect, use } from 'react'
import { BidForm } from '@/components/marketplace/bid-form'
import Link from 'next/link'

type RfqData = {
  id: string
  title: string
  description: string
  scopeOfWork: string
  category: string
  budgetCentsMax: number | null
  status: string
  bids: Array<{ providerCompany: { id: string } }>
  project: { name: string; contractorCompany: { name: string } }
  milestone: { name: string } | null
}

export default function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ rfqId: string }>
}) {
  const { rfqId } = use(params)
  const [rfq, setRfq] = useState<RfqData | null>(null)
  const [companyId, setCompanyId] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/marketplace/rfq/${rfqId}`).then((r) => r.json()),
      fetch('/api/sp/profile').then((r) => r.json()),
    ]).then(([rfqData, profileData]: [{ rfq: RfqData }, { companyId: string }]) => {
      setRfq(rfqData.rfq)
      setCompanyId(profileData.companyId)
      setIsLoading(false)
    }).catch(() => setIsLoading(false))
  }, [rfqId])

  if (isLoading) {
    return <div className="p-6"><div className="h-48 rounded-md bg-ink-50 animate-pulse" /></div>
  }

  if (!rfq) {
    return <div className="p-6"><p className="text-sm text-ink-500">RFQ not found.</p></div>
  }

  const alreadyBid = rfq.bids.some((b) => b.providerCompany.id === companyId)

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-xs text-ink-400">
        <Link href="/service-provider/opportunities" className="hover:text-ink-700">Opportunities</Link>
        <span>/</span>
        <span className="text-ink-600 truncate">{rfq.title}</span>
      </div>

      <div className="rounded-md bg-ink-25 border border-ink-200 px-5 py-4 space-y-2">
        <h2 className="text-base font-semibold text-ink-900">{rfq.title}</h2>
        <p className="text-xs text-ink-500">
          {rfq.project.name} · {rfq.project.contractorCompany.name} · {rfq.bids.length} bid{rfq.bids.length !== 1 ? 's' : ''}
        </p>
        <p className="text-sm text-ink-700">{rfq.description}</p>
        <div className="pt-2">
          <p className="text-xs font-semibold text-ink-700 mb-1">Scope of work</p>
          <p className="text-xs text-ink-600 whitespace-pre-line">{rfq.scopeOfWork}</p>
        </div>
        {rfq.budgetCentsMax && (
          <p className="text-xs text-ink-500">
            Budget: up to <span className="font-medium text-ink-700">
              R {(rfq.budgetCentsMax / 100).toLocaleString('en-ZA')}
            </span>
          </p>
        )}
      </div>

      {(alreadyBid || submitted) ? (
        <div className="rounded-md bg-success-50/30 border border-success-500/20 px-4 py-3">
          <p className="text-sm font-medium text-success-700">Your bid has been submitted.</p>
          <p className="text-xs text-ink-500 mt-0.5">You will be notified when the contractor makes a decision.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-ink-900">Submit your bid</h3>
          <BidForm rfqId={rfqId} companyId={companyId} onSuccess={() => setSubmitted(true)} />
        </div>
      )}
    </div>
  )
}
