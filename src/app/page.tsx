'use client'

import { usePrivy } from '@privy-io/react-auth'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  ChevronRight,
  DollarSign,
  Loader2,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { useDebounce } from '@/hooks/use-debounce'
import {
  type ENSAvailabilityResult,
  checkEnsAvailability,
  isValidEnsName,
} from '@/lib/ens'

export default function Home() {
  const [ensName, setEnsName] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [ensResult, setEnsResult] = useState<ENSAvailabilityResult | null>(null)
  const { login, authenticated, user } = usePrivy()

  const debouncedEnsName = useDebounce(ensName, 800)

  useEffect(() => {
    if (!debouncedEnsName || !isValidEnsName(debouncedEnsName)) {
      setEnsResult(null)
      return
    }

    const checkAvailability = async () => {
      setIsChecking(true)
      setEnsResult(null)

      try {
        const result = await checkEnsAvailability(debouncedEnsName)
        setEnsResult(result)
      } catch (error) {
        console.error('Failed to check ENS availability:', error)
        setEnsResult({
          available: false,
          error: 'Failed to check name availability. Please try again.',
        })
      } finally {
        setIsChecking(false)
      }
    }

    checkAvailability()
  }, [debouncedEnsName])

  const handleProceed = () => {
    if (!authenticated) {
      login()
    } else {
      // Navigate to company setup
      console.log('Proceeding to company setup...')
    }
  }

  return (
    <div className="from-background via-background to-primary/5 min-h-screen bg-gradient-to-br">
      {/* Navigation */}
      <nav className="border-border/40 bg-background/80 relative z-50 border-b backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-2">
              <div className="from-primary to-accent flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br">
                <Sparkles className="text-primary-foreground h-5 w-5" />
              </div>
              <span className="text-foreground text-xl font-bold tracking-tight">
                StartupChain
              </span>
            </div>
            <div className="hidden items-center space-x-8 md:flex">
              <a
                href="#features"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                How it works
              </a>
              <a
                href="#pricing"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </a>
              {authenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-muted-foreground text-sm">
                    {user?.email?.address ||
                      user?.wallet?.address?.slice(0, 6) + '...'}
                  </span>
                  <Link
                    href="/dashboard"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-block rounded-lg px-4 py-2 font-medium transition-all duration-200"
                  >
                    Dashboard
                  </Link>
                </div>
              ) : (
                <button
                  onClick={login}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 font-medium transition-all duration-200"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="bg-primary/20 animate-blob absolute top-40 left-10 h-72 w-72 rounded-full opacity-70 mix-blend-multiply blur-xl filter"></div>
          <div className="bg-accent/20 animate-blob animation-delay-2000 absolute top-40 right-10 h-72 w-72 rounded-full opacity-70 mix-blend-multiply blur-xl filter"></div>
          <div className="bg-primary/10 animate-blob animation-delay-4000 absolute -bottom-8 left-20 h-72 w-72 rounded-full opacity-70 mix-blend-multiply blur-xl filter"></div>
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Main Headline */}
            <h1 className="text-foreground mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Build your business
              <br />
              <span className="from-primary via-accent to-primary animate-gradient-x bg-gradient-to-r bg-clip-text text-transparent">
                on-chain
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-muted-foreground mx-auto mb-6 max-w-3xl text-xl leading-relaxed md:text-2xl">
              Register ENS names, split revenue transparently, and build with
              the security of blockchain technology.
            </p>

            {/* Email emphasis */}
            <div className="mx-auto mb-12 max-w-2xl">
              <div className="from-primary/10 via-accent/10 to-primary/10 border-primary/20 rounded-xl border bg-gradient-to-r p-4">
                <p className="text-foreground text-lg font-medium">
                  ✨ Start with just your email address - we&apos;ll handle the
                  crypto magic
                </p>
              </div>
            </div>

            {/* ENS Name Checker */}
            <div className="mx-auto mb-16 max-w-2xl">
              <div className="bg-card/50 border-border/50 rounded-2xl border p-6 shadow-2xl backdrop-blur-sm">
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
                    className="bg-background border-border focus:ring-primary focus:border-primary placeholder:text-muted-foreground w-full rounded-xl border px-6 py-4 pr-16 text-lg transition-all duration-200 focus:ring-2"
                  />
                  <div className="text-muted-foreground absolute top-1/2 right-4 -translate-y-1/2 font-medium">
                    .eth
                  </div>
                </div>

                {/* Status Display */}
                {(isChecking || ensResult) && isValidEnsName(ensName) && (
                  <div className="animate-in fade-in slide-in-from-top-1 mt-4 duration-300">
                    {isChecking ? (
                      <div className="text-muted-foreground flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Checking availability on ENS...</span>
                      </div>
                    ) : ensResult?.error ? (
                      <div className="bg-destructive/10 border-destructive/20 rounded-xl border p-4">
                        <div className="text-destructive flex items-center gap-3">
                          <AlertCircle className="h-5 w-5" />
                          <span className="font-medium">
                            Error checking availability
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-2 text-sm">
                          {ensResult.error}
                        </p>
                      </div>
                    ) : ensResult && !ensResult.available ? (
                      <div className="bg-destructive/10 border-destructive/20 rounded-xl border p-4">
                        <div className="text-destructive flex items-center gap-3">
                          <AlertCircle className="h-5 w-5" />
                          <span className="font-medium">
                            This name is already taken
                          </span>
                        </div>
                        <div className="mt-3 space-y-2">
                          {ensResult.address && (
                            <p className="text-muted-foreground font-mono text-sm">
                              Owned by: {ensResult.address.slice(0, 6)}...
                              {ensResult.address.slice(-4)}
                            </p>
                          )}
                          <p className="text-muted-foreground text-sm">
                            Try adding your industry or location (e.g.,{' '}
                            {ensName}tech, {ensName}dao)
                          </p>
                        </div>
                      </div>
                    ) : ensResult?.available ? (
                      <div className="bg-primary/10 border-primary/20 rounded-xl border p-4">
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
                          <button
                            onClick={handleProceed}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all duration-200"
                          >
                            Proceed to setup
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Validation Message */}
                {ensName.length > 0 && !isValidEnsName(ensName) && (
                  <div className="animate-in fade-in slide-in-from-top-1 mt-4 duration-300">
                    <div className="bg-muted/10 border-muted/20 rounded-xl border p-4">
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

            {/* Social Proof */}
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
              <div className="text-muted-foreground text-sm">Trusted by</div>
              <div className="flex items-center gap-6">
                <div className="text-lg font-semibold">ENS</div>
                <div className="text-lg font-semibold">Safe</div>
                <div className="text-lg font-semibold">Privy</div>
                <div className="text-lg font-semibold">Ethereum</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-card/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-foreground mb-6 text-3xl font-bold md:text-5xl">
              Everything you need to
              <span className="text-primary"> build unstoppable</span>
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
              From idea to IPO, all the infrastructure you need for a
              transparent, decentralized business
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="group relative">
              <div className="from-primary/20 to-accent/20 absolute inset-0 rounded-2xl bg-gradient-to-r opacity-25 blur transition-opacity group-hover:opacity-40"></div>
              <div className="bg-card border-border hover:border-primary/50 relative rounded-2xl border p-8 transition-all duration-300">
                <div className="bg-primary/10 mb-6 flex h-12 w-12 items-center justify-center rounded-xl">
                  <Sparkles className="text-primary h-6 w-6" />
                </div>
                <h3 className="text-foreground mb-4 text-xl font-semibold">
                  No wallet? No problem
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Start with just an email. We&apos;ll create an embedded wallet
                  for you and upgrade to self-custody when you&apos;re ready.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative">
              <div className="from-accent/20 to-primary/20 absolute inset-0 rounded-2xl bg-gradient-to-r opacity-25 blur transition-opacity group-hover:opacity-40"></div>
              <div className="bg-card border-border hover:border-primary/50 relative rounded-2xl border p-8 transition-all duration-300">
                <div className="bg-primary/10 mb-6 flex h-12 w-12 items-center justify-center rounded-xl">
                  <DollarSign className="text-primary h-6 w-6" />
                </div>
                <h3 className="text-foreground mb-4 text-xl font-semibold">
                  Transparent revenue splits
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Set revenue percentages once. Every payment automatically
                  splits between treasury and owners on-chain.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative">
              <div className="from-primary/20 to-accent/20 absolute inset-0 rounded-2xl bg-gradient-to-r opacity-25 blur transition-opacity group-hover:opacity-40"></div>
              <div className="bg-card border-border hover:border-primary/50 relative rounded-2xl border p-8 transition-all duration-300">
                <div className="bg-primary/10 mb-6 flex h-12 w-12 items-center justify-center rounded-xl">
                  <Shield className="text-primary h-6 w-6" />
                </div>
                <h3 className="text-foreground mb-4 text-xl font-semibold">
                  Multi-sig security
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Enterprise-grade protection with Safe multisig wallets.
                  Multiple signatures required for critical decisions.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative">
              <div className="from-accent/20 to-primary/20 absolute inset-0 rounded-2xl bg-gradient-to-r opacity-25 blur transition-opacity group-hover:opacity-40"></div>
              <div className="bg-card border-border hover:border-primary/50 relative rounded-2xl border p-8 transition-all duration-300">
                <div className="bg-primary/10 mb-6 flex h-12 w-12 items-center justify-center rounded-xl">
                  <Users className="text-primary h-6 w-6" />
                </div>
                <h3 className="text-foreground mb-4 text-xl font-semibold">
                  Your .eth domain
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Professional ENS names that work as domains, wallets, and
                  identities. Own your name forever.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="group relative">
              <div className="from-primary/20 to-accent/20 absolute inset-0 rounded-2xl bg-gradient-to-r opacity-25 blur transition-opacity group-hover:opacity-40"></div>
              <div className="bg-card border-border hover:border-primary/50 relative rounded-2xl border p-8 transition-all duration-300">
                <div className="bg-primary/10 mb-6 flex h-12 w-12 items-center justify-center rounded-xl">
                  <CheckCircle className="text-primary h-6 w-6" />
                </div>
                <h3 className="text-foreground mb-4 text-xl font-semibold">
                  Gasless transactions
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  No need to buy crypto to get started. We cover gas fees for
                  email users until you&apos;re ready to self-custody.
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="group relative">
              <div className="from-accent/20 to-primary/20 absolute inset-0 rounded-2xl bg-gradient-to-r opacity-25 blur transition-opacity group-hover:opacity-40"></div>
              <div className="bg-card border-border hover:border-primary/50 relative rounded-2xl border p-8 transition-all duration-300">
                <div className="bg-primary/10 mb-6 flex h-12 w-12 items-center justify-center rounded-xl">
                  <Sparkles className="text-primary h-6 w-6" />
                </div>
                <h3 className="text-foreground mb-4 text-xl font-semibold">
                  Built for scale
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  From MVP to IPO, our infrastructure grows with you. Add team
                  members, adjust splits, upgrade security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-24">
        <div className="from-primary/5 via-accent/5 to-primary/5 absolute inset-0 bg-gradient-to-r"></div>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-foreground mb-6 text-3xl font-bold md:text-5xl">
            Ready to build the future?
          </h2>
          <p className="text-muted-foreground mx-auto mb-12 max-w-2xl text-xl">
            Join thousands of builders creating unstoppable businesses on
            Ethereum
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <button className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-lg font-semibold transition-all duration-200">
              Start building
              <ChevronRight className="h-5 w-5" />
            </button>
            <button className="border-border text-foreground hover:bg-card rounded-xl border px-8 py-4 text-lg font-semibold transition-all duration-200">
              View documentation
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-border bg-card/50 border-t py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="mb-4 flex items-center space-x-2 md:mb-0">
              <div className="from-primary to-accent flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br">
                <Sparkles className="text-primary-foreground h-5 w-5" />
              </div>
              <span className="text-foreground text-xl font-bold tracking-tight">
                StartupChain
              </span>
            </div>
            <div className="text-muted-foreground flex items-center space-x-6 text-sm">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Discord
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Twitter
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
