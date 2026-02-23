'use client'

import {
  AlertCircle,
  ArrowRight,
  Check,
  ExternalLink,
  Loader2,
  Sparkles,
  XCircle,
} from 'lucide-react'
import { AnimatePresence, Variants, motion } from 'motion/react'

import { Button } from '@/components/ui/button'

import { isValidEnsName } from '../../lib/ens'

interface EnsStatusProps {
  ensName: string
  normalizedName: string
  isLoading: boolean
  error: unknown
  isTaken: boolean
  isAvailable: boolean
  resolvedAddress: string | null
  onProceed: () => void
  isAuthenticating: boolean
}

export function EnsStatus({
  ensName,
  normalizedName,
  isLoading,
  error,
  isTaken,
  isAvailable,
  resolvedAddress,
  onProceed,
  isAuthenticating,
}: EnsStatusProps) {
  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.98,
      transition: { duration: 0.2 },
    },
  }

  // Helper to format address
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Invalid Name State
  if (!ensName || !isValidEnsName(ensName)) {
    if (ensName.length > 0) {
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key="invalid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mt-4"
          >
            <div className="border-destructive/20 bg-destructive/5 relative overflow-hidden rounded-xl border p-4 backdrop-blur-md">
              <div className="flex items-start gap-4">
                <div className="bg-destructive/10 text-destructive rounded-full p-2">
                  <XCircle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-destructive font-semibold">
                    Invalid name format
                  </h4>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Use only letters, numbers, and hyphens (3-63 chars)
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )
    }
    return <div className="min-h-[130px]" />
  }

  return (
    <div className="mt-6 min-h-[130px] w-full">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="border-primary/10 bg-card/40 relative overflow-hidden rounded-xl border p-6 backdrop-blur-md"
          >
            <div className="flex flex-col items-center justify-center gap-4 py-2">
              <div className="relative">
                <div className="bg-primary/20 absolute inset-0 animate-ping rounded-full opacity-75"></div>
                <div className="bg-primary/10 relative rounded-full p-3">
                  <Loader2 className="text-primary h-6 w-6 animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <h4 className="text-foreground font-medium">
                  Checking availability...
                </h4>
                <p className="text-muted-foreground text-xs">
                  Scanning Ethereum network
                </p>
              </div>
            </div>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="border-destructive/20 bg-destructive/5 relative overflow-hidden rounded-xl border p-4 backdrop-blur-md"
          >
            <div className="flex items-center gap-4">
              <div className="bg-destructive/10 text-destructive rounded-full p-2">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-destructive font-semibold">
                  Connection Error
                </h4>
                <p className="text-muted-foreground text-sm">
                  Could not verify name availability.
                </p>
              </div>
            </div>
          </motion.div>
        ) : isTaken ? (
          <motion.div
            key="taken"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="border-secondary bg-card/60 relative overflow-hidden rounded-xl border p-5 backdrop-blur-md"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-secondary/20 text-muted-foreground rounded-full p-2">
                  <XCircle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-foreground font-semibold">
                    Already Registered
                  </h4>
                  {resolvedAddress && (
                    <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 font-mono text-xs">
                      <span>Owner: {formatAddress(resolvedAddress)}</span>
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-secondary/10 rounded-lg p-3">
              <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
                Alternatives Available
              </p>
              <div className="flex flex-wrap gap-2">
                {['hq', 'dao', 'app', 'eth'].map((suffix) => (
                  <div
                    key={suffix}
                    className="group border-border/50 bg-background/50 hover:border-primary/30 hover:bg-primary/5 flex cursor-pointer items-center rounded-md border px-2.5 py-1.5 text-sm transition-colors"
                  >
                    <span className="text-foreground group-hover:text-primary font-medium">
                      {ensName}
                      {suffix}
                    </span>
                    <span className="text-muted-foreground/60">.eth</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : isAvailable ? (
          <motion.div
            key="available"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="group border-primary/30 bg-background/60 hover:border-primary/50 hover:shadow-primary/10 relative overflow-hidden rounded-xl border p-1 backdrop-blur-xl transition-all duration-300 hover:shadow-lg"
          >
            {/* Gradient background effect */}
            <div className="from-primary/20 via-accent/20 to-primary/20 absolute -inset-[1px] -z-10 bg-gradient-to-r opacity-30 blur-sm transition-opacity duration-500 group-hover:opacity-60" />

            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="absolute -inset-1 animate-pulse rounded-full bg-green-500/20 blur-sm"></div>
                  <div className="relative rounded-full bg-gradient-to-br from-green-400/20 to-green-500/20 p-2 text-green-600 dark:text-green-400">
                    <Check className="h-6 w-6" />
                  </div>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  </motion.div>
                </div>

                <div>
                  <h4 className="text-foreground text-lg font-bold tracking-tight">
                    Available!
                  </h4>
                  <p className="text-muted-foreground mt-1 text-sm">
                    <span className="text-primary font-semibold">
                      {ensName}.eth
                    </span>{' '}
                    is ready for you.
                  </p>
                </div>
              </div>

              <Button
                onClick={onProceed}
                disabled={isAuthenticating}
                size="lg"
                className="bg-primary text-primary-foreground shadow-primary/25 hover:shadow-primary/30 group/btn relative w-full overflow-hidden px-8 font-semibold shadow-lg transition-all hover:scale-105 hover:shadow-xl sm:w-auto"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isAuthenticating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Register Now
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </>
                  )}
                </span>
                {/* Shine effect on button */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite]" />
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
