'use client'

import { useState } from 'react'

import { EnsInput } from './EnsInput'
import { EnsStatus } from './EnsStatus'
import { useEnsCheck } from './useEnsCheck'

export function EnsNameChecker() {
  const [ensName, setEnsName] = useState('')

  const {
    normalizedName,
    isLoading,
    error,
    isTaken,
    isAvailable,
    resolvedAddress,
  } = useEnsCheck(ensName)

  const handleProceed = () => {
    console.log('Proceeding with ENS name:', normalizedName)
  }

  return (
    <div className="mx-auto mb-13 max-w-2xl md:mb-15 lg:mx-0">
      <div className="bg-card border-border/50 relative min-h-[200px] overflow-hidden rounded-2xl border p-6 shadow-2xl backdrop-blur-sm">
        <EnsInput ensName={ensName} setEnsName={setEnsName} />
        <EnsStatus
          ensName={ensName}
          normalizedName={normalizedName}
          isLoading={isLoading}
          error={error}
          isTaken={isTaken}
          isAvailable={isAvailable}
          resolvedAddress={resolvedAddress}
          onProceed={handleProceed}
        />
      </div>
    </div>
  )
}
