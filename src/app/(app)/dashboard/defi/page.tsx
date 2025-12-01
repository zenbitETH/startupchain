import {
  ArrowLeftRight,
  Banknote,
  Clock,
  LineChart,
  PiggyBank,
  Repeat,
  TrendingUp,
} from 'lucide-react'

import { DashboardHeader } from '@/app/(app)/dashboard/components/dashboard-header'

const defiFeatures = [
  {
    icon: ArrowLeftRight,
    title: 'Token Swaps',
    description: 'Swap tokens directly from your Safe treasury',
  },
  {
    icon: TrendingUp,
    title: 'Yield Strategies',
    description: 'Earn yield on idle treasury assets',
  },
  {
    icon: PiggyBank,
    title: 'Lending & Borrowing',
    description: 'Access DeFi lending protocols',
  },
  {
    icon: Repeat,
    title: 'Recurring Payments',
    description: 'Set up automated payroll and subscriptions',
  },
]

export default function DeFiDashboardPage() {
  return (
    <div className="bg-background text-foreground">
      <DashboardHeader title="DeFi Rails" />

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-6 pb-12 md:px-6">
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-sm">
            Connect your company treasury to DeFi protocols for payments, yield,
            and financial operations.
          </p>
        </div>

        {/* Coming Soon Banner */}
        <section className="bg-card border-border rounded-2xl border p-8 text-center shadow-sm">
          <div className="bg-primary/10 mx-auto w-fit rounded-full p-4">
            <Clock className="text-primary h-8 w-8" />
          </div>
          <h2 className="text-foreground mt-4 text-xl font-semibold">
            Coming Soon
          </h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-lg">
            DeFi Rails will enable your company to access decentralized finance
            directly from your Safe treasury. Swap tokens, earn yield, and
            automate payments — all with multisig security.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <LineChart className="text-primary h-4 w-4" />
            <span className="text-muted-foreground text-sm">
              Integrated with leading DeFi protocols
            </span>
          </div>
        </section>

        {/* Planned Features */}
        <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
          <h3 className="text-foreground text-lg font-semibold">
            Planned Features
          </h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Treasury management tools powered by DeFi
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {defiFeatures.map((feature) => (
              <div
                key={feature.title}
                className="bg-muted/40 border-border/70 rounded-xl border p-4"
              >
                <feature.icon className="text-primary h-5 w-5" />
                <p className="text-foreground mt-2 font-medium">
                  {feature.title}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
          <h3 className="text-foreground text-lg font-semibold">
            Why DeFi Rails?
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-foreground font-medium">
                🔐 Multisig Security
              </p>
              <p className="text-muted-foreground text-sm">
                All transactions require Safe approval
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-foreground font-medium">
                <Banknote className="mr-1 inline h-4 w-4" />
                No Intermediaries
              </p>
              <p className="text-muted-foreground text-sm">
                Direct access to DeFi without custodians
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-foreground font-medium">📊 Transparency</p>
              <p className="text-muted-foreground text-sm">
                All transactions are on-chain and auditable
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-foreground font-medium">⚡ Efficiency</p>
              <p className="text-muted-foreground text-sm">
                24/7 operations, instant settlement
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
