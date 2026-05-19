'use client'

import { useState, useEffect } from 'react'
import { OmEventForm } from '@/components/client/om-event-form'
import { Plus, CheckCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

type OmEvent = {
  id: string; projectId: string; type: string; title: string
  description: string | null; scheduledAt: string; completedAt: string | null
}

const TYPE_LABEL: Record<string, string> = {
  MAINTENANCE: 'Maintenance', CLEANING: 'Cleaning', INSPECTION: 'Inspection',
  REPAIR: 'Repair', CLIENT_MEETING: 'Meeting', SITE_VISIT: 'Site Visit', ALERT: 'Alert',
}

export default function OmSchedulePage() {
  const [events, setEvents] = useState<OmEvent[]>([])
  const [showForm, setShowForm] = useState(false)
  const [projectId, setProjectId] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  async function load() {
    const res = await fetch('/api/client/om-events')
    if (res.ok) {
      const data = await res.json() as { events: OmEvent[]; projectId: string }
      setEvents(data.events)
      setProjectId(data.projectId)
    }
    setIsLoading(false)
  }

  useEffect(() => { void load() }, [])

  const upcoming = events.filter((e) => new Date(e.scheduledAt) >= new Date() && !e.completedAt)
  const past = events.filter((e) => new Date(e.scheduledAt) < new Date() || e.completedAt)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink-900">O&M Schedule</h2>
          <p className="text-sm text-ink-500">Maintenance history and upcoming events.</p>
        </div>
        {projectId && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            Schedule event
          </button>
        )}
      </div>

      {isLoading && <div className="h-48 rounded-md bg-ink-50 animate-pulse" />}

      {!isLoading && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-400">Upcoming ({upcoming.length})</h3>
            {upcoming.length === 0 && <p className="text-sm text-ink-500 py-3">No upcoming events.</p>}
            {upcoming.map((e) => (
              <div key={e.id} className="flex items-start gap-3 rounded-lg border border-ink-200 bg-white px-4 py-3">
                <Clock className="h-4 w-4 text-accent-500 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-medium text-ink-900">{e.title}</p>
                  <p className="text-xs text-ink-500">
                    {TYPE_LABEL[e.type] ?? e.type} · {new Date(e.scheduledAt).toLocaleDateString('en-ZA')}
                  </p>
                  {e.description && <p className="text-xs text-ink-400 mt-0.5">{e.description}</p>}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-400">History ({past.length})</h3>
            {past.length === 0 && <p className="text-sm text-ink-500 py-3">No past events.</p>}
            {past.map((e) => (
              <div key={e.id} className={cn('flex items-start gap-3 rounded-lg border px-4 py-3', e.completedAt ? 'border-success-500/20 bg-success-50/20' : 'border-ink-100 bg-ink-25')}>
                <CheckCircle className={cn('h-4 w-4 flex-shrink-0 mt-0.5', e.completedAt ? 'text-success-500' : 'text-ink-300')} strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-medium text-ink-900">{e.title}</p>
                  <p className="text-xs text-ink-500">
                    {TYPE_LABEL[e.type] ?? e.type} · {new Date(e.scheduledAt).toLocaleDateString('en-ZA')}
                    {e.completedAt && ` · completed ${new Date(e.completedAt).toLocaleDateString('en-ZA')}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && projectId && (
        <OmEventForm
          projectId={projectId}
          onClose={() => setShowForm(false)}
          onCreated={() => { void load() }}
        />
      )}
    </div>
  )
}
