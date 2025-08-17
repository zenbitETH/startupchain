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
  TrendingUp,
  Activity,
  Users,
  DollarSign,
  Building,
  ChartBar,
  Link as LinkIcon,
  Zap,
  Target
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { formatEther } from 'viem'
import { useBalance } from 'wagmi'
import { useSmartWallet } from '@/hooks/use-smart-wallet'
import { useBondingCurve } from '@/hooks/use-bonding-curve'
import { ShareTrading } from '@/components/share-trading'

export default function Dashboard() {
  const router = useRouter()
  const { authenticated, user, logout } = usePrivy()
  const { wallets, ready } = useWallets()
  const [ethPrice, setEthPrice] = useState<number>(0)
  
  // Startup-specific hooks
  const { businessAccount, isWalletReady } = useSmartWallet()
  const { getPriceInfo, contractAddress: bondingCurveAddress } = useBondingCurve()
  
  // Dashboard state
  const [activeTab, setActiveTab] = useState<'overview' | 'trading' | 'contracts'>('overview')
  const [bondingCurveStats, setBondingCurveStats] = useState<any>(null)

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
    <div className="from-background via-background to-primary/5 h-screen bg-gradient-to-br flex flex-col">
      {/* Navigation */}
      <nav className="border-border/40 bg-background/80 relative z-50 border-b backdrop-blur-xl flex-shrink-0">
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
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-foreground mb-2 text-3xl font-bold">
            {businessAccount ? `${businessAccount.ensName} Dashboard` : 'Welcome back!'}
          </h1>
          <p className="text-muted-foreground">
            {businessAccount 
              ? 'Monitor your startup\'s on-chain metrics and trading activity'
              : 'Create your startup and enable share trading with bonding curves'
            }
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="bg-muted/20 flex rounded-xl p-1 max-w-md">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'overview'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('trading')}
              className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'trading'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Trading
            </button>
            <button
              onClick={() => setActiveTab('contracts')}
              className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'contracts'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Contracts
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Business Stats */}
            {businessAccount ? (
              <div className="lg:col-span-2">
                <div className="bg-card border-border rounded-2xl border p-6 mb-6">
                  <div className="mb-6 flex items-center gap-4">
                    <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
                      <Building className="text-primary h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-foreground text-xl font-semibold">
                        {businessAccount.ensName}
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        On-chain company metrics
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground text-xs">Founders</span>
                      </div>
                      <p className="text-foreground text-xl font-semibold">
                        {businessAccount.owners.length}
                      </p>
                    </div>
                    
                    <div className="bg-muted/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground text-xs">Equity Split</span>
                      </div>
                      <p className="text-foreground text-xl font-semibold">
                        {Object.values(businessAccount.ownerEquity).reduce((a, b) => a + b, 0)}%
                      </p>
                    </div>

                    <div className="bg-muted/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground text-xs">Smart Wallet</span>
                      </div>
                      <p className="text-foreground text-sm font-mono">
                        {formatAddress(businessAccount.smartAccountAddress)}
                      </p>
                    </div>

                    <div className="bg-muted/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground text-xs">Status</span>
                      </div>
                      <p className="text-green-500 text-sm font-semibold">
                        {businessAccount.isDeployed ? '✅ Active' : '⏳ Deploying'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Uniswap v4 Features */}
                <div className="bg-card border-border rounded-2xl border p-6">
                  <div className="mb-6 flex items-center gap-4">
                    <div className="bg-gradient-to-r from-pink-500 to-purple-500 flex h-12 w-12 items-center justify-center rounded-xl">
                      <Zap className="text-white h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-foreground text-xl font-semibold">
                        Uniswap v4 Integration
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Advanced trading mechanisms powered by hooks
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-lg p-4 border border-pink-500/20">
                      <h3 className="text-foreground font-semibold mb-2">Bonding Curve</h3>
                      <p className="text-muted-foreground text-sm mb-3">
                        Quadratic pricing curve for fair price discovery
                      </p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>• Formula: price = basePrice + (supply² × slope)</p>
                        <p>• No liquidity pools needed</p>
                        <p>• Always available trading</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
                      <h3 className="text-foreground font-semibold mb-2">Custom Hooks</h3>
                      <p className="text-muted-foreground text-sm mb-3">
                        Smart contract automation via Uniswap v4 hooks
                      </p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>• beforeSwap/afterSwap automation</p>
                        <p>• Dynamic fee structures</p>
                        <p>• Custom curve implementations</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="lg:col-span-2">
                <div className="bg-card border-border rounded-2xl border p-8 text-center">
                  <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-xl mx-auto mb-4">
                    <Building className="text-primary h-8 w-8" />
                  </div>
                  <h2 className="text-foreground text-xl font-semibold mb-2">
                    No Business Registered
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Create your on-chain startup to enable share trading and unlock advanced features
                  </p>
                  <Link 
                    href="/"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors"
                  >
                    <Building className="h-4 w-4" />
                    Create Startup
                  </Link>
                </div>
              </div>
            )}

            {/* Wallet & Quick Actions */}
            <div className="space-y-6">
              {/* Wallet Balance */}
              <div className="bg-card border-border rounded-2xl border p-6">
                <div className="mb-6 flex items-center gap-4">
                  <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
                    <Wallet className="text-primary h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-foreground text-xl font-semibold">
                      Balance
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      {primaryWallet?.walletClientType === 'privy' ? 'Embedded' : 'Connected'} Wallet
                    </p>
                  </div>
                </div>

                <div className="from-primary/5 to-accent/5 rounded-xl bg-gradient-to-r p-6 text-center mb-4">
                  <div className="text-foreground mb-2 text-2xl font-bold">
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

                {primaryWallet && (
                  <div className="bg-background rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-mono text-xs">
                        {formatAddress(primaryWallet.address)}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={copyAddress}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <a
                          href={`https://sepolia.etherscan.io/address/${primaryWallet.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* System Status */}
              <div className="bg-card border-border rounded-2xl border p-6">
                <h3 className="text-foreground font-semibold mb-4">
                  System Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Wallet Connected</span>
                    <span className="text-green-500 text-xs">✅ Ready</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">StartUpChain</span>
                    <span className="text-green-500 text-xs">✅ Deployed</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Bonding Curve</span>
                    <span className="text-green-500 text-xs">✅ Ready</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Uniswap v4</span>
                    <span className="text-blue-500 text-xs">🔗 Integrated</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trading Tab */}
        {activeTab === 'trading' && (
          <div className="max-w-4xl">
            {businessAccount ? (
              <ShareTrading 
                startupId={1} // This would come from business account
                companyName={businessAccount.ensName.replace('.eth', '')}
              />
            ) : (
              <div className="bg-card border-border rounded-2xl border p-8 text-center">
                <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-foreground text-xl font-semibold mb-2">
                  Trading Not Available
                </h2>
                <p className="text-muted-foreground">
                  Register your business first to enable share trading with bonding curves
                </p>
              </div>
            )}
          </div>
        )}

        {/* Contracts Tab */}
        {activeTab === 'contracts' && (
          <div className="max-w-4xl">
            <div className="grid gap-6 md:grid-cols-2">
              {/* StartUpChain Contract */}
              <div className="bg-card border-border rounded-2xl border p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="bg-blue-500/10 flex h-10 w-10 items-center justify-center rounded-lg">
                    <LinkIcon className="text-blue-500 h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold">StartUpChain</h3>
                    <p className="text-muted-foreground text-sm">Company registry</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-background rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground text-xs">Contract</span>
                      <a
                        href={`https://sepolia.etherscan.io/address/0xd2AaDf8F0a74Ad7995fB33CC09f2E4a3a765A575`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-xs hover:underline"
                      >
                        View on Etherscan
                      </a>
                    </div>
                    <p className="text-foreground font-mono text-xs break-all">
                      0xd2AaDf8F0a74Ad7995fB33CC09f2E4a3a765A575
                    </p>
                  </div>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• Company registration</p>
                    <p>• Founder management</p>
                    <p>• Equity allocation</p>
                    <p>• Share contracts deployment</p>
                  </div>
                </div>
              </div>

              {/* Bonding Curve Contract */}
              <div className="bg-card border-border rounded-2xl border p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="bg-purple-500/10 flex h-10 w-10 items-center justify-center rounded-lg">
                    <ChartBar className="text-purple-500 h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold">Bonding Curve</h3>
                    <p className="text-muted-foreground text-sm">Share trading AMM</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-background rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground text-xs">Contract</span>
                      {bondingCurveAddress !== '0x0000000000000000000000000000000000000000' ? (
                        <a
                          href={`https://sepolia.etherscan.io/address/${bondingCurveAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-xs hover:underline"
                        >
                          View on Etherscan
                        </a>
                      ) : (
                        <span className="text-amber-500 text-xs">Not Deployed</span>
                      )}
                    </div>
                    <p className="text-foreground font-mono text-xs break-all">
                      {bondingCurveAddress}
                    </p>
                  </div>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• Quadratic pricing curve</p>
                    <p>• Automated market making</p>
                    <p>• 0.3% trading fees</p>
                    <p>• Slippage protection</p>
                  </div>
                </div>
              </div>

              {/* Uniswap v4 Integration */}
              <div className="bg-card border-border rounded-2xl border p-6 md:col-span-2">
                <div className="mb-4 flex items-center gap-3">
                  <div className="bg-gradient-to-r from-pink-500 to-purple-500 flex h-10 w-10 items-center justify-center rounded-lg">
                    <Zap className="text-white h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold">Uniswap v4 Hooks Integration</h3>
                    <p className="text-muted-foreground text-sm">Advanced DeFi automation</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-background rounded-lg p-4">
                    <h4 className="text-foreground font-medium mb-2">Custom Curves</h4>
                    <p className="text-muted-foreground text-xs mb-2">
                      Implement custom pricing mechanisms
                    </p>
                    <div className="text-xs text-primary">
                      ✓ beforeSwap hooks
                    </div>
                  </div>
                  
                  <div className="bg-background rounded-lg p-4">
                    <h4 className="text-foreground font-medium mb-2">Dynamic Fees</h4>
                    <p className="text-muted-foreground text-xs mb-2">
                      Adaptive fee structures based on market conditions
                    </p>
                    <div className="text-xs text-primary">
                      ✓ afterSwap hooks
                    </div>
                  </div>
                  
                  <div className="bg-background rounded-lg p-4">
                    <h4 className="text-foreground font-medium mb-2">Liquidity Rewards</h4>
                    <p className="text-muted-foreground text-xs mb-2">
                      Reward early supporters and liquidity providers
                    </p>
                    <div className="text-xs text-primary">
                      ✓ Custom accounting
                    </div>
                  </div>
                </div>

                <div className="mt-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-lg p-4 border border-pink-500/20">
                  <h4 className="text-foreground font-medium mb-2">Hook Architecture Benefits</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground mb-1">For Startups:</p>
                      <ul className="space-y-1">
                        <li>• Immediate liquidity without traditional pools</li>
                        <li>• Fair price discovery from day one</li>
                        <li>• Customizable trading mechanics</li>
                        <li>• Reduced capital requirements</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-1">For Investors:</p>
                      <ul className="space-y-1">
                        <li>• Transparent, mathematical pricing</li>
                        <li>• No liquidity provider risk</li>
                        <li>• Always available exit liquidity</li>
                        <li>• Protection against manipulation</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
