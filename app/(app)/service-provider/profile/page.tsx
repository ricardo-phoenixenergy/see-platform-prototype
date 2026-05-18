'use client'

import { useState, useTransition, useEffect } from 'react'
import { updateSpProfile } from '@/server/actions/marketplace'
import { Loader2 } from 'lucide-react'

const ALL_CATEGORIES = [
  { value: 'STRUCTURAL_CIVILS', label: 'Structural & Civils' },
  { value: 'ENGINEERING', label: 'Engineering' },
  { value: 'LEGAL', label: 'Legal' },
  { value: 'LOGISTICS_PLANT_HIRE', label: 'Logistics & Plant Hire' },
  { value: 'FINANCE_INSURANCE', label: 'Finance & Insurance' },
]
const SA_PROVINCES = [
  'Western Cape', 'Gauteng', 'Eastern Cape', 'KwaZulu-Natal',
  'Northern Cape', 'Limpopo', 'Mpumalanga', 'North West', 'Free State',
]

type ProfileData = {
  companyId: string
  headline: string
  description: string
  categories: string[]
  serviceAreas: string[]
  hourlyRateCents: number | null
}

export default function SpProfilePage() {
  const [isPending, startTransition] = useTransition()
  const [headline, setHeadline] = useState('')
  const [description, setDescription] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [serviceAreas, setServiceAreas] = useState<string[]>([])
  const [hourlyRate, setHourlyRate] = useState('')
  const [saved, setSaved] = useState(false)
  const [companyId, setCompanyId] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/sp/profile')
      .then((r) => r.json())
      .then((data: { profile: ProfileData | null; companyId: string }) => {
        setCompanyId(data.companyId)
        if (data.profile) {
          setHeadline(data.profile.headline)
          setDescription(data.profile.description)
          setCategories(data.profile.categories)
          setServiceAreas(data.profile.serviceAreas)
          setHourlyRate(data.profile.hourlyRateCents ? String(data.profile.hourlyRateCents / 100) : '')
        }
      })
      .catch(() => {})
  }, [])

  function toggleCategory(cat: string) {
    setCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat])
  }

  function toggleArea(area: string) {
    setServiceAreas((prev) => prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area])
  }

  function handleSave() {
    setError(null)
    if (!headline.trim() || !description.trim() || categories.length === 0) {
      setError('Headline, description, and at least one category are required.')
      return
    }
    startTransition(async () => {
      try {
        await updateSpProfile({
          companyId,
          headline,
          description,
          categories,
          serviceAreas,
          hourlyRateCents: hourlyRate ? Number(hourlyRate) : undefined,
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save profile.')
      }
    })
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Profile</h2>
        <p className="text-sm text-ink-500">How contractors see you on the platform.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-700">Headline</label>
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g., Structural & Civil Engineering for Solar PV"
            className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Describe your firm, experience, registrations, and specialisations…"
            className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 resize-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-700">Hourly rate (ZAR)</label>
          <input
            type="number"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            placeholder="1500"
            className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-ink-700">Service categories</label>
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => toggleCategory(cat.value)}
                className={`h-7 px-3 rounded-full text-xs font-medium border transition-colors ${
                  categories.includes(cat.value)
                    ? 'bg-ink-900 text-white border-ink-900'
                    : 'bg-white text-ink-600 border-ink-200 hover:border-ink-400'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-ink-700">Service areas</label>
          <div className="flex flex-wrap gap-2">
            {SA_PROVINCES.map((area) => (
              <button
                key={area}
                onClick={() => toggleArea(area)}
                className={`h-7 px-3 rounded-full text-xs font-medium border transition-colors ${
                  serviceAreas.includes(area)
                    ? 'bg-ink-900 text-white border-ink-900'
                    : 'bg-white text-ink-600 border-ink-200 hover:border-ink-400'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-danger-600">{error}</p>}

      <button
        onClick={handleSave}
        disabled={isPending}
        className="flex items-center justify-center gap-1.5 h-9 px-4 rounded-md bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {saved ? 'Saved' : 'Save profile'}
      </button>
    </div>
  )
}
