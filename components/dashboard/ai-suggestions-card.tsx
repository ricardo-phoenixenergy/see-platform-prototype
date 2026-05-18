import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'

const SUGGESTIONS = [
  {
    id: '1',
    text: 'Project Alpha has a milestone under review for 3 days. Follow up with admin.',
    priority: 'high',
  },
  {
    id: '2',
    text: 'Durbanville Mall EIA submission is due in 14 days. Start preparing documentation.',
    priority: 'medium',
  },
  {
    id: '3',
    text: 'You are 5 compliant projects away from Gold tier. Accelerate 2 active projects.',
    priority: 'low',
  },
] as const

export function AiSuggestionsCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent-500" strokeWidth={1.5} />
          <CardTitle>SEE.AI insights</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {SUGGESTIONS.map(s => (
            <li key={s.id} className="flex gap-3">
              <div className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                s.priority === 'high' ? 'bg-danger-500' :
                s.priority === 'medium' ? 'bg-warning-500' : 'bg-ink-300'
              }`} />
              <p className="text-sm text-ink-600 leading-relaxed">{s.text}</p>
            </li>
          ))}
        </ul>
        <p className="text-xs text-ink-400 mt-4">Powered by SEE.AI — full assistant available in Phase 6</p>
      </CardContent>
    </Card>
  )
}
