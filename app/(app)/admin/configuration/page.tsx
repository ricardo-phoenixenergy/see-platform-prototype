'use client'
// app/(app)/admin/configuration/page.tsx

import { useState } from 'react'
import { Settings, Zap } from 'lucide-react'

export default function ConfigurationPage() {
  const [demoMode, setDemoMode] = useState(false)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Configuration</h2>
        <p className="text-sm text-ink-500">Platform settings and demo controls.</p>
      </div>

      {/* Demo Mode */}
      <div className="rounded-lg border border-ink-200 bg-white p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-ink-900">Demo Mode</h3>
        </div>
        <p className="text-xs text-ink-500">
          When enabled, EFT payments auto-reconcile after 5 seconds, milestone submissions
          auto-approve after 30 seconds, and tier progression can be triggered manually. Use during
          live demos to avoid waiting for admin actions.
        </p>
        <div className="flex items-center justify-between rounded-lg border border-ink-100 bg-ink-25 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-ink-900">Demo Mode</p>
            <p className="text-xs text-ink-400">
              {demoMode ? 'Active — auto-reconciliation enabled' : 'Inactive — production behaviour'}
            </p>
          </div>
          <button
            onClick={() => setDemoMode((v) => !v)}
            className={`relative h-6 w-11 rounded-full transition-colors ${demoMode ? 'bg-accent-500' : 'bg-ink-200'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${demoMode ? 'translate-x-5' : ''}`}
            />
          </button>
        </div>
        {demoMode && (
          <div className="rounded-md bg-accent-500/5 border border-accent-200 px-3 py-2 text-xs text-accent-600">
            Demo Mode is active. EFT reconciliation will complete automatically. Remember to disable before production handoff.
          </div>
        )}
      </div>

      {/* Platform bank account */}
      <div className="rounded-lg border border-ink-200 bg-white p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-ink-900">Platform bank account</h3>
        </div>
        <div className="space-y-2 text-sm">
          {[
            ['Account name', 'SEE Platform Operations (Pty) Ltd'],
            ['Bank', 'First National Bank'],
            ['Account number', '62850012345'],
            ['Branch code', '250655'],
            ['Account type', 'Business Cheque'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span className="text-ink-500">{label}</span>
              <span className="font-medium text-ink-900 font-mono text-xs">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
