'use client'

import { overrideTier } from '@/server/actions/admin'
import { useRef } from 'react'

type Props = { companyId: string; currentTier: string }

export function TierOverrideSelect({ companyId, currentTier }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  return (
    <form ref={formRef} action={overrideTier}>
      <input type="hidden" name="companyId" value={companyId} />
      <select
        name="tier"
        defaultValue={currentTier}
        onChange={() => formRef.current?.requestSubmit()}
        className="text-xs border border-ink-200 rounded px-1.5 py-0.5 text-ink-700 bg-white cursor-pointer"
      >
        <option value="BRONZE">Bronze</option>
        <option value="SILVER">Silver</option>
        <option value="GOLD">Gold</option>
        <option value="PLATINUM">Platinum</option>
      </select>
    </form>
  )
}
