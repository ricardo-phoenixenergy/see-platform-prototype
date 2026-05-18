'use client'
// Client component: multi-step new project wizard

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createProject } from '@/server/actions/projects'
import { cn } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  clientName: z.string().min(2, 'Client name required'),
  technology: z.enum(['SOLAR_PV', 'WIND', 'BESS', 'HYBRID']),
  systemSizeKw: z.coerce.number().positive('Must be positive'),
  dealStructure: z.enum(['OUTRIGHT', 'PPA', 'LEASE']),
  gridConnectionStatus: z.enum(['GRID_TIED', 'OFF_GRID', 'GRID_TIED_WITH_BACKUP']),
  addressLine: z.string().min(2, 'Address required'),
  city: z.string().min(2, 'City required'),
  province: z.string().min(2, 'Province required'),
  clientNeeds: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const STEPS = ['Client & site', 'Technical', 'Commercial', 'Review']

const TECH_OPTIONS = [
  { value: 'SOLAR_PV', label: 'Solar PV' },
  { value: 'WIND', label: 'Wind' },
  { value: 'BESS', label: 'Battery Storage' },
  { value: 'HYBRID', label: 'Hybrid' },
] as const

const DEAL_OPTIONS = [
  { value: 'OUTRIGHT', label: 'Outright purchase' },
  { value: 'PPA', label: 'Power Purchase Agreement (PPA)' },
  { value: 'LEASE', label: 'Lease' },
] as const

const GRID_OPTIONS = [
  { value: 'GRID_TIED', label: 'Grid-tied' },
  { value: 'OFF_GRID', label: 'Off-grid' },
  { value: 'GRID_TIED_WITH_BACKUP', label: 'Grid-tied with backup' },
] as const

const SA_PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape',
]

export function NewProjectWizard() {
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { technology: 'SOLAR_PV', dealStructure: 'PPA', gridConnectionStatus: 'GRID_TIED' },
  })

  const values = watch()

  async function onSubmit(data: FormData) {
    setError(null)
    const result = await createProject(data)
    if (result.ok) {
      router.push(`/contractor/projects/${result.projectId}`)
    } else {
      setError(result.error)
    }
  }

  const isLastStep = step === STEPS.length - 1

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div className={cn(
                'h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0',
                i < step ? 'bg-ink-900 text-white' :
                i === step ? 'bg-accent-500 text-white' :
                'bg-ink-100 text-ink-400'
              )}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={cn('text-xs', i === step ? 'text-ink-900 font-medium' : 'text-ink-400')}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('flex-1 h-px mx-3', i < step ? 'bg-ink-300' : 'bg-ink-100')} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])}>
        {/* Step 0: Client & Site */}
        {step === 0 && (
          <div className="space-y-4">
            <Input label="Project name" placeholder="e.g. Soweto Retail Solar PPA" {...(errors.name?.message ? { error: errors.name.message } : {})} {...register('name')} />
            <Input label="Client name" placeholder="e.g. Spaza Holdings" {...(errors.clientName?.message ? { error: errors.clientName.message } : {})} {...register('clientName')} />
            <Input label="Site address" placeholder="45 Klipspruit Valley Road" {...(errors.addressLine?.message ? { error: errors.addressLine.message } : {})} {...register('addressLine')} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="City" placeholder="Soweto" {...(errors.city?.message ? { error: errors.city.message } : {})} {...register('city')} />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink-900">Province</label>
                <select
                  {...register('province')}
                  className="h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:shadow-ring"
                >
                  <option value="">Select province</option>
                  {SA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {errors.province && <p className="text-xs text-danger-500">{errors.province.message}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Technical */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-900">Technology</label>
              <div className="grid grid-cols-2 gap-2">
                {TECH_OPTIONS.map(opt => (
                  <label key={opt.value} className={cn(
                    'flex items-center gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors',
                    values.technology === opt.value ? 'border-accent-500 bg-accent-50' : 'border-ink-200 hover:bg-ink-50'
                  )}>
                    <input type="radio" value={opt.value} {...register('technology')} className="sr-only" />
                    <span className="text-sm font-medium text-ink-900">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <Input
              label="System size (kW)"
              type="number"
              placeholder="450"
              hint="Enter capacity in kilowatts (kW)"
              {...(errors.systemSizeKw?.message ? { error: errors.systemSizeKw.message } : {})}
              {...register('systemSizeKw')}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-900">Grid connection</label>
              <div className="space-y-2">
                {GRID_OPTIONS.map(opt => (
                  <label key={opt.value} className={cn(
                    'flex items-center gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors',
                    values.gridConnectionStatus === opt.value ? 'border-accent-500 bg-accent-50' : 'border-ink-200 hover:bg-ink-50'
                  )}>
                    <input type="radio" value={opt.value} {...register('gridConnectionStatus')} className="sr-only" />
                    <span className="text-sm font-medium text-ink-900">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Commercial */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-900">Deal structure</label>
              <div className="space-y-2">
                {DEAL_OPTIONS.map(opt => (
                  <label key={opt.value} className={cn(
                    'flex items-center gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors',
                    values.dealStructure === opt.value ? 'border-accent-500 bg-accent-50' : 'border-ink-200 hover:bg-ink-50'
                  )}>
                    <input type="radio" value={opt.value} {...register('dealStructure')} className="sr-only" />
                    <span className="text-sm font-medium text-ink-900">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-900">Client needs <span className="text-ink-400 font-normal">(optional)</span></label>
              <textarea
                {...register('clientNeeds')}
                rows={3}
                placeholder="e.g. Reduce energy costs by 60%, achieve grid independence within 18 months"
                className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-accent-500 focus:outline-none focus:shadow-ring resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-md border border-ink-200 divide-y divide-ink-100">
              {[
                { label: 'Project name', value: values.name },
                { label: 'Client', value: values.clientName },
                { label: 'Location', value: `${values.city}, ${values.province}` },
                { label: 'Technology', value: TECH_OPTIONS.find(o => o.value === values.technology)?.label },
                { label: 'System size', value: `${values.systemSizeKw} kW` },
                { label: 'Deal structure', value: DEAL_OPTIONS.find(o => o.value === values.dealStructure)?.label },
                { label: 'Grid connection', value: GRID_OPTIONS.find(o => o.value === values.gridConnectionStatus)?.label },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-ink-400 uppercase tracking-widest">{row.label}</span>
                  <span className="text-sm font-medium text-ink-900">{row.value ?? '—'}</span>
                </div>
              ))}
            </div>
            <div className="rounded-md bg-accent-50 border border-accent-100 px-4 py-3">
              <p className="text-xs text-accent-700 font-medium">Milestone template selected automatically</p>
              <p className="text-xs text-accent-600 mt-0.5">Based on {values.technology} · {values.systemSizeKw}kW · {values.dealStructure}</p>
            </div>
            {error && <p className="text-sm text-danger-500">{error}</p>}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
          >
            Back
          </Button>
          {isLastStep ? (
            <Button type="submit" loading={isSubmitting}>
              Create project
            </Button>
          ) : (
            <Button type="button" onClick={() => setStep(s => s + 1)}>
              Continue
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
