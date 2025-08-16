'use client'

import { usePrivy } from '@privy-io/react-auth'
import { AlertCircle, ArrowRight, CheckCircle, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useDebounce } from '@/hooks/use-debounce'
import {
  type ENSAvailabilityResult,
  checkEnsAvailability,
  isValidEnsName,
} from '@/lib/ens'

export function HeroSection() {
  const [ensName, setEnsName] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [ensResult, setEnsResult] = useState<ENSAvailabilityResult | null>(null)
  const { login, authenticated } = usePrivy()

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
    <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="bg-primary/20 animate-blob absolute left-10 top-40 h-72 w-72 rounded-full opacity-70 mix-blend-multiply blur-xl filter"></div>
        <div className="bg-accent/20 animate-blob animation-delay-2000 absolute right-10 top-40 h-72 w-72 rounded-full opacity-70 mix-blend-multiply blur-xl filter"></div>
        <div className="bg-primary/10 animate-blob animation-delay-4000 absolute -bottom-8 left-20 h-72 w-72 rounded-full opacity-70 mix-blend-multiply blur-xl filter"></div>
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Main Headline */}
          <h1 className="text-foreground mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            Build your business
            <br />
            <span className="from-primary via-accent to-primary animate-gradient-x bg-gradient-to-r bg-clip-text text-transparent">
              on-chain forever
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-muted-foreground mx-auto mb-6 max-w-3xl text-xl leading-relaxed md:text-2xl">
            Register ENS names, split revenue transparently, and build with the
            security of blockchain technology.
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
                <div className="text-muted-foreground absolute right-4 top-1/2 -translate-y-1/2 font-medium">
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
  )
}