'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ClientPicker, type ClientOption } from '@/components/contractor/client-picker'
import { createProject } from '@/server/actions/projects'
import { cn } from '@/lib/utils'
import {
  DESIGN_OBJECTIVE_LABELS, BESS_CHEMISTRY_LABELS,
  MOUNTING_TYPE_LABELS, WHEELING_TYPE_LABELS,
} from '@/lib/tech-scope'
import type { DesignObjective } from '@/lib/tech-scope'

// ── Form schema ──────────────────────────────────────────────────────────────

const optNum = z.preprocess(
  v => (v === '' || v === undefined || v === null ? undefined : Number(v)),
  z.number().positive().optional()
)

const schema = z.object({
  // Step 0
  clientRecordId: z.string().optional(),
  clientName: z.string().min(2, 'Client name required'),
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  addressLine: z.string().min(2, 'Address required'),
  city: z.string().min(2, 'City required'),
  province: z.string().min(2, 'Province required'),

  // Step 1 — tech flags
  hasPv: z.boolean(),
  hasBess: z.boolean(),
  hasWind: z.boolean(),
  hasWheeling: z.boolean(),

  // PV
  pvCapacityKwp: optNum,
  pvPanelBrand: z.string().optional(),
  pvInverterBrand: z.string().optional(),
  pvMountingType: z.enum(['ROOFTOP', 'GROUND_MOUNT', 'CARPORT']).optional(),

  // BESS
  bessCapacityKwh: optNum,
  bessPowerKw: optNum,
  bessChemistry: z.enum(['LFP', 'NMC', 'VRLA']).optional(),
  bessBrandModel: z.string().optional(),
  bessAutonomyHours: optNum,

  // Wind
  windCapacityKw: optNum,
  windTurbineModel: z.string().optional(),
  windHubHeightM: optNum,

  // Wheeling
  wheelingAgreementType: z.enum(['VIRTUAL_NET_METERING', 'OPEN_ACCESS', 'BILATERAL']).optional(),
  wheelingDistanceKm: optNum,
  wheelingTradingPartner: z.string().optional(),

  // Step 2
  systemSizeKw: z.coerce.number().positive('Must be positive'),
  gridConnectionStatus: z.enum(['GRID_TIED', 'OFF_GRID', 'GRID_TIED_WITH_BACKUP']),
  designObjectives: z.array(z.enum(['SELF_CONSUMPTION', 'PEAK_SHAVING', 'BACKUP', 'GRID_EXPORT'])),
  exportToGrid: z.boolean(),
  targetBackupHours: optNum,

  // Step 3
  dealStructure: z.enum(['OUTRIGHT', 'PPA', 'LEASE', 'WHEELING_AGREEMENT']),
  clientNeeds: z.string().optional(),
})

type FormData = z.infer<typeof schema>

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS = ['Client & site', 'Tech scope', 'System design', 'Commercial', 'Review']

const SA_PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape',
]

const GRID_OPTIONS = [
  { value: 'GRID_TIED', label: 'Grid-tied' },
  { value: 'OFF_GRID', label: 'Off-grid' },
  { value: 'GRID_TIED_WITH_BACKUP', label: 'Grid-tied with backup' },
] as const

const DEAL_OPTIONS = [
  { value: 'OUTRIGHT', label: 'Outright purchase' },
  { value: 'PPA', label: 'Power Purchase Agreement (PPA)' },
  { value: 'LEASE', label: 'Lease' },
  { value: 'WHEELING_AGREEMENT', label: 'Wheeling / Energy trading agreement' },
] as const

// ── Component ─────────────────────────────────────────────────────────────────

type Props = { clients: ClientOption[]; defaultClientId?: string }

