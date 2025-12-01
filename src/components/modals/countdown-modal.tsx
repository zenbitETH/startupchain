import { CheckCircle, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'

interface CountdownModalProps {
  isOpen: boolean
  countdown: number
  onComplete?: () => void
}

export function CountdownModal({
  isOpen,
  countdown,
  onComplete,
}: CountdownModalProps) {
  const [displayCountdown, setDisplayCountdown] = useState(countdown)

  useEffect(() => {
    setDisplayCountdown(countdown)
    if (countdown === 0 && onComplete) {
      onComplete()
    }
  }, [countdown, onComplete])

  if (!isOpen) return null

  const minutes = Math.floor(displayCountdown / 60)
  const seconds = displayCountdown % 60

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-md">
        <div className="bg-card border-border relative overflow-hidden rounded-2xl border shadow-2xl">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-yellow-500/10" />

          {/* Content */}
          <div className="relative px-6 py-8 text-center">
            {/* Clock Icon with Pulse Animation */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
              {displayCountdown > 0 ? (
                <Clock className="h-10 w-10 animate-pulse text-amber-600 dark:text-amber-400" />
              ) : (
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              )}
            </div>

            {/* Title */}
            <h2 className="text-foreground mb-3 text-2xl font-bold">
              {displayCountdown > 0
                ? 'ENS Commitment Period'
                : 'Ready to Register!'}
            </h2>

            {/* Description */}
            <p className="text-muted-foreground mb-6 text-md">
              {displayCountdown > 0
                ? 'Please wait for the commitment period to complete before ENS registration can proceed'
                : 'The commitment period is complete. Registration will begin automatically.'}
            </p>

            {/* Large Countdown Display */}
            {displayCountdown > 0 && (
              <div className="mb-6">
                <div className="mb-2 text-5xl font-bold text-amber-600 dark:text-amber-400">
                  {minutes}:{seconds.toString().padStart(2, '0')}
                </div>
              </div>
            )}

            {/* Info */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                ⚡ This is required by ENS protocol to prevent front-running
                attacks. You can safely close this window - the process will
                continue in the background.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
