'use client'

import { usePrivy } from '@privy-io/react-auth'
import { AlertCircle, ArrowRight, CheckCircle, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useDebounce } from 'usehooks-ts'
import { normalize } from 'viem/ens'
import { useEnsAddress } from 'wagmi'

import { AnimatedSkyscraper } from '@/components/AnimatedSkyscraper'
import { BusinessSetupModal } from '@/components/business-setup-modal'
import { isValidEnsName } from '@/lib/ens'

export function HeroSection() {
  const [ensName, setEnsName] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const { login, authenticated } = usePrivy()
  const pendingModalRef = useRef(false)

  const debouncedEnsName = useDebounce(ensName, 800)

  // Normalize and validate the ENS name
  const shouldCheck = debouncedEnsName && isValidEnsName(debouncedEnsName)
  let normalizedName: string | undefined

  try {
    normalizedName = shouldCheck
      ? normalize(
          debouncedEnsName.endsWith('.eth')
            ? debouncedEnsName
            : `${debouncedEnsName}.eth`
        )
      : undefined
  } catch {
    normalizedName = undefined
  }

  // Use wagmi's useEnsAddress to check if name resolves to an address
  const {
    data: resolvedAddress,
    isLoading,
    error,
  } = useEnsAddress({
    name: normalizedName,
    chainId: 1, // mainnet
    query: {
      enabled: !!normalizedName,
    },
  })

  // Determine availability based on whether the name resolves to an address
  const isAvailable = normalizedName && !isLoading && !error && !resolvedAddress
  const isTaken = normalizedName && !isLoading && !error && !!resolvedAddress

  // Handle authentication state change to show modal
  useEffect(() => {
    if (authenticated && pendingModalRef.current) {
      setShowSetupModal(true)
      setIsAuthenticating(false)
      pendingModalRef.current = false
    }
  }, [authenticated])

  const handleProceed = () => {
    if (!authenticated) {
      setIsAuthenticating(true)
      pendingModalRef.current = true
      login()
    } else {
      setShowSetupModal(true)
    }
  }

  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden">
      {/* Animated skyscraper background */}
      <AnimatedSkyscraper name={ensName || 'Your company'} />
      <div className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center lg:max-w-3xl lg:text-left">
          {/* Main Headline */}
          <h1 className="text-foreground mb-6 text-4xl font-semibold tracking-tight md:text-6xl lg:text-7xl">
            Build your business
            <br />
            <span className="from-primary via-secondary to-primary animate-gradient-x bg-gradient-to-r bg-clip-text text-transparent">
              onchain
            </span>
          </h1>
          {/* ENS Name Checker */}
          <div className="mx-auto mb-16 max-w-2xl lg:mx-0">
            <div className="bg-card border-border/50 relative min-h-[200px] overflow-hidden rounded-2xl border p-6 shadow-2xl backdrop-blur-sm">
              {/* Title that disappears on focus */}
              <div
                className={`absolute top-4 right-6 left-6 transition-all duration-300 ${isFocused ? '-translate-y-2 opacity-0' : 'translate-y-0 opacity-100'}`}
              >
                <h3 className="text-foreground text-center text-3xl font-semibold">
                  <span className="from-primary to-secondary bg-gradient-to-r bg-clip-text text-transparent">
                    Enter your business name
                  </span>
                </h3>
              </div>

              {/* Input field that moves up when focused */}
              <div
                className={`relative transition-all duration-300 ${isFocused ? 'translate-y-0' : 'translate-y-12'}`}
              >
                <input
                  type="text"
                  placeholder="Your company name"
                  value={ensName}
                  onChange={(e) =>
                    setEnsName(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                    )
                  }
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => !ensName && setIsFocused(false)}
                  className="bg-white text-primary border-border focus:ring-primary focus:border-primary placeholder:text-muted-foreground w-full rounded-2xl border px-6 py-4 pr-16 text-lg transition-all duration-200 focus:ring-2"
                />
                <div className="text-muted-foreground absolute top-1/2 right-4 -translate-y-1/2 font-medium">
                  .eth
                </div>
              </div>

              {/* Status Display - Fixed height container */}
              <div className="mt-4 min-h-[120px]">
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
                      <div className="bg-primary/10 border-primary/20 rounded-2xl border p-4 ">
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
                            disabled={isAuthenticating}
                            className="bg-primary cursor-pointer text-primary-foreground hover:bg-primary/90 flex 
                            items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-200 
                            disabled:cursor-not-allowed disabled:opacity-50 hover:text-white"
                          >
                            {isAuthenticating ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Authenticating...
                              </>
                            ) : (
                              <>
                                Proceed to setup
                                <ArrowRight className="h-4 w-4" />
                              </>
                            )}
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
          </div>

          {/* Social Proof */}
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60 lg:justify-start">
            <div className="text-muted-foreground text-sm">Powered by</div>
            <div className="flex items-center gap-6">
              <div className="text-lg font-semibold">ENS</div>
              <div className="text-lg font-semibold">Privy</div>
              <div className="text-lg font-semibold">Uniswap</div>
            </div>
          </div>
        </div>
      </div>


      {/* Business Setup Modal */}
      <BusinessSetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        ensName={ensName}
      />
    </section>
  )
}
