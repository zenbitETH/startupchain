import { ListChecks } from 'lucide-react'

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

function formatDate(value?: Date) {
  if (!value) return 'Pending'
  return value.toLocaleString()
}

export function RegistrationStatusCard({
  latestEvent,
  pending,
}: RegistrationStatusCardProps) {
  return (
    <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <ListChecks className="text-primary h-5 w-5" />
        <h3 className="text-foreground text-lg font-semibold">
          Registration status
        </h3>
      </div>
      {latestEvent ? (
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">ENS</span>
            <span className="font-semibold">{latestEvent.ensName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Block</span>
            <span className="font-mono">
              {latestEvent.blockNumber.toString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Registered</span>
            <span>{formatDate(latestEvent.createdAt)}</span>
          </div>
        </div>
      ) : pending?.status === 'completed' ? (
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">ENS</span>
            <span className="font-semibold">{pending.ensName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className="text-primary font-semibold">Completed</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Registered</span>
            <span>{formatDate(new Date(pending.updatedAt))}</span>
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground mt-4 text-sm">
          No registration logs yet. Complete a registration to see history
          here.
        </p>
      )}
    </section>
  )
}
