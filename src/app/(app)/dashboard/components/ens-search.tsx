'use client'

import { AlertCircle, ArrowRight, CheckCircle, Loader2, Search } from 'lucide-react'
import { useState } from 'react'
import { normalize } from 'viem/ens'
import { useEnsAddress } from 'wagmi'

import { isValidEnsName } from '@/lib/ens'

interface EnsSearchProps {
  initialEnsName?: string
}

export function EnsSearch({ initialEnsName = '' }: EnsSearchProps) {
  const [ensName, setEnsName] = useState(initialEnsName)

  // ENS checking logic
  const shouldCheck = ensName && isValidEnsName(ensName)
  let normalizedName: string | undefined

  try {
    normalizedName = shouldCheck
      ? normalize(ensName.endsWith('.eth') ? ensName : `${ensName}.eth`)
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

  return (
    <div className="bg-card border-border mb-8 rounded-2xl border p-6">
      <div className="mb-6 flex items-center gap-4">
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
                    Try adding your industry or location (e.g., {ensName}
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
                Name must be 3-63 characters, contain only letters, numbers,
                and hyphens
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
