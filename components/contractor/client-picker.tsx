'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Search, Plus, Building2, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ClientOption = {
  id: string
  name: string
  industry?: string | null
  contactName?: string | null
}

type Props = {
  clients: ClientOption[]
  value: string // clientRecordId
  onChange: (clientId: string, clientName: string) => void
  onClearToManual: () => void
  error?: string
}

export function ClientPicker({ clients, value, onChange, onClearToManual, error }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = clients.find(c => c.id === value)

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.contactName ?? '').toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-accent-500 bg-accent-50 px-4 py-3">
        <div className="h-7 w-7 rounded bg-ink-100 flex items-center justify-center flex-shrink-0">
          <Building2 className="h-3.5 w-3.5 text-ink-500" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink-900 truncate">{selected.name}</p>
          {selected.industry && <p className="text-xs text-ink-500">{selected.industry}</p>}
        </div>
        <button
          type="button"
          onClick={onClearToManual}
          className="text-ink-400 hover:text-ink-700 flex-shrink-0"
          aria-label="Clear client selection"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
    )
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          'w-full flex items-center gap-2 h-10 rounded-md border bg-white px-3 text-sm text-left transition-colors',
          open ? 'border-accent-500 shadow-ring' : 'border-ink-200 hover:border-ink-300',
          error ? 'border-danger-500' : ''
        )}
      >
        <Search className="h-3.5 w-3.5 text-ink-400 flex-shrink-0" strokeWidth={1.5} />
        <span className="flex-1 text-ink-400">Search existing clients…</span>
        <ChevronDown className="h-3.5 w-3.5 text-ink-400 flex-shrink-0" strokeWidth={1.5} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-md border border-ink-200 bg-white shadow-lg z-20 overflow-hidden">
          <div className="p-2 border-b border-ink-100">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Type to search…"
              className="w-full h-8 px-3 text-sm rounded border border-ink-200 focus:border-accent-500 focus:outline-none"
            />
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-xs text-ink-400">No clients match &ldquo;{search}&rdquo;</li>
            )}
            {filtered.map(client => (
              <li key={client.id}>
                <button
                  type="button"
                  onClick={() => { onChange(client.id, client.name); setOpen(false); setSearch('') }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-ink-50 text-left transition-colors"
                >
                  <div className="h-6 w-6 rounded bg-ink-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-3 w-3 text-ink-400" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{client.name}</p>
                    {client.industry && <p className="text-[10px] text-ink-400">{client.industry}</p>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-ink-100 p-2">
            <Link
              href="/contractor/clients/new"
              className="flex items-center gap-2 px-3 py-2 text-sm text-accent-600 hover:bg-accent-50 rounded transition-colors"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              Add new client
            </Link>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-danger-500 mt-1">{error}</p>}
    </div>
  )
}
