'use client'

import { CalendarClock, Clock, Palette, Users } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'

type TabId = 'identity' | 'team' | 'history' | 'renewal'

type TabDefinition = {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const TABS: TabDefinition[] = [
  { id: 'identity', label: 'Identity', icon: Palette },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'renewal', label: 'Renewal', icon: CalendarClock },
]

type ManagementTabsProps = {
  identityContent: React.ReactNode
  teamContent: React.ReactNode
  historyContent: React.ReactNode
  renewalContent: React.ReactNode
}

export function ManagementTabs({
  identityContent,
  teamContent,
  historyContent,
  renewalContent,
}: ManagementTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('identity')

  const contentMap: Record<TabId, React.ReactNode> = {
    identity: identityContent,
    team: teamContent,
    history: historyContent,
    renewal: renewalContent,
  }

  return (
    <div>
      <div
        className="bg-muted/40 scrollbar-none flex gap-1 overflow-x-auto rounded-xl p-1"
        role="tablist"
        aria-label="Management sections"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors motion-reduce:transition-none ${
                isActive
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="mt-4">
        {TABS.map((tab) => (
          <motion.div
            key={tab.id}
            role="tabpanel"
            id={`panel-${tab.id}`}
            aria-labelledby={`tab-${tab.id}`}
            animate={{ opacity: activeTab === tab.id ? 1 : 0 }}
            transition={{ duration: 0.15 }}
            className={
              activeTab === tab.id ? 'block' : 'pointer-events-none hidden'
            }
          >
            {contentMap[tab.id]}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
