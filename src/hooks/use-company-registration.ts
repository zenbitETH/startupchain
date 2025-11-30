'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isAddress } from 'viem'

import {
  commitEnsRegistrationAction,
  finalizeEnsRegistrationAction,
  getEnsRegistrationCostAction,
  type EnsRegistrationRecord,
} from '@/app/(app)/dashboard/setup/actions'

type RegistrationStep =
  | 'idle'
  | 'checking'
  | 'committing'
  | 'waiting'
  | 'deploying-safe'
  | 'registering-ens'
  | 'registering-company'
  | 'completed'
  | 'failed'

type FounderInput = {
  address: string
  equity: string
  role?: string
}

export type CostBreakdown = {
  ensRegistrationCostEth: string
  safeDeploymentCostEth: string
  serviceFeeEth: string
  totalEth: string
}

function formatEth(wei: bigint) {
  const asNumber = Number(formatEther(wei))
  return asNumber.toFixed(asNumber >= 1 ? 4 : 6)
}

function toFounderPayload(founders: FounderInput[]) {
  return founders.map((founder) => ({
    wallet: founder.address as `0x${string}`,
    equityPercent: Number.parseFloat(founder.equity) || 0,
    role: founder.role,
  }))
}

export function useCompanyRegistration() {
  const [step, setStep] = useState<RegistrationStep>('idle')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null)
  const [canComplete, setCanComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ensNameRef = useRef<string | null>(null)
  const readyAtRef = useRef<number | null>(null)
  const safeAddressRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (step !== 'waiting' || !readyAtRef.current) {
      return undefined
    }

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((readyAtRef.current! - Date.now()) / 1000)
      )
      setCountdown(remaining)
      setCanComplete(remaining <= 0)
    }

    tick()
    const id = window.setInterval(tick, 1000)

    return () => window.clearInterval(id)
  }, [step])

  const calculateCosts = useCallback(
    async (ensName: string, durationYears = 1, founderCount = 1) => {
      if (!ensName) return null

      const years = Math.max(1, durationYears)
      const founders = Math.max(1, founderCount)
      const result = await getEnsRegistrationCostAction(ensName, years, founders)

      const breakdown: CostBreakdown = {
        ensRegistrationCostEth: result.costEth,
        safeDeploymentCostEth: result.safeGasEth,
        serviceFeeEth: result.serviceFeeEth,
        totalEth: result.totalEth,
      }

      setCostBreakdown(breakdown)
      return breakdown
    },
    []
  )

  const startRegistration = useCallback(
    async ({
      ensName,
      founders,
      threshold,
      durationYears = 1,
    }: {
      ensName: string
      founders: FounderInput[]
      threshold: number
      durationYears?: number
    }) => {
      setError(null)
      setStep('checking')

      const invalidFounder = founders.find(
        (founder) => !isAddress(founder.address)
      )
      if (invalidFounder) {
        const message = 'Please provide valid founder wallet addresses'
        setError(message)
        setStep('failed')
        throw new Error(message)
      }

      if (founders.length === 0) {
        const message = 'Add at least one founder to continue'
        setError(message)
        setStep('failed')
        throw new Error(message)
      }

      if (threshold > founders.length || threshold <= 0) {
        const message = 'Threshold must be between 1 and the number of founders'
        setError(message)
        setStep('failed')
        throw new Error(message)
      }

      setStep('committing')

      try {
        ensNameRef.current = ensName

        // Server predicts Safe address from founders - no need to pass safeAddress
        const result = await commitEnsRegistrationAction({
          ensName,
          founders: toFounderPayload(founders),
          threshold,
          durationYears,
        })

        // Store the predicted Safe address as owner
        safeAddressRef.current = result.safeAddress

        readyAtRef.current = result.readyAt
        setCountdown(Math.max(0, Math.ceil((result.readyAt - Date.now()) / 1000)))
        setCanComplete(false)
        setStep(result.status === 'waiting' ? 'waiting' : 'committing')

        return result
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to start registration'
        setError(message)
        setStep('failed')
        throw err
      }
    },
    []
  )

  const completeRegistration = useCallback(async () => {
    if (!ensNameRef.current) {
      const message = 'No pending registration found'
      setError(message)
      setStep('failed')
      throw new Error(message)
    }

    setError(null)
    setStep('deploying-safe')

    try {
      const result: EnsRegistrationRecord = await finalizeEnsRegistrationAction({
        ensName: ensNameRef.current,
      })

      // Update step based on status
      if (result.status === 'deploying-safe') {
        setStep('deploying-safe')
      } else if (result.status === 'registering') {
        setStep('registering-ens')
      } else if (result.status === 'creating') {
        setStep('registering-company')
      } else if (result.status === 'completed') {
        setStep('completed')
        setCanComplete(false)
        setCountdown(null)
        // Update owner address with actual Safe address
        if (result.safeAddress) {
          safeAddressRef.current = result.safeAddress
        }
      }

      return result
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to finalize registration'
      setError(message)
      setStep('failed')
      throw err
    }
  }, [])

  const reset = useCallback(() => {
    ensNameRef.current = null
    readyAtRef.current = null
    safeAddressRef.current = undefined
    setStep('idle')
    setCountdown(null)
    setCanComplete(false)
    setCostBreakdown(null)
    setError(null)
  }, [])

  const safeAddress = useMemo(() => safeAddressRef.current, [step])

  return {
    step,
    countdown,
    costBreakdown,
    canComplete,
    error,
    safeAddress,
    calculateCosts,
    startRegistration,
    completeRegistration,
    reset,
  }
}
