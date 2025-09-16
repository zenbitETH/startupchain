'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PrivyProvider, usePrivy } from '@privy-io/react-auth'

import { useDebounce } from '../../hooks/use-debounce'
import { EnsInput } from './EnsInput'
import { EnsStatus } from './EnsStatus'
import { useEnsCheck } from './useEnsCheck'

const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

if (!privyAppId) {
  throw new Error('NEXT_PUBLIC_PRIVY_APP_ID must be set to render EnsNameChecker')
}

interface CheckerViewProps {
  ensName: string
  setEnsName: (value: string) => void
  normalizedName: string
  isLoading: boolean
  error: any
  isTaken: boolean
  isAvailable: boolean
  resolvedAddress: string | null
  onProceed: () => void
  isAuthenticating: boolean
}

function EnsCheckerView({
  ensName,
  setEnsName,
  normalizedName,
  isLoading,
  error,
  isTaken,
  isAvailable,
  resolvedAddress,
  onProceed,
  isAuthenticating,
}: CheckerViewProps) {
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
          onProceed={onProceed}
          isAuthenticating={isAuthenticating}
        />
      </div>
    </div>
  )
}

function EnsNameCheckerWithPrivy() {
  const [ensName, setEnsName] = useState('')
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [pendingName, setPendingName] = useState<string | null>(null)
  const debouncedEnsName = useDebounce(ensName, 500)
  const router = useRouter()
  const { authenticated, login } = usePrivy()

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
        await login()
      } catch (privyError) {
        console.error('Privy login failed', privyError)
        setIsAuthenticating(false)
        setPendingName(null)
      }
      return
    }

    router.push(`/dashboard/setup?ensName=${normalizedName}`)
  }, [authenticated, login, normalizedName, router])

  return (
    <EnsCheckerView
      ensName={ensName}
      setEnsName={setEnsName}
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
  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        appearance: { theme: 'dark' },
        embeddedWallets: { createOnLogin: 'users-without-wallets' },
      }}
    >
      <EnsNameCheckerWithPrivy />
    </PrivyProvider>
  )
}
