'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updateProject, deleteProject } from '@/server/actions/projects'
import { cn } from '@/lib/utils'
import {
  DESIGN_OBJECTIVE_LABELS, BESS_CHEMISTRY_LABELS, MOUNTING_TYPE_LABELS,
  WHEELING_TYPE_LABELS, INVERTER_TOPOLOGY_LABELS,
} from '@/lib/tech-scope'
import type { DesignObjective, PvMountingType } from '@/lib/tech-scope'
import {
  SA_MUNICIPALITIES, SUPPLY_VOLTAGE_OPTIONS,
  getTariffsForSupplier, guidanceForSupplier, isTOUTariff,
} from '@/lib/site-info'

// ── Schema ────────────────────────────────────────────────────────────────────

const optNum = z.preprocess(
  v => (v === '' || v === undefined || v === null ? undefined : Number(v)),
  z.number().positive().optional()
)

const schema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  addressLine: z.string().min(2, 'Address required'),
  city: z.string().min(2, 'City required'),
  province: z.string().min(2, 'Province required'),
  clientNeeds: z.string().optional(),
  supplier: z.enum(['ESKOM', 'MUNICIPAL']),
  municipalityName: z.string().optional(),
  tariffName: z.string().optional(),
  isTOU: z.boolean(),
  nmdKva: z.coerce.number().positive('NMD is required'),
  supplyVoltage: z.enum(['LV', 'MV', 'HV']),
  transformerCapacityKva: optNum,
  accountNumber: z.string().optional(),
  hasPv: z.boolean(),
  hasBess: z.boolean(),
  hasWheeling: z.boolean(),
  inverterTopology: z.enum(['HYBRID', 'SEPARATE_GTI_PCS']).optional(),
  pvInverterKw: optNum,
  pvArrayKwp: optNum,
  bessInverterKw: optNum,
  pvMountingType: z.array(z.enum(['ROOFTOP', 'GROUND_MOUNT', 'CARPORT'])).optional(),
  bessCapacityKwh: optNum,
  bessChemistry: z.enum(['LFP', 'NMC', 'VRLA']).optional(),
  wheelingAgreementType: z.enum(['VIRTUAL_NET_METERING', 'OPEN_ACCESS', 'BILATERAL']).optional(),
  wheelingCapacityKw: optNum,
  wheelingDistanceKm: optNum,
  wheelingTradingPartner: z.string().optional(),
  designObjectives: z.array(z.enum(['SELF_CONSUMPTION', 'PEAK_SHAVING', 'BACKUP', 'GRID_EXPORT', 'ARBITRAGE'])),
  exportToGrid: z.boolean(),
  dealStructure: z.enum(['OUTRIGHT', 'PPA', 'LEASE', 'WHEELING_AGREEMENT']),
})

type FormData = z.infer<typeof schema>

// ── Constants ─────────────────────────────────────────────────────────────────

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

type Props = {
  projectId: string
  projectName: string
  defaultValues: { [K in keyof FormData]?: FormData[K] | undefined }
}

