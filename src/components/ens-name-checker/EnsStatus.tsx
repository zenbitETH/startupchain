import { AlertCircle, ArrowRight, CheckCircle, Loader2 } from 'lucide-react'

import { isValidEnsName } from '../../lib/ens'

interface EnsStatusProps {
  ensName: string
  normalizedName: string
  isLoading: boolean
  error: any
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
  return (
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
                <span className="font-medium">Error checking availability</span>
              </div>
              <p className="text-muted-foreground mt-2 text-sm">
                Failed to check name availability. Please try again.
              </p>
            </div>
          ) : isTaken ? (
            <div className="bg-destructive/10 border-destructive/20 rounded-2xl border p-4">
              <div className="text-destructive flex items-center gap-3">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">This name is already taken</span>
              </div>
              <div className="mt-3 space-y-2">
                {resolvedAddress && (
                  <p className="text-muted-foreground font-mono text-sm">
                    Owned by: {resolvedAddress.slice(0, 6)}...
                    {resolvedAddress.slice(-4)}
                  </p>
                )}
                <p className="text-muted-foreground text-sm">
                  Try adding your industry or location (e.g., {ensName}tech,{' '}
                  {ensName}dao)
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
                <button
                  onClick={onProceed}
                  disabled={isAuthenticating}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex cursor-pointer items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-200 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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

      {ensName.length > 0 && !isValidEnsName(ensName) && (
        <div className="animate-in fade-in duration-300">
          <div className="bg-muted/10 border-muted/20 rounded-2xl border p-4">
            <div className="text-muted-foreground flex items-center gap-3">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Invalid name format</span>
            </div>
            <p className="text-muted-foreground mt-2 text-sm">
              Name must be 3-63 characters, contain only letters, numbers, and
              hyphens
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
