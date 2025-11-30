'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { formatEther, isAddress } from 'viem'

import {
  commitEnsRegistrationAction,
  finalizeEnsRegistrationAction,
  getEnsRegistrationCostAction,
  type EnsRegistrationRecord,
} from '@/app/(app)/dashboard/setup/actions'
import { useWalletAuth } from '@/hooks/use-wallet-auth'

type RegistrationStep =
  | 'idle'
  | 'checking'
  | 'committing'
  | 'waiting'
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
  serviceFeeEth: string
  estimatedGasEth: string
  totalEth: string
}

const ESTIMATED_GAS_WEI = 5_000_000_000_000_000n // ~0.005 ETH
const SERVICE_FEE_BPS = 2500n
const BPS_DENOMINATOR = 10_000n

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
  const { primaryAddress } = useWalletAuth()
  const [step, setStep] = useState<RegistrationStep>('idle')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null)
  const [canComplete, setCanComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ensNameRef = useRef<string | null>(null)
  const readyAtRef = useRef<number | null>(null)
  const ownerAddressRef = useRef<string | undefined>(primaryAddress ?? undefined)

  useEffect(() => {
    ownerAddressRef.current = primaryAddress ?? ownerAddressRef.current
  }, [primaryAddress])

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
    async (ensName: string, durationYears = 1) => {
      if (!ensName) return null

      const years = Math.max(1, durationYears)
      const result = await getEnsRegistrationCostAction(ensName, years)
      const ensCostWei = BigInt(result.costWei)
      const serviceFeeWei = (ensCostWei * SERVICE_FEE_BPS) / BPS_DENOMINATOR
      const totalWei = ensCostWei + serviceFeeWei + ESTIMATED_GAS_WEI

      const breakdown: CostBreakdown = {
        ensRegistrationCostEth: formatEth(ensCostWei),
        serviceFeeEth: formatEth(serviceFeeWei),
        estimatedGasEth: formatEth(ESTIMATED_GAS_WEI),
        totalEth: formatEth(totalWei),
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
      ownerAddress,
      durationYears = 1,
    }: {
      ensName: string
      founders: FounderInput[]
      threshold: number
      ownerAddress?: `0x${string}` | string
      durationYears?: number
    }) => {
      setError(null)
      setStep('checking')

      const owner = (ownerAddress ?? primaryAddress)?.trim()
      if (!owner || !isAddress(owner)) {
        const message = 'Please connect a wallet with a valid Ethereum address'
        setError(message)
        setStep('failed')
        throw new Error(message)
      }

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
        ownerAddressRef.current = owner as `0x${string}`

        const result = await commitEnsRegistrationAction({
          ensName,
          safeAddress: owner as `0x${string}`,
          founders: toFounderPayload(founders),
          threshold,
          durationYears,
        })

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
    [primaryAddress]
  )

  const completeRegistration = useCallback(async () => {
    if (!ensNameRef.current) {
      const message = 'No pending registration found'
      setError(message)
      setStep('failed')
      throw new Error(message)
    }

    setError(null)
    setStep('registering-ens')

    try {
      const result: EnsRegistrationRecord = await finalizeEnsRegistrationAction({
        ensName: ensNameRef.current,
      })

      if (result.status === 'creating') {
        setStep('registering-company')
      }

      if (result.status === 'completed') {
        setStep('completed')
        setCanComplete(false)
        setCountdown(null)
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
    setStep('idle')
    setCountdown(null)
    setCanComplete(false)
    setCostBreakdown(null)
    setError(null)
  }, [])

  const walletAddress = useMemo(
    () => ownerAddressRef.current ?? primaryAddress,
    [primaryAddress]
  )

  return {
    step,
    countdown,
    costBreakdown,
    canComplete,
    error,
    walletAddress,
    calculateCosts,
    startRegistration,
    completeRegistration,
    reset,
  }
}
