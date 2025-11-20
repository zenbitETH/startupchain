// ! Archived 2025-11-20
'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { useWalletAuth } from '@/hooks/use-wallet-auth'
import { cn } from '@/lib/utils'

interface LoginButtonProps {
  children: React.ReactNode
  redirectTo?: string
  className?: string
}

export function LoginButton({
  children,
  redirectTo = '/dashboard',
  className,
}: LoginButtonProps) {
  const { connect, authenticated, ready } = useWalletAuth()
  const router = useRouter()
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  // Handle successful authentication
  useEffect(() => {
    if (authenticated && isAuthenticating) {
      setIsAuthenticating(false)
      router.push(redirectTo)
    }
  }, [authenticated, isAuthenticating, router, redirectTo])

  const handleClick = () => {
    if (isAuthenticating || !ready) return

    if (!authenticated) {
      setIsAuthenticating(true)
      connect().catch(() => setIsAuthenticating(false))
      return
    }

    router.push(redirectTo)
  }

  const content = isAuthenticating ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Authenticating...
    </>
  ) : (
    children
  )

  return (
    <Button
      type="button"
      size="lg"
      onClick={handleClick}
      disabled={isAuthenticating || !ready}
      className={cn('min-w-[160px]', className)}
    >
      {!ready ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading…
        </>
      ) : (
        content
      )}
    </Button>
  )
}
