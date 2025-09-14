'use client'

import { Navbar } from '@/components/navbar'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Copy,
  ExternalLink,
  Loader2,
  LogOut,
  Mail,
  Search,
  Settings,
  Sparkles,
  User,
  Wallet,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { formatEther } from 'viem'
import { normalize } from 'viem/ens'
import { useBalance, useEnsAddress } from 'wagmi'

import { isValidEnsName } from '@/lib/ens'

export default function Dashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { authenticated, user, logout } = usePrivy()
  const { wallets, ready } = useWallets()
  const [ethPrice, setEthPrice] = useState<number>(0)
  const [ensName, setEnsName] = useState('')

  // Get the user's primary wallet
  const primaryWallet = wallets[0]

  // Get wallet balance
  const { data: balance } = useBalance({
    address: primaryWallet?.address as `0x${string}`,
  })

  // Fetch ETH price for USD conversion
  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
        )
        const data = await response.json()
        setEthPrice(data.ethereum.usd)
      } catch (error) {
        console.error('Failed to fetch ETH price:', error)
      }
    }

    fetchEthPrice()
  }, [])

  // Handle ENS name from URL params
  useEffect(() => {
    const ensParam = searchParams.get('ens')
    if (ensParam) {
      setEnsName(ensParam)
    }
  }, [searchParams])

  // Redirect if not authenticated (wait for Privy to be ready)
  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/')
    }
  }, [authenticated, ready, router])

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const copyAddress = () => {
    if (primaryWallet?.address) {
      navigator.clipboard.writeText(primaryWallet.address)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const balanceInEth = balance ? parseFloat(formatEther(balance.value)) : 0
  const balanceInUsd = balanceInEth * ethPrice

  // Get email verification status from linkedAccounts
  const getEmailVerificationStatus = () => {
    if (!user?.linkedAccounts) return null

    const emailAccount = user.linkedAccounts.find(
      (account: any) => account.type === 'email'
    )

    if (!emailAccount) return null

    return {
      isVerified: emailAccount.firstVerifiedAt !== null,
      firstVerifiedAt: emailAccount.firstVerifiedAt,
    }
  }

  const emailVerification = getEmailVerificationStatus()

  // ENS checking logic
  const shouldCheck = ensName && isValidEnsName(ensName)
  let normalizedName: string | undefined

  try {
    normalizedName = shouldCheck
      ? normalize(
          ensName.endsWith('.eth')
            ? ensName
            : `${ensName}.eth`
        )
      : undefined
  } catch {
    normalizedName = undefined
  }

  const {
    data: resolvedAddress,
    isLoading,
    error,
  } = useEnsAddress({
    name: normalizedName,
    chainId: 1,
    query: { enabled: !!normalizedName },
  })

  const isAvailable = normalizedName && !isLoading && !error && !resolvedAddress
  const isTaken = normalizedName && !isLoading && !error && !!resolvedAddress

  if (!authenticated || !ready) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />


      {/* Dashboard Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-foreground mb-2 text-3xl font-bold">
            Welcome back!
          </h1>
          <p className="text-muted-foreground">
            Manage your on-chain business and track your progress
          </p>
        </div>

        {/* ENS Search Section */}
        <div className="bg-card border-border rounded-2xl border p-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-2xl">
              <Search className="text-primary h-6 w-6" />
            </div>
            <div>
              <h2 className="text-foreground text-xl font-semibold">
                ENS Name Search
              </h2>
              <p className="text-muted-foreground text-sm">
                Search and register your business name on Ethereum
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Enter your business name"
                value={ensName}
                onChange={(e) =>
                  setEnsName(
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                  )
                }
                className="text-primary border-border focus:ring-primary focus:border-primary placeholder:text-muted-foreground w-full rounded-2xl border bg-white px-6 py-4 pr-16 text-lg transition-all duration-200 focus:ring-2"
              />
              <div className="text-muted-foreground absolute top-1/2 right-4 -translate-y-1/2 font-medium">
                .eth
              </div>
            </div>

            {/* Status Display */}
            {normalizedName && isValidEnsName(ensName) && (
              <div className="animate-in fade-in duration-300">
                {isLoading ? (
                  <div className="text-muted-foreground flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Checking availability on ENS...</span>
                  </div>
                ) : error ? (
                  <div className="bg-destructive/10 border-destructive/20 rounded-2xl border p-4">
                    <div className="text-destructive flex items-center gap-3">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">
                        Error checking availability
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-2 text-sm">
                      Failed to check name availability. Please try again.
                    </p>
                  </div>
                ) : isTaken ? (
                  <div className="bg-destructive/10 border-destructive/20 rounded-2xl border p-4">
                    <div className="text-destructive flex items-center gap-3">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">
                        This name is already taken
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {resolvedAddress && (
                        <p className="text-muted-foreground font-mono text-sm">
                          Owned by: {resolvedAddress.slice(0, 6)}...
                          {resolvedAddress.slice(-4)}
                        </p>
                      )}
                      <p className="text-muted-foreground text-sm">
                        Try adding your industry or location (e.g.,{' '}
                        {ensName}
                        tech, {ensName}dao)
                      </p>
                    </div>
                  </div>
                ) : isAvailable ? (
                  <div className="bg-primary/10 border-primary/20 rounded-2xl border p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-primary flex items-center gap-3">
                        <CheckCircle className="h-5 w-5" />
                        <div>
                          <span className="font-medium">
                            Great! {ensName}.eth is available
                          </span>
                          <p className="text-muted-foreground mt-1 text-sm">
                            Claim it now before someone else does
                          </p>
                        </div>
                      </div>
                      <button className="bg-primary text-primary-foreground hover:bg-primary/90 flex cursor-pointer items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-200 hover:text-white">
                        Register Name
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Validation Message */}
            {ensName.length > 0 && !isValidEnsName(ensName) && (
              <div className="animate-in fade-in duration-300">
                <div className="bg-muted/10 border-muted/20 rounded-2xl border p-4">
                  <div className="text-muted-foreground flex items-center gap-3">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Invalid name format</span>
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Name must be 3-63 characters, contain only letters,
                    numbers, and hyphens
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* User Info Card */}
          <div className="lg:col-span-2">
            <div className="bg-card border-border rounded-2xl border p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-2xl">
                  <User className="text-primary h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-foreground text-xl font-semibold">
                    Account Information
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Your profile and authentication details
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Email */}
                {user?.email?.address && (
                  <div className="flex items-center justify-between p-4 bg-background rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Mail className="text-muted-foreground h-5 w-5" />
                      <div>
                        <p className="text-foreground font-medium">Email</p>
                        <p className="text-muted-foreground text-sm">
                          {user.email.address}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {emailVerification?.isVerified ? (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                          ⚠ Unverified
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Wallet */}
                {primaryWallet && (
                  <div className="flex items-center justify-between p-4 bg-background rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Wallet className="text-muted-foreground h-5 w-5" />
                      <div>
                        <p className="text-foreground font-medium">
                          {primaryWallet.walletClientType === 'privy'
                            ? 'Embedded Wallet'
                            : 'Connected Wallet'}
                        </p>
                        <p className="text-muted-foreground font-mono text-sm">
                          {formatAddress(primaryWallet.address)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={copyAddress}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <a
                        href={`https://etherscan.io/address/${primaryWallet.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                )}

                {/* User ID */}
                <div className="flex items-center justify-between p-4 bg-background rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Settings className="text-muted-foreground h-5 w-5" />
                    <div>
                      <p className="text-foreground font-medium">User ID</p>
                      <p className="text-muted-foreground font-mono text-sm">
                        {user?.id?.slice(0, 20)}...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Wallet Balance Card */}
          <div className="space-y-6">
            <div className="bg-card border-border rounded-2xl border p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-2xl">
                  <Wallet className="text-primary h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-foreground text-xl font-semibold">
                    Wallet Balance
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Your current holdings
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-center p-6 bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl">
                  <div className="text-3xl font-bold text-foreground mb-2">
                    ${balanceInUsd.toFixed(2)}
                  </div>
                  <div className="text-muted-foreground">
                    {balanceInEth.toFixed(6)} ETH
                  </div>
                  {ethPrice > 0 && (
                    <div className="text-muted-foreground mt-2 text-xs">
                      ETH @ ${ethPrice.toFixed(2)}
                    </div>
                  )}
                </div>

                {balance && balance.value === BigInt(0) && (
                  <div className="bg-accent/10 border-accent/20 rounded-2xl border p-4 text-center">
                    <p className="text-accent font-medium">Get started!</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Fund your wallet to start building on-chain
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card border-border rounded-2xl border p-6">
              <h3 className="text-foreground mb-4 font-semibold">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    const ensInput = document.querySelector('input[placeholder="Enter your business name"]') as HTMLInputElement
                    if (ensInput) {
                      ensInput.focus()
                      ensInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-2xl px-4 py-3 font-medium transition-colors"
                >
                  Register ENS Name
                </button>
                <button className="border-border text-foreground hover:bg-card/50 w-full rounded-2xl border px-4 py-3 font-medium transition-colors">
                  Create Company
                </button>
                <button className="border-border text-foreground hover:bg-card/50 w-full rounded-2xl border px-4 py-3 font-medium transition-colors">
                  Fund Wallet
                </button>
                <button
                  onClick={handleLogout}
                  className="border-red-500/20 text-red-500 hover:bg-red-500/10 w-full rounded-2xl border px-4 py-3 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