export function EditProjectForm({ projectId, projectName, defaultValues }: Props) {
  const router = useRouter()
  const [pendingData, setPendingData] = useState<FormData | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supplierInitialised = useRef(false)

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const deleteMatches = deleteConfirmText === projectName

  async function onDelete() {
    if (!deleteMatches) return
    setIsDeleting(true)
    setDeleteError(null)
    const result = await deleteProject(projectId)
    setIsDeleting(false)
    if (result.ok) {
      router.push('/contractor/projects')
    } else {
      setDeleteError(result.error)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolvedDefaults: any = {
    ...defaultValues,
    pvMountingType: defaultValues.pvMountingType ?? [],
    designObjectives: defaultValues.designObjectives ?? ['SELF_CONSUMPTION'],
    isTOU: defaultValues.isTOU ?? false,
    exportToGrid: defaultValues.exportToGrid ?? false,
  }

  const { register, watch, setValue, control, handleSubmit, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: resolvedDefaults,
  })

  const values = watch()
  const anyTechSelected = values.hasPv || values.hasBess || values.hasWheeling
  const needsTopology = values.hasPv && values.hasBess

  const pvInverterLabel = needsTopology && values.inverterTopology === 'HYBRID'
    ? 'Hybrid inverter AC rating (kW)'
    : 'PV inverter AC rating (kW)'

  // Auto-derive isTOU when tariff changes
  useEffect(() => {
    if (values.tariffName && values.supplier) {
      setValue('isTOU', isTOUTariff(values.supplier, values.tariffName))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.tariffName, values.supplier])

  // Reset tariff + municipality only when supplier actually changes (not on mount)
  useEffect(() => {
    if (!supplierInitialised.current) {
      supplierInitialised.current = true
      return
    }
    setValue('tariffName', undefined)
    setValue('isTOU', false)
    if (values.supplier !== 'MUNICIPAL') setValue('municipalityName', undefined)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.supplier])

  function onSaveClick() {
    handleSubmit(((data: FormData) => {
      setPendingData(data)
      setShowConfirm(true)
    }) as Parameters<typeof handleSubmit>[0])()
  }

  async function onConfirm() {
    if (!pendingData) return
    setIsSubmitting(true)
    setError(null)
    const result = await updateProject(projectId, pendingData)
    setIsSubmitting(false)
    if (result.ok) {
      router.push(`/contractor/projects/${projectId}/overview`)
    } else {
      setError(result.error)
      setShowConfirm(false)
    }
  }

  return (
    <>
      <form onSubmit={e => e.preventDefault()} className="space-y-8">

        {/* ── Project details ── */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Project details</p>
          <Input
            label="Project name"
            placeholder="e.g. Soweto Retail Solar PPA"
            {...(errors.name?.message ? { error: errors.name.message } : {})}
            {...register('name')}
          />
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

        {/* ── Tariff & grid supply ── */}
        <div className="space-y-6 pt-6 border-t border-ink-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Tariff & grid supply</p>

          <div className="space-y-3">
            <p className="text-sm font-medium text-ink-900">Electricity supplier</p>
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
            </div>
          )}

          <div className="space-y-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-900">
                Tariff category <span className="text-ink-400 font-normal">(optional)</span>
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

          <Input
            label="NMD — Notified Maximum Demand (kVA)"
            type="number"
            placeholder="500"
            hint="Your contracted maximum demand."
            {...(errors.nmdKva?.message ? { error: errors.nmdKva.message } : {})}
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
              hint="Optional"
              {...register('transformerCapacityKva')}
            />
            <Input
              label="Account / meter number"
              placeholder="e.g. 30-4567-8901"
              hint="Optional"
              {...register('accountNumber')}
            />
          </div>

          {values.supplier && (
            <div className="rounded-md bg-ink-50 border border-ink-200 px-4 py-3 space-y-1">
              <p className="text-xs font-semibold text-ink-700">Application guidance</p>
              <p className="text-xs text-ink-500 leading-relaxed">{guidanceForSupplier(values.supplier)}</p>
            </div>
          )}
        </div>

        {/* ── System scope & design ── */}
        <div className="space-y-6 pt-6 border-t border-ink-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">System scope & design</p>

          <div className="space-y-3">
            <p className="text-sm font-medium text-ink-900">Technologies</p>
            {!anyTechSelected && (
              <p className="text-xs text-danger-500">Select at least one technology.</p>
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

          {needsTopology && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-ink-900">Inverter topology</p>
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

          {anyTechSelected && (!needsTopology || values.inverterTopology) && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-ink-900">System sizing</p>

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

              {values.hasBess && (!values.hasPv || values.inverterTopology === 'SEPARATE_GTI_PCS') && (
                <Input
                  label="BESS PCS AC rating (kW)"
                  type="number"
                  placeholder="200"
                  hint="Power conversion system AC output"
                  {...register('bessInverterKw')}
                />
              )}

              {values.hasPv && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-ink-900">
                    Mounting type <span className="text-ink-400 font-normal">(select all that apply)</span>
                  </p>
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

          {anyTechSelected && (!needsTopology || values.inverterTopology) && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-ink-900">Design objectives</p>
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
                <label className={cn(
                  'flex items-center gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors',
                  values.exportToGrid ? 'border-accent-500 bg-accent-50' : 'border-ink-200 hover:bg-ink-50'
                )}>
                  <input type="checkbox" {...register('exportToGrid')} className="accent-accent-600" />
                  <span className="text-sm font-medium text-ink-900">Export surplus energy to grid (bidirectional metering)</span>
                </label>
              </div>
              {!values.designObjectives?.length && (
                <p className="text-xs text-danger-500">Select at least one design objective.</p>
              )}
            </div>
          )}
        </div>

        {/* ── Commercial terms ── */}
        <div className="space-y-5 pt-6 border-t border-ink-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Commercial terms</p>
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

        {/* ── Actions ── */}
        <div className="flex items-center justify-between pt-6 border-t border-ink-100">
          {error && <p className="text-sm text-danger-500">{error}</p>}
          <div className="flex items-center gap-3 ml-auto">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push(`/contractor/projects/${projectId}/overview`)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={onSaveClick}>
              Save changes
            </Button>
          </div>
        </div>

        {/* ── Danger zone ── */}
        <div className="mt-2 rounded-xl border border-danger-200 p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-danger-500">Danger zone</p>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-ink-900">Delete this project</p>
              <p className="text-xs text-ink-500 mt-0.5">
                Permanently removes the project and all associated milestones, documents, and workspace data. This cannot be undone.
              </p>
            </div>
            <Button
              type="button"
              variant="danger"
              onClick={() => { setShowDeleteDialog(true); setDeleteConfirmText(''); setDeleteError(null) }}
              className="flex-shrink-0 flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete project
            </Button>
          </div>
        </div>
      </form>

      {/* ── Delete confirmation dialog ── */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl border border-danger-200 shadow-xl p-6 max-w-md w-full mx-4 space-y-5">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-danger-50 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-4 w-4 text-danger-500" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900">Delete this project?</p>
                <p className="text-xs text-ink-500 mt-1.5 leading-relaxed">
                  This will permanently delete <span className="font-medium text-ink-900">{projectName}</span> and
                  all associated data — milestones, documents, communications, and workspace history.
                  This action <span className="font-medium text-ink-900">cannot be undone</span>.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-ink-600">
                To confirm, type <span className="font-semibold text-ink-900">{projectName}</span> below:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && deleteMatches) onDelete() }}
                placeholder={projectName}
                className="w-full h-10 rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 placeholder:text-ink-300 focus:border-danger-400 focus:outline-none focus:ring-1 focus:ring-danger-300"
                autoComplete="off"
              />
              {deleteError && <p className="text-xs text-danger-500">{deleteError}</p>}
            </div>

            <div className="flex items-center gap-3 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setShowDeleteDialog(false); setDeleteConfirmText(''); setDeleteError(null) }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={!deleteMatches}
                loading={isDeleting}
                onClick={onDelete}
              >
                Delete this project
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Save confirmation dialog ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl border border-ink-200 shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-amber-500" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900">Confirm project changes</p>
                <p className="text-xs text-ink-500 mt-1.5 leading-relaxed">
                  Updating these details may change the milestone requirements and verification
                  steps for this project. Existing progress will not be deleted, but your team
                  should review any updated requirements before proceeding.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-end pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setShowConfirm(false); setPendingData(null) }}
              >
                Cancel
              </Button>
              <Button type="button" loading={isSubmitting} onClick={onConfirm}>
                Confirm changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
