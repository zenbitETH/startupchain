'use client'

import { usePrivy } from '@/lib/privy'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface LoginButtonProps {
  children: React.ReactNode
  redirectTo?: string
  className?: string
}

export function LoginButton({ children, redirectTo = '/dashboard', className }: LoginButtonProps) {
  const { login, authenticated, ready } = usePrivy()
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
    if (!authenticated) {
      setIsAuthenticating(true)
      login()
    } else {
      router.push(redirectTo)
    }
  }

  if (!ready) {
    return (
      <button disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading...
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={isAuthenticating}
      className={className}
    >
      {isAuthenticating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Authenticating...
        </>
      ) : (
        children
      )}
    </button>
  )
}
