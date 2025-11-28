import { AlertTriangle, BadgeCheck, Link2, Shield } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { MockBadge } from './mock-badge'

type ActivityItem = {
  id: string
  title: string
  description: string
  timestamp: string
  tone: 'info' | 'success' | 'warning'
}

const toneStyles: Record<ActivityItem['tone'], string> = {
  info: 'text-primary bg-primary/10',
  success: 'text-emerald-500 bg-emerald-500/10',
  warning: 'text-amber-500 bg-amber-500/10',
}

const toneIcon: Record<ActivityItem['tone'], typeof BadgeCheck> = {
  info: Shield,
  success: BadgeCheck,
  warning: AlertTriangle,
}

export function ActivityFeed({ data }: { data: ActivityItem[] }) {
  return (
    <section className="bg-card border-border shadow-sm rounded-2xl border p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-foreground text-lg font-semibold">
            Notifications & Activity
          </h3>
          <p className="text-muted-foreground text-sm">
            Keep up with everything happening on-chain
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MockBadge />
          <Button variant="link" size="sm" className="px-0 text-sm font-semibold">
            View All
            <Link2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ul className="mt-6 space-y-4">
        {data.map((item) => {
          const Icon = toneIcon[item.tone]
          return (
            <li key={item.id} className="flex items-start gap-3 rounded-xl bg-muted/30 p-4">
              <span
                className={`${toneStyles[item.tone]} flex h-9 w-9 items-center justify-center rounded-full`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="space-y-1">
                <p className="text-foreground text-sm font-semibold">{item.title}</p>
                <p className="text-muted-foreground text-sm">{item.description}</p>
                <p className="text-muted-foreground text-xs">{item.timestamp}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