export function NewProjectWizard({ clients, defaultClientId }: Props) {
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const defaultClient = defaultClientId ? clients.find(c => c.id === defaultClientId) : undefined

  const { register, handleSubmit, watch, setValue, control, formState: { errors, isSubmitting } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      clientRecordId: defaultClientId ?? '',
      clientName: defaultClient?.name ?? '',
      hasPv: true,
      hasBess: false,
      hasWind: false,
      hasWheeling: false,
      designObjectives: ['SELF_CONSUMPTION'],
      exportToGrid: false,
      gridConnectionStatus: 'GRID_TIED',
      dealStructure: 'PPA',
    },
  })

  const values = watch()

  const anyTechSelected = values.hasPv || values.hasBess || values.hasWind || values.hasWheeling

  async function onSubmit(data: FormData) {
    setError(null)
    const result = await createProject(data)
    if (result.ok) {
      router.push(`/contractor/projects/${result.projectId}`)
    } else {
      setError(result.error)
    }
  }

  function canAdvance(): boolean {
    if (step === 0) {
      return !!(values.clientName?.length >= 2 && values.name?.length >= 3 &&
        values.addressLine?.length >= 2 && values.city?.length >= 2 && values.province?.length >= 2)
    }
    if (step === 1) return anyTechSelected
    if (step === 2) {
      return !!(values.systemSizeKw > 0 && values.designObjectives?.length > 0)
    }
    return true
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
              <span className={cn('text-xs hidden sm:block', i === step ? 'text-ink-900 font-medium' : 'text-ink-400')}>
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

        {/* ── Step 0: Client & Site ── */}
        {step === 0 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink-900">Client</label>
              <ClientPicker
                clients={clients}
                value={values.clientRecordId ?? ''}
                onChange={(id, name) => {
                  setValue('clientRecordId', id)
                  setValue('clientName', name)
                }}
                onClearToManual={() => {
                  setValue('clientRecordId', '')
                  setValue('clientName', '')
                }}
              />
              {!values.clientRecordId && (
                <div className="mt-2">
                  <Input
                    label="Or enter client name manually"
                    placeholder="e.g. Durbanville Mall Management"
                    {...(errors.clientName?.message ? { error: errors.clientName.message } : {})}
                    {...register('clientName')}
                  />
                </div>
              )}
            </div>

            <Input
              label="Project name"
              placeholder="e.g. Soweto Retail Solar PPA"
              {...(errors.name?.message ? { error: errors.name.message } : {})}
              {...register('name')}
            />

            <div className="space-y-3 pt-2 border-t border-ink-100">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Site location</p>
              <Input
                label="Site address"
                placeholder="45 Klipspruit Valley Road"
                {...(errors.addressLine?.message ? { error: errors.addressLine.message } : {})}
                {...register('addressLine')}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  placeholder="Soweto"
                  {...(errors.city?.message ? { error: errors.city.message } : {})}
                  {...register('city')}
                />
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
          </div>
        )}

        {/* ── Step 1: Technology Scope ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-medium text-ink-900">Select all technologies included in this project</p>
              {!anyTechSelected && (
                <p className="text-xs text-danger-500">Select at least one technology to continue.</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                {([
                  { field: 'hasPv' as const, label: 'Solar PV', sub: 'Photovoltaic generation' },
                  { field: 'hasBess' as const, label: 'Battery Storage', sub: 'BESS / energy storage' },
                  { field: 'hasWind' as const, label: 'Wind', sub: 'Wind turbine generation' },
                  { field: 'hasWheeling' as const, label: 'Wheeling / Trading', sub: 'Energy trading via grid' },
                ]).map(({ field, label, sub }) => (
                  <label key={field} className={cn(
                    'flex items-start gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors',
                    values[field] ? 'border-accent-500 bg-accent-50' : 'border-ink-200 hover:bg-ink-50'
                  )}>
                    <input type="checkbox" {...register(field)} className="mt-0.5 accent-accent-600" />
                    <div>
                      <p className="text-sm font-medium text-ink-900">{label}</p>
                      <p className="text-xs text-ink-500">{sub}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* PV details */}
            {values.hasPv && (
              <div className="space-y-3 rounded-md border border-ink-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Solar PV details</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="PV capacity (kWp)" type="number" placeholder="500" {...register('pvCapacityKwp')} />
                  <Input label="Panel brand / model" placeholder="e.g. Jinko Tiger Neo" {...register('pvPanelBrand')} />
                  <Input label="Inverter brand" placeholder="e.g. SMA Sunny Tripower" {...register('pvInverterBrand')} />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-ink-900">Mounting type</label>
                    <select {...register('pvMountingType')} className="h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-sm focus:border-accent-500 focus:outline-none">
                      <option value="">Select…</option>
                      {(Object.entries(MOUNTING_TYPE_LABELS) as [string, string][]).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* BESS details */}
            {values.hasBess && (
              <div className="space-y-3 rounded-md border border-ink-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Battery Storage details</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Energy capacity (kWh)" type="number" placeholder="200" {...register('bessCapacityKwh')} />
                  <Input label="Power rating (kW)" type="number" placeholder="100" {...register('bessPowerKw')} />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-ink-900">Battery chemistry</label>
                    <select {...register('bessChemistry')} className="h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-sm focus:border-accent-500 focus:outline-none">
                      <option value="">Select…</option>
                      {(Object.entries(BESS_CHEMISTRY_LABELS) as [string, string][]).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <Input label="Brand / model" placeholder="e.g. Dyness B5" {...register('bessBrandModel')} />
                </div>
                <Input label="Target backup autonomy (hours)" type="number" placeholder="4" hint="Hours of full-load backup required" {...register('bessAutonomyHours')} />
              </div>
            )}

            {/* Wind details */}
            {values.hasWind && (
              <div className="space-y-3 rounded-md border border-ink-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Wind details</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Wind capacity (kW)" type="number" placeholder="250" {...register('windCapacityKw')} />
                  <Input label="Turbine model" placeholder="e.g. Vestas V90" {...register('windTurbineModel')} />
                  <Input label="Hub height (m)" type="number" placeholder="80" {...register('windHubHeightM')} />
                </div>
              </div>
            )}

            {/* Wheeling details */}
            {values.hasWheeling && (
              <div className="space-y-3 rounded-md border border-ink-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Wheeling / Energy trading details</p>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-ink-900">Agreement type</label>
                  <select {...register('wheelingAgreementType')} className="h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-sm focus:border-accent-500 focus:outline-none">
                    <option value="">Select…</option>
                    {(Object.entries(WHEELING_TYPE_LABELS) as [string, string][]).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Wheeling distance (km)" type="number" placeholder="15" {...register('wheelingDistanceKm')} />
                  <Input label="Trading partner / offtaker" placeholder="e.g. City Power" {...register('wheelingTradingPartner')} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: System Sizing & Design Philosophy ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">System sizing</p>
              <Input
                label="Total rated AC capacity (kW)"
                type="number"
                placeholder="450"
                hint="Total AC inverter output — used for tier tracking and milestone selection"
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
                      <input type="radio" value={opt.value} {...register('gridConnectionStatus')} className="accent-accent-600" />
                      <span className="text-sm font-medium text-ink-900">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-ink-100">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Design objectives</p>
              <p className="text-xs text-ink-500">Select all that apply — these drive the design and O&amp;M approach.</p>
              <div className="grid grid-cols-1 gap-2">
                {(Object.entries(DESIGN_OBJECTIVE_LABELS) as [DesignObjective, string][]).map(([val, label]) => (
                  <label key={val} className={cn(
                    'flex items-center gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors',
                    values.designObjectives?.includes(val) ? 'border-accent-500 bg-accent-50' : 'border-ink-200 hover:bg-ink-50'
                  )}>
                    <Controller
                      name="designObjectives"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          checked={field.value?.includes(val) ?? false}
                          onChange={e => {
                            const current = field.value ?? []
                            field.onChange(
                              e.target.checked
                                ? [...current, val]
                                : current.filter(v => v !== val)
                            )
                          }}
                          className="accent-accent-600"
                        />
                      )}
                    />
                    <span className="text-sm font-medium text-ink-900">{label}</span>
                  </label>
                ))}
              </div>
              {errors.designObjectives && (
                <p className="text-xs text-danger-500">Select at least one design objective.</p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-ink-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('exportToGrid')} className="accent-accent-600" />
                <span className="text-sm font-medium text-ink-900">Export surplus energy to grid (bidirectional metering)</span>
              </label>
            </div>

            {(values.hasBess || values.gridConnectionStatus === 'OFF_GRID') && (
              <Input
                label="Target backup autonomy (hours)"
                type="number"
                placeholder="4"
                hint="Total hours of backup at full site load"
                {...register('targetBackupHours')}
              />
            )}
          </div>
        )}

        {/* ── Step 3: Commercial ── */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-900">Deal structure</label>
              <div className="space-y-2">
                {DEAL_OPTIONS
                  .filter(o => o.value !== 'WHEELING_AGREEMENT' || values.hasWheeling)
                  .map(opt => (
                    <label key={opt.value} className={cn(
                      'flex items-center gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors',
                      values.dealStructure === opt.value ? 'border-accent-500 bg-accent-50' : 'border-ink-200 hover:bg-ink-50'
                    )}>
                      <input type="radio" value={opt.value} {...register('dealStructure')} className="accent-accent-600" />
                      <span className="text-sm font-medium text-ink-900">{opt.label}</span>
                    </label>
                  ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-900">
                Client needs / motivation <span className="text-ink-400 font-normal">(optional)</span>
              </label>
              <textarea
                {...register('clientNeeds')}
                rows={3}
                placeholder="e.g. Reduce energy costs by 60%, achieve grid independence within 18 months"
                className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-accent-500 focus:outline-none focus:shadow-ring resize-none"
              />
            </div>
          </div>
        )}

        {/* ── Step 4: Review ── */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="rounded-md border border-ink-200 divide-y divide-ink-100">
              {[
                { label: 'Client', value: values.clientName },
                { label: 'Project name', value: values.name },
                { label: 'Location', value: `${values.city}, ${values.province}` },
                {
                  label: 'Technologies',
                  value: [
                    values.hasPv && 'Solar PV',
                    values.hasBess && 'BESS',
                    values.hasWind && 'Wind',
                    values.hasWheeling && 'Wheeling',
                  ].filter(Boolean).join(' + '),
                },
                { label: 'System size', value: `${values.systemSizeKw} kW AC` },
                { label: 'Grid connection', value: GRID_OPTIONS.find(o => o.value === values.gridConnectionStatus)?.label },
                { label: 'Deal structure', value: DEAL_OPTIONS.find(o => o.value === values.dealStructure)?.label },
                {
                  label: 'Design objectives',
                  value: values.designObjectives?.map(o => DESIGN_OBJECTIVE_LABELS[o]).join(', '),
                },
              ].map(row => (
                <div key={row.label} className="flex items-start justify-between px-4 py-3 gap-4">
                  <span className="text-xs text-ink-400 uppercase tracking-widest flex-shrink-0 w-36">{row.label}</span>
                  <span className="text-sm font-medium text-ink-900 text-right">{row.value ?? '—'}</span>
                </div>
              ))}
            </div>
            <div className="rounded-md bg-accent-50 border border-accent-100 px-4 py-3">
              <p className="text-xs text-accent-700 font-medium">Milestone template assigned automatically</p>
              <p className="text-xs text-accent-600 mt-0.5">
                Based on technology mix · {values.systemSizeKw} kW · {values.dealStructure}
              </p>
            </div>
            {error && <p className="text-sm text-danger-500">{error}</p>}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button type="button" variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
            Back
          </Button>
          {isLastStep ? (
            <Button type="submit" loading={isSubmitting}>Create project</Button>
          ) : (
            <Button type="button" onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}>
              Continue
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
