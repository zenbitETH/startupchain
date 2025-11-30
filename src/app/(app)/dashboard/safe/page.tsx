import {
  ArrowUpRight,
  BadgeCheck,
  Clock,
  ExternalLink,
  Info,
  Shield,
  Users,
  Wallet,
} from 'lucide-react'
import { cookies } from 'next/headers'
import Link from 'next/link'

import { DashboardHeader } from '@/app/(app)/dashboard/components/dashboard-header'
import { Button } from '@/components/ui/button'
import { getServerSession } from '@/lib/auth/server-session'
import { getCompanyByFounderWallet } from '@/lib/blockchain/get-company'
import { getSafeDashboardData } from '@/lib/blockchain/safe-api'
import { STARTUPCHAIN_CHAIN_ID } from '@/lib/blockchain/startupchain-config'
import { shortenAddress } from '@/lib/utils'

const explorerBase =
  STARTUPCHAIN_CHAIN_ID === 1
    ? 'https://etherscan.io'
    : 'https://sepolia.etherscan.io'

function formatEth(weiString: string): string {
  const wei = BigInt(weiString)
  const eth = Number(wei) / 1e18
  return eth.toFixed(4)
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Pending'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function SafeDashboardPage() {
  const cookieStore = await cookies()
  const session = await getServerSession({ cookies: cookieStore })
  const walletAddress = session?.walletAddress

  // Get company data to find Safe address
  const company = walletAddress
    ? await getCompanyByFounderWallet(walletAddress)
    : null

  const safeAddress = company?.safeAddress

  // Fetch Safe data if we have a Safe address
  const safeData = safeAddress
    ? await getSafeDashboardData(safeAddress, STARTUPCHAIN_CHAIN_ID)
    : null

  return (
    <div className="bg-background text-foreground">
      <DashboardHeader title="Multichain Safe" />

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-6 pb-12 md:px-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage your company&apos;s multisig treasury. View balances,
              owners, and pending transactions.
            </p>
          </div>
          {safeData?.safeWalletUrl && (
            <a
              href={safeData.safeWalletUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition"
            >
              Open Safe{'{Wallet}'}
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>

        {!safeAddress ? (
          <section className="bg-card border-border rounded-2xl border p-8 text-center shadow-sm">
            <Shield className="text-muted-foreground mx-auto h-12 w-12" />
            <h2 className="text-foreground mt-4 text-xl font-semibold">
              No Safe Found
            </h2>
            <p className="text-muted-foreground mx-auto mt-2 max-w-md">
              Register your company first to deploy a Safe multisig wallet. Your
              Safe will be used to manage your company treasury.
            </p>
            <Link href="/dashboard/setup">
              <Button className="mt-6">Register Company</Button>
            </Link>
          </section>
        ) : !safeData?.info ? (
          <section className="bg-card border-border rounded-2xl border p-8 text-center shadow-sm">
            <Info className="text-muted-foreground mx-auto h-12 w-12" />
            <h2 className="text-foreground mt-4 text-xl font-semibold">
              Safe Not Indexed Yet
            </h2>
            <p className="text-muted-foreground mx-auto mt-2 max-w-md">
              Your Safe at{' '}
              <span className="font-mono text-sm">
                {shortenAddress(safeAddress)}
              </span>{' '}
              hasn&apos;t been indexed by the Safe Transaction Service yet. This
              usually takes a few minutes after deployment.
            </p>
            <a
              href={`${explorerBase}/address/${safeAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary mt-4 inline-flex items-center gap-1 text-sm hover:underline"
            >
              View on Explorer <ExternalLink className="h-3 w-3" />
            </a>
          </section>
        ) : (
          <>
            {/* Safe Overview */}
            <div className="grid gap-4 md:grid-cols-3">
              {/* Balance Card */}
              <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <Wallet className="text-primary h-5 w-5" />
                  <p className="text-muted-foreground text-sm">Total Balance</p>
                </div>
                <p className="text-foreground mt-2 text-3xl font-bold">
                  {formatEth(safeData.ethBalanceWei)} ETH
                </p>
                {safeData.tokenBalances.length > 0 && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    + {safeData.tokenBalances.length} token(s)
                  </p>
                )}
              </section>

              {/* Threshold Card */}
              <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <Shield className="text-primary h-5 w-5" />
                  <p className="text-muted-foreground text-sm">Threshold</p>
                </div>
                <p className="text-foreground mt-2 text-3xl font-bold">
                  {safeData.info.threshold} of {safeData.info.owners.length}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  signatures required
                </p>
              </section>

              {/* Pending Txs Card */}
              <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <Clock className="text-primary h-5 w-5" />
                  <p className="text-muted-foreground text-sm">Pending</p>
                </div>
                <p className="text-foreground mt-2 text-3xl font-bold">
                  {safeData.pendingTransactions.length}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  transactions awaiting signatures
                </p>
              </section>
            </div>

            {/* Owners Section */}
            <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users className="text-primary h-5 w-5" />
                  <h3 className="text-foreground text-lg font-semibold">
                    Safe Owners
                  </h3>
                </div>
                <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium">
                  {safeData.info.owners.length} owner(s)
                </span>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {safeData.info.owners.map((owner, index) => (
                  <div
                    key={owner}
                    className="bg-muted/40 border-border/70 flex items-center justify-between rounded-xl border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold">
                        {index + 1}
                      </div>
                      <span className="font-mono text-sm">
                        {shortenAddress(owner as `0x${string}`)}
                      </span>
                    </div>
                    <a
                      href={`${explorerBase}/address/${owner}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            </section>

            {/* Pending Transactions */}
            {safeData.pendingTransactions.length > 0 && (
              <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className="text-primary h-5 w-5" />
                    <h3 className="text-foreground text-lg font-semibold">
                      Pending Transactions
                    </h3>
                  </div>
                  <a
                    href={safeData.safeWalletUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
                  >
                    Sign in Safe{'{Wallet}'}{' '}
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                </div>
                <div className="mt-4 space-y-3">
                  {safeData.pendingTransactions.map((tx) => (
                    <div
                      key={tx.safeTxHash}
                      className="bg-muted/40 border-border/70 rounded-xl border p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-foreground text-sm font-medium">
                            Transfer to {shortenAddress(tx.to as `0x${string}`)}
                          </p>
                          <p className="text-muted-foreground mt-1 text-xs">
                            {formatEth(tx.value)} ETH • Nonce #{tx.nonce}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-600">
                            {tx.confirmations.length}/{tx.confirmationsRequired}{' '}
                            signed
                          </span>
                          <p className="text-muted-foreground mt-1 text-xs">
                            {formatDate(tx.submissionDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Transaction History */}
            <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="text-primary h-5 w-5" />
                  <h3 className="text-foreground text-lg font-semibold">
                    Recent Transactions
                  </h3>
                </div>
                <a
                  href={safeData.safeWalletUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
                >
                  View all <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>
              {safeData.transactionHistory.length === 0 ? (
                <p className="text-muted-foreground mt-4 text-sm">
                  No transactions yet. Fund your Safe to get started.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {safeData.transactionHistory.map((tx, idx) => (
                    <div
                      key={tx.safeTxHash ?? tx.txHash ?? idx}
                      className="bg-muted/40 border-border/70 flex items-center justify-between rounded-xl border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            tx.isSuccessful === false
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {tx.isSuccessful === false ? (
                            <Info className="h-4 w-4" />
                          ) : (
                            <BadgeCheck className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-foreground text-sm font-medium">
                            {tx.txType === 'ETHEREUM_TRANSACTION'
                              ? 'Incoming transfer'
                              : `To ${shortenAddress(tx.to as `0x${string}`)}`}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {formatEth(tx.value)} ETH
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground text-xs">
                          {formatDate(tx.executionDate ?? tx.submissionDate)}
                        </p>
                        {(tx.txHash || tx.safeTxHash) && (
                          <a
                            href={`${explorerBase}/tx/${tx.txHash ?? tx.safeTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
                          >
                            View <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Token Balances */}
            {safeData.tokenBalances.length > 0 && (
              <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <Wallet className="text-primary h-5 w-5" />
                  <h3 className="text-foreground text-lg font-semibold">
                    Token Balances
                  </h3>
                </div>
                <div className="mt-4 space-y-2">
                  {safeData.tokenBalances.map((token) => (
                    <div
                      key={token.tokenAddress}
                      className="bg-muted/40 border-border/70 flex items-center justify-between rounded-xl border p-4"
                    >
                      <div className="flex items-center gap-3">
                        {token.token?.logoUri && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={token.token.logoUri}
                            alt={token.token.symbol}
                            className="h-8 w-8 rounded-full"
                          />
                        )}
                        <div>
                          <p className="text-foreground text-sm font-medium">
                            {token.token?.name ?? 'Unknown Token'}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {token.token?.symbol ?? '???'}
                          </p>
                        </div>
                      </div>
                      <p className="text-foreground font-mono text-sm">
                        {(
                          Number(token.balance) /
                          10 ** (token.token?.decimals ?? 18)
                        ).toFixed(4)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Safe Details */}
            <section className="bg-card border-border rounded-2xl border p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Info className="text-primary h-5 w-5" />
                <h3 className="text-foreground text-lg font-semibold">
                  Safe Details
                </h3>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="bg-muted/40 border-border/70 rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">Address</p>
                  <p className="font-mono text-sm break-all">{safeAddress}</p>
                </div>
                <div className="bg-muted/40 border-border/70 rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">Version</p>
                  <p className="text-sm">{safeData.info.version}</p>
                </div>
                <div className="bg-muted/40 border-border/70 rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">Nonce</p>
                  <p className="text-sm">{safeData.info.nonce}</p>
                </div>
                <div className="bg-muted/40 border-border/70 rounded-xl border p-4">
                  <p className="text-muted-foreground text-xs">Company ENS</p>
                  <p className="text-sm">{company?.ensName ?? 'N/A'}</p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
