'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useRef } from 'react'
import Image from 'next/image'
import { Camera, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { uploadFile } from '@/lib/upload-file'
import { Button } from '@/components/ui/button'
import { updateCompany } from '@/server/actions/company'
import { getInitials } from '@/lib/utils'

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
  initialData: FormData & { logoUrl?: string | null }
}

export function CompanyForm({ initialData }: Props) {
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [logoUrl, setLogoUrl] = useState(initialData.logoUrl ?? '')
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState('')
  const logoInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: initialData.name,
      about: initialData.about,
      phone: initialData.phone,
      email: initialData.email,
      websiteUrl: initialData.websiteUrl,
      registrationNo: initialData.registrationNo,
      vatNo: initialData.vatNo,
      beeeLevel: initialData.beeeLevel,
    },
  })

  async function handleLogoFile(file: File) {
    if (!file.type.match(/^image\/(png|jpeg|svg\+xml)$/)) {
      setLogoError('Only PNG, JPG, or SVG files are allowed.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Logo must be under 2 MB.')
      return
    }

    setLogoError('')
    setLogoUploading(true)

    try {
      const url = await uploadFile(file, 'company_logo')
      setLogoUrl(url)
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLogoUploading(false)
    }
  }

  async function onSubmit(data: FormData) {
    setSaveError('')
    try {
      await updateCompany({ ...data, logoUrl: logoUrl || null })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setSaveError('Failed to save changes. Please try again.')
    }
  }

  const initials = getInitials(initialData.name)

  return (
    <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])} className="space-y-6">
      {/* Logo uploader */}
      <div className="flex items-center gap-5 pb-2 border-b border-ink-100">
        <div className="relative flex-shrink-0">
          <div className="h-16 w-16 rounded-lg overflow-hidden border border-ink-200 bg-ink-50 flex items-center justify-center">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="Company logo"
                width={64}
                height={64}
                className="h-full w-full object-contain"
                unoptimized
              />
            ) : (
              <span className="text-lg font-semibold text-ink-400 select-none">{initials}</span>
            )}
          </div>

          {/* Upload overlay */}
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            disabled={logoUploading}
            className="absolute inset-0 rounded-lg flex items-center justify-center bg-ink-900/0 hover:bg-ink-900/50 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            aria-label="Change company logo"
          >
            {logoUploading ? (
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            ) : (
              <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
            )}
          </button>

          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            className="sr-only"
            onChange={(e) => { if (e.target.files?.[0]) void handleLogoFile(e.target.files[0]) }}
          />
        </div>

        <div>
          <p className="text-sm font-medium text-ink-900">Company logo</p>
          <p className="text-xs text-ink-500 mt-0.5">PNG, JPG, or SVG · max 2 MB</p>
          {logoError && <p className="text-xs text-danger-500 mt-1">{logoError}</p>}
          {logoUrl && !logoUploading && (
            <button
              type="button"
              onClick={() => setLogoUrl('')}
              className="text-xs text-ink-400 hover:text-danger-500 transition-colors mt-1"
            >
              Remove logo
            </button>
          )}
        </div>
      </div>

      {/* Fields grid */}
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

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
          Save changes
        </Button>
        {saved && <span className="text-sm text-success-600">Saved</span>}
        {saveError && <span className="text-sm text-danger-500">{saveError}</span>}
      </div>
    </form>
  )
}
