import { BadgeCheck, Clock, ExternalLink } from 'lucide-react'

interface CompanyEvent {
  transactionHash: string
  ensName: string
  companyId: string
  blockNumber: bigint
  threshold: number
  createdAt?: Date
}

interface PendingRegistration {
  ensName: string
  status: string
  founders: { wallet: string }[]
  threshold: number
  updatedAt: number
  safeDeploymentTxHash?: string
  registrationTxHash?: string
  companyTxHash?: string
}

interface RegistrationHistoryProps {
  events: CompanyEvent[]
  pending: PendingRegistration | null
  explorerBase: string
}

function formatDate(value?: Date) {
  if (!value) return 'Pending'
  return value.toLocaleString()
}

export function RegistrationHistory({
  events,
  pending,
  explorerBase,
}: RegistrationHistoryProps) {
  const showPendingHistory =
    events.length === 0 && pending?.status === 'completed'

  return (
    <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Clock className="text-primary h-5 w-5" />
        <h3 className="text-foreground text-lg font-semibold">
          Registration history
        </h3>
      </div>

      {events.length === 0 &&
      (!pending || pending.status !== 'completed') ? (
        <p className="text-muted-foreground mt-4 text-sm">
          No on-chain registration events found for this wallet.
        </p>
      ) : events.length > 0 ? (
        <div className="mt-4 space-y-3">
          {events.map((event) => (
            <div
              key={event.transactionHash}
              className="border-border bg-muted/40 rounded-xl border p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="text-primary h-4 w-4" />
                  <div>
                    <p className="text-sm font-semibold">{event.ensName}.eth</p>
                    <p className="text-muted-foreground text-xs">
                      Company #{event.companyId.toString()}
                    </p>
                  </div>
                </div>
                <span className="text-muted-foreground text-xs">
                  {formatDate(event.createdAt)}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 font-mono text-xs">
                <span className="bg-background border-border rounded-full border px-3 py-1">
                  Block {event.blockNumber.toString()}
                </span>
                <a
                  href={`${explorerBase}/tx/${event.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:bg-primary/10 inline-flex items-center gap-1 rounded-full px-3 py-1 transition"
                >
                  Tx {event.transactionHash.slice(0, 10)}…
                  <ExternalLink className="h-3 w-3" />
                </a>
                <span className="text-muted-foreground">
                  Threshold: {event.threshold}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : showPendingHistory && pending ? (
        <div className="mt-4 space-y-3">
          <div className="border-border bg-muted/40 rounded-xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BadgeCheck className="text-primary h-4 w-4" />
                <div>
                  <p className="text-sm font-semibold">{pending.ensName}</p>
                  <p className="text-muted-foreground text-xs">
                    {pending.founders.length} founder(s) • Threshold{' '}
                    {pending.threshold}
                  </p>
                </div>
              </div>
              <span className="text-muted-foreground text-xs">
                {formatDate(new Date(pending.updatedAt))}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 font-mono text-xs">
              {pending.safeDeploymentTxHash && (
                <a
                  href={`${explorerBase}/tx/${pending.safeDeploymentTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:bg-primary/10 inline-flex items-center gap-1 rounded-full px-3 py-1 transition"
                >
                  Safe Deploy {pending.safeDeploymentTxHash.slice(0, 10)}…
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {pending.registrationTxHash && (
                <a
                  href={`${explorerBase}/tx/${pending.registrationTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:bg-primary/10 inline-flex items-center gap-1 rounded-full px-3 py-1 transition"
                >
                  ENS Register {pending.registrationTxHash.slice(0, 10)}…
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {pending.companyTxHash && (
                <a
                  href={`${explorerBase}/tx/${pending.companyTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:bg-primary/10 inline-flex items-center gap-1 rounded-full px-3 py-1 transition"
                >
                  Company Record {pending.companyTxHash.slice(0, 10)}…
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
