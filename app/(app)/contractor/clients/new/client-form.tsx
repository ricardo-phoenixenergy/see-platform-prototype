'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/server/actions/clients'

const schema = z.object({
  name: z.string().min(2, 'Client name required'),
  contactName: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  industry: z.string().optional(),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const INDUSTRIES = [
  'Agriculture', 'Commercial Real Estate', 'Education', 'Healthcare',
  'Hospitality', 'Industrial / Manufacturing', 'Mining', 'Municipality',
  'Religious', 'Residential Estate', 'Retail', 'Telecommunications', 'Other',
]

export function ClientForm() {
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
  })

  async function onSubmit(data: FormData) {
    setError(null)
    try {
      const id = await createClient(data)
      router.push(`/contractor/clients/${id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create client')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])} className="space-y-5">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Company</p>
        <Input
          label="Client / company name"
          placeholder="e.g. Spaza Holdings (Pty) Ltd"
          {...(errors.name?.message ? { error: errors.name.message } : {})}
          {...register('name')}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-900">Industry</label>
          <select
            {...register('industry')}
            className="h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:shadow-ring"
          >
            <option value="">Select industry (optional)</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-4 pt-2 border-t border-ink-100">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Primary contact</p>
        <Input label="Contact name" placeholder="e.g. Sipho Dlamini" {...register('contactName')} />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="sipho@spazaholdings.co.za"
            {...(errors.contactEmail?.message ? { error: errors.contactEmail.message } : {})}
            {...register('contactEmail')}
          />
          <Input label="Phone" type="tel" placeholder="+27 11 000 0000" {...register('contactPhone')} />
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-ink-100">
        <label className="text-sm font-medium text-ink-900">Notes <span className="text-ink-400 font-normal">(optional)</span></label>
        <textarea
          {...register('notes')}
          rows={3}
          placeholder="Any useful context about this client…"
          className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-accent-500 focus:outline-none focus:shadow-ring resize-none"
        />
      </div>

      {error && <p className="text-sm text-danger-500">{error}</p>}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" loading={isSubmitting}>Create client</Button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-ink-500 hover:text-ink-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
