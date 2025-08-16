'use client'

import { usePrivy, useWallets } from '@privy-io/react-auth'
import {
  Copy,
  ExternalLink,
  LogOut,
  Mail,
  Settings,
  Sparkles,
  User,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { formatEther } from 'viem'
import { useBalance } from 'wagmi'

export default function Dashboard() {
  const router = useRouter()
  const { authenticated, user, logout } = usePrivy()
  const { wallets, ready } = useWallets()
  const [ethPrice, setEthPrice] = useState<number>(0)

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

  // Redirect if not authenticated
  useEffect(() => {
    if (!authenticated) {
      router.push('/')
    }
  }, [authenticated, router])

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

  if (!authenticated || !ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Navigation */}
      <nav className="border-border/40 bg-background/80 relative z-50 border-b backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="from-primary to-accent flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br">
                <Sparkles className="text-primary-foreground h-5 w-5" />
              </div>
              <span className="text-foreground text-xl font-bold tracking-tight">
                StartupChain
              </span>
            </Link>
            <button
              onClick={handleLogout}
              className="border-border text-foreground hover:bg-card flex items-center gap-2 rounded-lg border px-4 py-2 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-foreground text-3xl font-bold mb-2">
            Welcome back!
          </h1>
          <p className="text-muted-foreground">
            Manage your on-chain business and track your progress
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* User Info Card */}
          <div className="lg:col-span-2">
            <div className="bg-card border-border rounded-2xl border p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
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
                  <div className="flex items-center justify-between p-4 bg-background rounded-lg">
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
                      {user.email.verified && (
                        <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Wallet */}
                {primaryWallet && (
                  <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                    <div className="flex items-center gap-3">
                      <Wallet className="text-muted-foreground h-5 w-5" />
                      <div>
                        <p className="text-foreground font-medium">
                          {primaryWallet.walletClientType === 'privy' 
                            ? 'Embedded Wallet' 
                            : 'Connected Wallet'}
                        </p>
                        <p className="text-muted-foreground text-sm font-mono">
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
                <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                  <div className="flex items-center gap-3">
                    <Settings className="text-muted-foreground h-5 w-5" />
                    <div>
                      <p className="text-foreground font-medium">User ID</p>
                      <p className="text-muted-foreground text-sm font-mono">
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
                <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
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
                <div className="text-center p-6 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl">
                  <div className="text-3xl font-bold text-foreground mb-2">
                    ${balanceInUsd.toFixed(2)}
                  </div>
                  <div className="text-muted-foreground">
                    {balanceInEth.toFixed(6)} ETH
                  </div>
                  {ethPrice > 0 && (
                    <div className="text-muted-foreground text-xs mt-2">
                      ETH @ ${ethPrice.toFixed(2)}
                    </div>
                  )}
                </div>

                {balance && balance.value === 0n && (
                  <div className="bg-accent/10 border-accent/20 rounded-lg border p-4 text-center">
                    <p className="text-accent font-medium">Get started!</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Fund your wallet to start building on-chain
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card border-border rounded-2xl border p-6">
              <h3 className="text-foreground font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-lg px-4 py-3 font-medium transition-colors">
                  Register ENS Name
                </button>
                <button className="border-border text-foreground hover:bg-card/50 w-full rounded-lg border px-4 py-3 font-medium transition-colors">
                  Create Company
                </button>
                <button className="border-border text-foreground hover:bg-card/50 w-full rounded-lg border px-4 py-3 font-medium transition-colors">
                  Fund Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}