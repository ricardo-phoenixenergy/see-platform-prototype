import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'

type NewsItem = {
  id: string
  title: string
  summary: string
  source: string
  category: string
  publishedAt: Date
}

type Props = { items: NewsItem[] }

export function NewsfeedSidebar({ items }: Props) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>SA Energy newsfeed</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-ink-100">
          {items.map(item => (
            <li key={item.id} className="py-3 first:pt-0 last:pb-0 group">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-[10px] font-medium uppercase tracking-widest text-ink-400">
                  {item.category}
                </span>
                <span className="text-[10px] text-ink-300 flex-shrink-0">
                  {formatDate(item.publishedAt)}
                </span>
              </div>
              <p className="text-sm font-medium text-ink-900 leading-snug group-hover:text-accent-600 transition-colors cursor-default">
                {item.title}
              </p>
              <p className="text-xs text-ink-500 mt-1 leading-relaxed line-clamp-2">
                {item.summary}
              </p>
              <p className="text-[10px] text-ink-400 mt-1">{item.source}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
