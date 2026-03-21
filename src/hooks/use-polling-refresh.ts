'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const POLLING_INTERVAL_MS = 15_000

/**
 * Polls `router.refresh()` on a fixed interval while `shouldPoll` is true.
 * Cleans up automatically when `shouldPoll` becomes false or the component unmounts.
 */
export function usePollingRefresh(shouldPoll: boolean): void {
  const router = useRouter()

  useEffect(() => {
    if (!shouldPoll) return
    const intervalId = window.setInterval(() => {
      router.refresh()
    }, POLLING_INTERVAL_MS)
    return () => {
      window.clearInterval(intervalId)
    }
  }, [shouldPoll, router])
}
