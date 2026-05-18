'use client'
// Client component: company profile edit form with React Hook Form

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const schema = z.object({
  name: z.string().min(2, 'Company name required'),
  about: z.string().max(500).optional(),
  phone: z.string().optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  websiteUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  registrationNo: z.string().optional(),
  vatNo: z.string().optional(),
  beeeLevel: z.number().int().min(1).max(8).nullable(),
})
type FormData = z.infer<typeof schema>

type Props = {
  companyId: string
  initialData: FormData
}

export function CompanyForm({ companyId: _companyId, initialData }: Props) {
  const [saved, setSaved] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: initialData,
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function onSubmit(_data: FormData) {
    // Server action wired in Phase 2.3 — for now show success feedback
    await new Promise(r => setTimeout(r, 600))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Company name" {...(errors.name?.message ? { error: errors.name.message } : {})} {...register('name')} />
        <Input label="Registration number (CIPC)" {...register('registrationNo')} />
        <Input label="VAT number" {...register('vatNo')} />
        <Input label="BEEE level" type="number" min={1} max={8} {...register('beeeLevel', { valueAsNumber: true })} />
        <Input label="Phone" type="tel" {...register('phone')} />
        <Input label="Email" type="email" {...(errors.email?.message ? { error: errors.email.message } : {})} {...register('email')} />
        <Input label="Website" type="url" {...(errors.websiteUrl?.message ? { error: errors.websiteUrl.message } : {})} {...register('websiteUrl')} className="sm:col-span-2" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink-900">About</label>
        <textarea
          {...register('about')}
          rows={3}
          placeholder="Brief description of your company and specialisations."
          className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-accent-500 focus:outline-none focus:shadow-ring resize-none"
        />
      </div>
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" loading={isSubmitting} disabled={!isDirty && !isSubmitting}>
          Save changes
        </Button>
        {saved && <span className="text-sm text-success-500">Saved</span>}
      </div>
    </form>
  )
}
