import { formatDate } from '../utils'

interface LatestEvent {
  ensName: string
  blockNumber: bigint
  createdAt?: Date
}

interface PendingRegistration {
  ensName: string
  status: string
  updatedAt: number
}

interface RegistrationStatusCardProps {
  latestEvent: LatestEvent | null
  pending: PendingRegistration | null
}

export function RegistrationStatusInline({
  latestEvent,
  pending,
}: RegistrationStatusCardProps) {
  if (!latestEvent && (!pending || pending.status !== 'completed')) {
    return null
  }

  const items: { label: string; value: string; mono?: boolean }[] = []

  if (latestEvent) {
    items.push({ label: 'ENS', value: latestEvent.ensName })
    items.push({
      label: 'Block',
      value: latestEvent.blockNumber.toString(),
      mono: true,
    })
    items.push({
      label: 'Registered',
      value: formatDate(latestEvent.createdAt),
    })
  } else if (pending?.status === 'completed') {
    items.push({ label: 'ENS', value: pending.ensName })
    items.push({ label: 'Status', value: 'Completed' })
    items.push({
      label: 'Registered',
      value: formatDate(new Date(pending.updatedAt)),
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-6">
      {items.map((item, idx) => (
        <div key={item.label} className="flex items-center gap-6">
          {idx > 0 && (
            <div
              className="bg-border/70 hidden h-4 w-px sm:block"
              aria-hidden="true"
            />
          )}
          <div>
            <p className="text-muted-foreground text-xs">{item.label}</p>
            <p
              className={`text-sm font-semibold ${item.mono ? 'font-mono' : ''}`}
            >
              {item.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
