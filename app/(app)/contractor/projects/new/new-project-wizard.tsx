'use client'

import { useState, useEffect } from 'react'
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
  DESIGN_OBJECTIVE_LABELS, BESS_CHEMISTRY_LABELS, MOUNTING_TYPE_LABELS,
  WHEELING_TYPE_LABELS, INVERTER_TOPOLOGY_LABELS,
} from '@/lib/tech-scope'
import type { DesignObjective, PvMountingType } from '@/lib/tech-scope'
import {
  ESKOM_TARIFFS, MUNICIPAL_TARIFFS, SA_MUNICIPALITIES,
  SUPPLY_VOLTAGE_OPTIONS, getTariffsForSupplier, guidanceForSupplier, isTOUTariff,
} from '@/lib/site-info'
import type { ElectricitySupplier, SupplyVoltage } from '@/lib/site-info'

// ── Form schema ──────────────────────────────────────────────────────────────

const optNum = z.preprocess(
  v => (v === '' || v === undefined || v === null ? undefined : Number(v)),
  z.number().positive().optional()
)

const schema = z.object({
  // Step 0 — Client & site
  clientRecordId: z.string().optional(),
  clientName: z.string().min(2, 'Client name required'),
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  addressLine: z.string().min(2, 'Address required'),
  city: z.string().min(2, 'City required'),
  province: z.string().min(2, 'Province required'),

  // Step 1 — Tariff & grid supply
  supplier: z.enum(['ESKOM', 'MUNICIPAL']),
  municipalityName: z.string().optional(),
  tariffName: z.string().optional(),
  isTOU: z.boolean(),
  nmdKva: z.coerce.number().positive('NMD is required'),
  supplyVoltage: z.enum(['LV', 'MV', 'HV']),
  transformerCapacityKva: optNum,
  accountNumber: z.string().optional(),

  // Step 2 — System scope & design
  hasPv: z.boolean(),
  hasBess: z.boolean(),
  hasWheeling: z.boolean(),

  // Inverter topology (when hasPv && hasBess)
  inverterTopology: z.enum(['HYBRID', 'SEPARATE_GTI_PCS']).optional(),

  // Sizing
  pvInverterKw: optNum,   // hybrid inverter size (HYBRID) or PV GTI size (SEPARATE_GTI_PCS / PV-only)
  pvArrayKwp: optNum,     // DC array size (kWp)
  bessInverterKw: optNum, // PCS size (SEPARATE_GTI_PCS or BESS-only)

  // PV details
  pvMountingType: z.array(z.enum(['ROOFTOP', 'GROUND_MOUNT', 'CARPORT'])).optional(),

  // BESS details
  bessCapacityKwh: optNum,
  bessChemistry: z.enum(['LFP', 'NMC', 'VRLA']).optional(),

  // Wheeling details
  wheelingAgreementType: z.enum(['VIRTUAL_NET_METERING', 'OPEN_ACCESS', 'BILATERAL']).optional(),
  wheelingCapacityKw: optNum,
  wheelingDistanceKm: optNum,
  wheelingTradingPartner: z.string().optional(),

  // Grid & design
  gridConnectionStatus: z.enum(['GRID_TIED', 'OFF_GRID', 'GRID_TIED_WITH_BACKUP']),
  designObjectives: z.array(z.enum(['SELF_CONSUMPTION', 'PEAK_SHAVING', 'BACKUP', 'GRID_EXPORT', 'ARBITRAGE'])),
  exportToGrid: z.boolean(),

  // Step 3 — Commercial
  dealStructure: z.enum(['OUTRIGHT', 'PPA', 'LEASE', 'WHEELING_AGREEMENT']),
  clientNeeds: z.string().optional(),
})

type FormData = z.infer<typeof schema>

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS = ['Client & site', 'Tariff & grid supply', 'System scope & design', 'Commercial', 'Review']

