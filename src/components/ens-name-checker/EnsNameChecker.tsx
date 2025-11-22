'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { useProvidersReady } from '@/components/providers/providers-shell'
import { useWalletAuth } from '@/hooks/use-wallet-auth'

import { useDebounce } from '../../hooks/use-debounce'
import { EnsInput } from './EnsInput'
import { EnsStatus } from './EnsStatus'
import { useEnsCheck } from './useEnsCheck'

function EnsLogic({ ensName }: { ensName: string }) {
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [pendingName, setPendingName] = useState<string | null>(null)
  const debouncedEnsName = useDebounce(ensName, 500)
  const router = useRouter()
  const { authenticated, connect } = useWalletAuth()

  const {
    normalizedName,
    isLoading,
    error,
    isTaken,
    isAvailable,
    resolvedAddress,
  } = useEnsCheck(debouncedEnsName)

  useEffect(() => {
    if (authenticated && pendingName) {
      router.push(`/dashboard/setup?ensName=${pendingName}`)
      setPendingName(null)
      setIsAuthenticating(false)
    }
  }, [authenticated, pendingName, router])

  const handleProceed = useCallback(async () => {
    if (!normalizedName) return

    if (!authenticated) {
      try {
        setPendingName(normalizedName)
        setIsAuthenticating(true)
        await connect()
      } catch (privyError) {
        console.error('Privy login failed', privyError)
        setIsAuthenticating(false)
        setPendingName(null)
      }
      return
    }

    router.push(`/dashboard/setup?ensName=${normalizedName}`)
  }, [authenticated, connect, normalizedName, router])

  return (
    <EnsStatus
      ensName={ensName}
      normalizedName={normalizedName}
      isLoading={isLoading}
      error={error}
      isTaken={isTaken}
      isAvailable={isAvailable}
      resolvedAddress={resolvedAddress}
      onProceed={handleProceed}
      isAuthenticating={isAuthenticating}
    />
  )
}

export function EnsNameChecker() {
  const { ready } = useProvidersReady()
  const [ensName, setEnsName] = useState('')

  return (
    <div className="mx-auto mb-13 max-w-2xl md:mb-15 lg:mx-0">
      <div className="bg-card border-border/50 relative min-h-[200px] overflow-hidden rounded-2xl border p-6 shadow-2xl backdrop-blur-sm">
        <EnsInput ensName={ensName} setEnsName={setEnsName} />
        {ready ? (
          <EnsLogic ensName={ensName} />
        ) : (
          <EnsStatus
            ensName={ensName}
            normalizedName=""
            isLoading={false}
            error={null}
            isTaken={false}
            isAvailable={false}
            resolvedAddress={null}
            onProceed={() => {}}
            isAuthenticating={false}
          />
        )}
      </div>
    </div>
  )
}
