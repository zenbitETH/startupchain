'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { useWalletAuth } from '@/hooks/use-wallet-auth'

// Auto-triggers Privy connect when user was redirected here with a returnUrl.
export function AutoAuthRedirect() {
  const { authenticated, ready, connect } = useWalletAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const attempted = useRef(false)

  const returnUrl = searchParams.get('returnUrl')
  const isValidReturnUrl =
    returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//')

  // 1. Handle Redirect
  useEffect(() => {
    if (ready && authenticated && isValidReturnUrl) {
      router.replace(returnUrl)
    }
  }, [ready, authenticated, isValidReturnUrl, returnUrl, router])

  // 2. Handle Connect Trigger
  useEffect(() => {
    if (!ready || authenticated || !isValidReturnUrl || attempted.current) {
      return
    }

    attempted.current = true
    void connect()
  }, [ready, authenticated, isValidReturnUrl, connect])

  return null
}
