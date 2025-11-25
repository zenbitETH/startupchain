'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { useWalletAuth } from '@/hooks/use-wallet-auth'

// Auto-triggers Privy connect when user was redirected here with a returnUrl.
export function AutoAuthRedirect() {
  const { authenticated, ready, connect } = useWalletAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [attempted, setAttempted] = useState(false)

  const returnUrl = useMemo(() => {
    const urlParam = searchParams.get('returnUrl')
    if (!urlParam) return null
    return urlParam.startsWith('/') ? urlParam : null
  }, [searchParams])

  useEffect(() => {
    if (!returnUrl || !ready) return

    if (authenticated) {
      router.replace(returnUrl)
      return
    }

    if (attempted) return

    setAttempted(true)
    void connect().catch(() => {
      // Swallow errors so the landing page still works if login is canceled.
      setAttempted(false)
    })
  }, [authenticated, attempted, connect, ready, returnUrl, router])

  return null
}