const SA_PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape',
]

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
      supplier: 'MUNICIPAL' as ElectricitySupplier,
      isTOU: false,
      supplyVoltage: 'LV' as SupplyVoltage,
      hasPv: true,
      hasBess: false,
      hasWheeling: false,
      pvMountingType: [],
      designObjectives: ['SELF_CONSUMPTION'],
      exportToGrid: false,
      gridConnectionStatus: 'GRID_TIED',
      dealStructure: 'PPA',
    },
  })

  const values = watch()
  const anyTechSelected = values.hasPv || values.hasBess || values.hasWheeling
  const needsTopology = values.hasPv && values.hasBess

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
    if (step === 1) {
      if (!values.supplier) return false
      if (values.supplier === 'MUNICIPAL' && !values.municipalityName) return false
      if (!values.nmdKva || values.nmdKva <= 0) return false
      if (!values.supplyVoltage) return false
      return true
    }
    if (step === 2) {
      if (!anyTechSelected) return false
      if (needsTopology && !values.inverterTopology) return false
      if (values.hasPv && !values.pvInverterKw) return false
      if (values.hasBess && !values.hasPv && !values.bessInverterKw) return false
      if (values.hasBess && values.inverterTopology === 'SEPARATE_GTI_PCS' && !values.bessInverterKw) return false
      if (!values.designObjectives?.length) return false
      return true
    }
    return true
  }

  // Auto-derive isTOU when tariff changes
  useEffect(() => {
    if (values.tariffName && values.supplier) {
      setValue('isTOU', isTOUTariff(values.supplier, values.tariffName))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.tariffName, values.supplier])

  // Reset tariff + municipality when supplier changes
  useEffect(() => {
    setValue('tariffName', undefined)
    setValue('isTOU', false)
    if (values.supplier !== 'MUNICIPAL') setValue('municipalityName', undefined)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.supplier])

  const isLastStep = step === STEPS.length - 1

  // Inverter size label changes by topology
  const pvInverterLabel = needsTopology && values.inverterTopology === 'HYBRID'
    ? 'Hybrid inverter AC rating (kW)'
    : 'PV inverter AC rating (kW)'

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

        {/* ── Step 1: Tariff & Grid Supply ── */}
        {step === 1 && (
          <div className="space-y-6">

            {/* Electricity supplier */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Electricity supplier</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {([
                  { value: 'ESKOM' as const, label: 'Eskom', sub: 'Direct Eskom supply area' },
                  { value: 'MUNICIPAL' as const, label: 'Municipal utility', sub: 'City / municipality supplied' },
                ]).map(({ value, label, sub }) => (
                  <label key={value} className={cn(
                    'flex items-start gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors',
                    values.supplier === value ? 'border-accent-500 bg-accent-50' : 'border-ink-200 hover:bg-ink-50'
                  )}>
                    <input type="radio" value={value} {...register('supplier')} className="mt-0.5 accent-accent-600" />
                    <div>
                      <p className="text-sm font-medium text-ink-900">{label}</p>
                      <p className="text-xs text-ink-500">{sub}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Municipality picker */}
            {values.supplier === 'MUNICIPAL' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink-900">Municipality / utility</label>
                <select
                  {...register('municipalityName')}
                  className="h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:shadow-ring"
                >
                  <option value="">Select municipality…</option>
                  {SA_MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {!values.municipalityName && (
                  <p className="text-xs text-danger-500">Select the supplying municipality to continue.</p>
                )}
              </div>
            )}

            {/* Tariff category */}
            <div className="space-y-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink-900">
                  Tariff category <span className="text-ink-400 font-normal">(optional — helps with financial modelling)</span>
                </label>
                <select
                  {...register('tariffName')}
                  className="h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:shadow-ring"
                >
                  <option value="">Select tariff…</option>
                  {getTariffsForSupplier(values.supplier).map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              {values.isTOU && (
                <div className="flex items-center gap-2 rounded-md bg-accent-50 border border-accent-100 px-3 py-2">
                  <span className="text-[10px] font-semibold text-accent-600 uppercase tracking-wide">TOU tariff</span>
                  <span className="text-xs text-ink-600">BESS arbitrage and peak-shaving strategies are applicable.</span>
                </div>
              )}
            </div>

            {/* Supply capacity */}
            <div className="space-y-4 pt-2 border-t border-ink-100">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Supply capacity</p>

              <Input
                label="NMD — Notified Maximum Demand (kVA)"
                type="number"
                placeholder="500"
                hint="Your contracted maximum demand. Embedded generation typically limited to ≤ 100% of NMD."
                {...register('nmdKva')}
              />

              <div className="space-y-2">
                <p className="text-sm font-medium text-ink-900">Connection / supply voltage</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {SUPPLY_VOLTAGE_OPTIONS.map(opt => (
                    <label key={opt.value} className={cn(
                      'flex items-start gap-3 rounded-md border px-3 py-2.5 cursor-pointer transition-colors',
                      values.supplyVoltage === opt.value ? 'border-accent-500 bg-accent-50' : 'border-ink-200 hover:bg-ink-50'
                    )}>
                      <input type="radio" value={opt.value} {...register('supplyVoltage')} className="mt-0.5 accent-accent-600" />
                      <div>
                        <p className="text-sm font-medium text-ink-900">{opt.label}</p>
                        <p className="text-xs text-ink-500">{opt.sub}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Transformer capacity (kVA)"
                  type="number"
                  placeholder="630"
                  hint="Optional — relevant for grid export scenarios"
                  {...register('transformerCapacityKva')}
                />
                <Input
                  label="Account / meter number"
                  placeholder="e.g. 30-4567-8901"
                  hint="Optional — utility account reference"
                  {...register('accountNumber')}
                />
              </div>
            </div>

            {/* Smart guidance note */}
            {values.supplier && (
              <div className="rounded-md bg-ink-50 border border-ink-200 px-4 py-3 space-y-1">
                <p className="text-xs font-semibold text-ink-700">Application guidance</p>
                <p className="text-xs text-ink-500 leading-relaxed">
                  {guidanceForSupplier(values.supplier)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: System Scope & Design ── */}
        {step === 2 && (
          <div className="space-y-6">

            {/* Technologies */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Technologies</p>
              {!anyTechSelected && (
                <p className="text-xs text-danger-500">Select at least one technology to continue.</p>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {([
                  { field: 'hasPv' as const, label: 'Solar PV', sub: 'Photovoltaic generation' },
                  { field: 'hasBess' as const, label: 'Battery Storage', sub: 'BESS / energy storage' },
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

            {/* Inverter topology — only when both PV + BESS */}
            {needsTopology && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Inverter topology</p>
                {!values.inverterTopology && (
                  <p className="text-xs text-danger-500">Select an inverter topology to continue.</p>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(Object.entries(INVERTER_TOPOLOGY_LABELS) as [import('@/lib/tech-scope').InverterTopology, { label: string; sub: string }][]).map(([val, { label, sub }]) => (
                    <label key={val} className={cn(
                      'flex items-start gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors',
                      values.inverterTopology === val ? 'border-accent-500 bg-accent-50' : 'border-ink-200 hover:bg-ink-50'
                    )}>
                      <input type="radio" value={val} {...register('inverterTopology')} className="mt-0.5 accent-accent-600" />
                      <div>
                        <p className="text-sm font-medium text-ink-900">{label}</p>
                        <p className="text-xs text-ink-500">{sub}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Sizing — shown once topology is resolved (or not needed) */}
            {anyTechSelected && (!needsTopology || values.inverterTopology) && (
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">System sizing</p>

                {/* PV inverter size (PV present) */}
                {values.hasPv && (
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label={pvInverterLabel}
                      type="number"
                      placeholder="450"
                      hint="AC output rating of the inverter"
                      {...register('pvInverterKw')}
                    />
                    <Input
                      label="PV array DC size (kWp)"
                      type="number"
                      placeholder="550"
                      hint="Total nameplate DC capacity of the array"
                      {...register('pvArrayKwp')}
                    />
                  </div>
                )}

                {/* PCS size — separate topology or BESS-only */}
                {values.hasBess && (!values.hasPv || values.inverterTopology === 'SEPARATE_GTI_PCS') && (
                  <Input
                    label="BESS PCS AC rating (kW)"
                    type="number"
                    placeholder="200"
                    hint="Power conversion system AC output"
                    {...register('bessInverterKw')}
                  />
                )}

                {/* PV mounting */}
                {values.hasPv && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-ink-900">Mounting type <span className="text-ink-400 font-normal">(select all that apply)</span></p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {(Object.entries(MOUNTING_TYPE_LABELS) as [PvMountingType, string][]).map(([val, label]) => (
                        <label key={val} className={cn(
                          'flex items-center gap-2.5 rounded-md border px-3 py-2.5 cursor-pointer transition-colors',
                          values.pvMountingType?.includes(val) ? 'border-accent-500 bg-accent-50' : 'border-ink-200 hover:bg-ink-50'
                        )}>
                          <Controller
                            name="pvMountingType"
                            control={control}
                            render={({ field }) => (
                              <input
                                type="checkbox"
                                checked={field.value?.includes(val) ?? false}
                                onChange={e => {
                                  const current = field.value ?? []
                                  field.onChange(
                                    e.target.checked ? [...current, val] : current.filter(v => v !== val)
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
                  </div>
                )}

                {/* BESS details */}
                {values.hasBess && (
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Storage capacity (kWh)" type="number" placeholder="200" {...register('bessCapacityKwh')} />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-ink-900">Battery chemistry</label>
                      <select {...register('bessChemistry')} className="h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-sm focus:border-accent-500 focus:outline-none">
                        <option value="">Select…</option>
                        {(Object.entries(BESS_CHEMISTRY_LABELS) as [string, string][]).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Wheeling details */}
                {values.hasWheeling && (
                  <div className="space-y-3 rounded-md border border-ink-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Wheeling / trading details</p>
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
                      <Input label="Contracted capacity (kW)" type="number" placeholder="500" {...register('wheelingCapacityKw')} />
                      <Input label="Wheeling distance (km)" type="number" placeholder="15" {...register('wheelingDistanceKm')} />
                    </div>
                    <Input label="Trading partner / offtaker" placeholder="e.g. City Power" {...register('wheelingTradingPartner')} />
                  </div>
                )}
              </div>
            )}

            {/* Design objectives */}
            {anyTechSelected && (!needsTopology || values.inverterTopology) && (
              <div className="space-y-3 pt-4 border-t border-ink-100">
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Design objectives</p>
                <p className="text-xs text-ink-500">Select all that apply.</p>
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
                                e.target.checked ? [...current, val] : current.filter(v => v !== val)
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
                {!values.designObjectives?.length && (
                  <p className="text-xs text-danger-500">Select at least one design objective.</p>
                )}

                <label className={cn(
                  'flex items-center gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors',
                  values.exportToGrid ? 'border-accent-500 bg-accent-50' : 'border-ink-200 hover:bg-ink-50'
                )}>
                  <input type="checkbox" {...register('exportToGrid')} className="accent-accent-600" />
                  <span className="text-sm font-medium text-ink-900">Export surplus energy to grid (bidirectional metering)</span>
                </label>
              </div>
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
                { label: 'Supplier', value: values.supplier === 'ESKOM' ? 'Eskom' : (values.municipalityName ?? 'Municipal utility') },
                { label: 'Tariff', value: values.tariffName ? `${[...ESKOM_TARIFFS, ...MUNICIPAL_TARIFFS].find(t => t.value === values.tariffName)?.label ?? values.tariffName}${values.isTOU ? ' (TOU)' : ''}` : '—' },
                { label: 'NMD', value: values.nmdKva ? `${values.nmdKva} kVA` : '—' },
                { label: 'Supply voltage', value: values.supplyVoltage ?? '—' },
                {
                  label: 'Technologies',
                  value: [
                    values.hasPv && 'Solar PV',
                    values.hasBess && 'BESS',
                    values.hasWheeling && 'Wheeling',
                  ].filter(Boolean).join(' + '),
                },
                ...(values.hasPv && values.hasBess && values.inverterTopology ? [{
                  label: 'Inverter topology',
                  value: INVERTER_TOPOLOGY_LABELS[values.inverterTopology].label,
                }] : []),
                ...(values.hasPv && values.pvInverterKw ? [{
                  label: values.inverterTopology === 'HYBRID' ? 'Hybrid inverter' : 'PV inverter',
                  value: `${values.pvInverterKw} kW AC`,
                }] : []),
                ...(values.hasBess && values.bessInverterKw ? [{
                  label: 'BESS PCS',
                  value: `${values.bessInverterKw} kW`,
                }] : []),
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
                Based on technology mix · {values.hasPv ? `${values.pvInverterKw ?? '—'} kW` : `${values.bessInverterKw ?? '—'} kW`} · {values.dealStructure}
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
