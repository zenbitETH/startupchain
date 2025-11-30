import {
  Coins,
  ExternalLink,
  Info,
  PieChart,
  Rocket,
  Users,
} from 'lucide-react'
import { cookies } from 'next/headers'
import Link from 'next/link'

import { DashboardHeader } from '@/app/(app)/dashboard/components/dashboard-header'
import { Button } from '@/components/ui/button'
import { getServerSession } from '@/lib/auth/server-session'
import { getCompanyByFounderWallet } from '@/lib/blockchain/get-company'
import { STARTUPCHAIN_CHAIN_ID } from '@/lib/blockchain/startupchain-config'

const explorerBase =
  STARTUPCHAIN_CHAIN_ID === 1
    ? 'https://etherscan.io'
    : 'https://sepolia.etherscan.io'

export default async function TokensDashboardPage() {
  const cookieStore = await cookies()
  const session = await getServerSession({ cookies: cookieStore })
  const walletAddress = session?.walletAddress

  // Get company data
  const company = walletAddress
    ? await getCompanyByFounderWallet(walletAddress)
    : null

  // TODO: Check if company token is deployed
  // For now, we show the empty state with deploy CTA
  const hasToken = false
  const tokenAddress: string | null = null

  return (
    <div className="bg-background text-foreground">
      <DashboardHeader title="Company Tokens" />

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-6 pb-12 md:px-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-muted-foreground mt-1 text-sm">
              Deploy and manage your company&apos;s ERC-20 token with vesting
              schedules and transfer controls.
            </p>
          </div>
        </div>

        {!company ? (
          <section className="bg-card border-border rounded-2xl border p-8 text-center shadow-sm">
            <Coins className="text-muted-foreground mx-auto h-12 w-12" />
            <h2 className="text-foreground mt-4 text-xl font-semibold">
              No Company Found
            </h2>
            <p className="text-muted-foreground mx-auto mt-2 max-w-md">
              Register your company first before deploying a company token.
            </p>
            <Link href="/dashboard/setup">
              <Button className="mt-6">Register Company</Button>
            </Link>
          </section>
        ) : !hasToken ? (
          <>
            {/* Empty State - Deploy Token CTA */}
            <section className="bg-card border-border rounded-2xl border p-8 text-center shadow-sm">
              <div className="bg-primary/10 mx-auto w-fit rounded-full p-4">
                <Rocket className="text-primary h-8 w-8" />
              </div>
              <h2 className="text-foreground mt-4 text-xl font-semibold">
                Deploy Your Company Token
              </h2>
              <p className="text-muted-foreground mx-auto mt-2 max-w-lg">
                Create an ERC-20 token for {company.ensName} with built-in
                vesting schedules, transfer restrictions, and role-based access
                control. Your Safe will be set as the token admin.
              </p>
              <Button className="mt-6" disabled>
                <Rocket className="mr-2 h-4 w-4" />
                Deploy Token (Coming Soon)
              </Button>
              <p className="text-muted-foreground mt-3 text-xs">
                Token deployment requires a small gas fee paid from your Safe
              </p>
            </section>

            {/* Cap Table Preview */}
            <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <PieChart className="text-primary h-5 w-5" />
                <h3 className="text-foreground text-lg font-semibold">
                  Cap Table Preview
                </h3>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                Based on founder equity from your company registration
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {/* Founders List */}
                <div className="space-y-3">
                  {company.founders.map((founder, index) => {
                    // Generate colors based on index
                    const colors = [
                      'bg-primary',
                      'bg-blue-500',
                      'bg-green-500',
                      'bg-amber-500',
                      'bg-purple-500',
                    ]
                    const color = colors[index % colors.length]

                    return (
                      <div
                        key={founder.wallet}
                        className="bg-muted/40 border-border/70 flex items-center justify-between rounded-xl border p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-3 w-3 rounded-full ${color}`} />
                          <div>
                            <p className="font-mono text-sm">
                              {founder.wallet.slice(0, 6)}...
                              {founder.wallet.slice(-4)}
                            </p>
                            {founder.role && (
                              <p className="text-muted-foreground text-xs">
                                {founder.role}
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="text-foreground font-semibold">
                          {founder.equityPercent.toFixed(1)}%
                        </p>
                      </div>
                    )
                  })}
                </div>

                {/* Visual Pie Chart Placeholder */}
                <div className="flex items-center justify-center">
                  <div className="relative h-48 w-48">
                    <svg
                      viewBox="0 0 100 100"
                      className="h-full w-full -rotate-90"
                    >
                      {
                        company.founders.reduce(
                          (acc, founder, index) => {
                            const colors = [
                              '#0ea5e9', // primary
                              '#3b82f6', // blue
                              '#22c55e', // green
                              '#f59e0b', // amber
                              '#a855f7', // purple
                            ]
                            const color = colors[index % colors.length]
                            const percentage = founder.equityPercent
                            const circumference = 2 * Math.PI * 40
                            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
                            const rotation = acc.offset

                            acc.elements.push(
                              <circle
                                key={founder.wallet}
                                cx="50"
                                cy="50"
                                r="40"
                                fill="transparent"
                                stroke={color}
                                strokeWidth="20"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={-rotation}
                                className="transition-all duration-500"
                              />
                            )

                            acc.offset += (percentage / 100) * circumference
                            return acc
                          },
                          { elements: [] as JSX.Element[], offset: 0 }
                        ).elements
                      }
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-foreground text-2xl font-bold">
                          {company.founders.length}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Founder{company.founders.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Token Features */}
            <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Info className="text-primary h-5 w-5" />
                <h3 className="text-foreground text-lg font-semibold">
                  Token Features
                </h3>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-muted/40 border-border/70 rounded-xl border p-4">
                  <Users className="text-primary h-5 w-5" />
                  <p className="text-foreground mt-2 font-medium">
                    Role-Based Access
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Admin, Minter, and Burner roles controlled by your Safe
                  </p>
                </div>
                <div className="bg-muted/40 border-border/70 rounded-xl border p-4">
                  <PieChart className="text-primary h-5 w-5" />
                  <p className="text-foreground mt-2 font-medium">
                    Vesting Schedules
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Built-in cliff and linear vesting for founder tokens
                  </p>
                </div>
                <div className="bg-muted/40 border-border/70 rounded-xl border p-4">
                  <Coins className="text-primary h-5 w-5" />
                  <p className="text-foreground mt-2 font-medium">
                    Transfer Controls
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Disable transfers or whitelist specific addresses
                  </p>
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            {/* Token Deployed State */}
            <div className="grid gap-4 md:grid-cols-3">
              <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
                <p className="text-muted-foreground text-sm">Token Name</p>
                <p className="text-foreground mt-1 text-2xl font-bold">
                  {company.ensName.replace('.eth', '')} Token
                </p>
              </section>
              <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
                <p className="text-muted-foreground text-sm">Symbol</p>
                <p className="text-foreground mt-1 text-2xl font-bold">
                  $
                  {company.ensName
                    .replace('.eth', '')
                    .toUpperCase()
                    .slice(0, 4)}
                </p>
              </section>
              <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
                <p className="text-muted-foreground text-sm">Total Supply</p>
                <p className="text-foreground mt-1 text-2xl font-bold">
                  1,000,000
                </p>
              </section>
            </div>

            {tokenAddress && (
              <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Contract Address
                    </p>
                    <p className="font-mono text-sm">{tokenAddress}</p>
                  </div>
                  <a
                    href={`${explorerBase}/token/${tokenAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
                  >
                    View on Explorer <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
