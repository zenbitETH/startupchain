'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
 import { isAddress } from 'viem'
import { useSendTransaction, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'

import {
  commitEnsRegistrationAction,
  confirmRecordCompanyAction,
  finalizeEnsRegistrationAction,
  getEnsRegistrationCostAction,
  getRecordCompanyDataAction,
  resumeRegistrationAction,
  type EnsRegistrationRecord,
} from '@/app/(app)/dashboard/setup/actions'
import { getTreasuryAddressAction } from '@/app/(app)/dashboard/setup/payment-actions'
import { startupChainAbi } from '@/lib/blockchain/startupchain-abi'

const LOG_PREFIX = '[CLIENT:useCompanyRegistration]'

type RegistrationStep =
  | 'idle'
  | 'checking'
  | 'awaiting-payment'
  | 'payment-pending'
  | 'committing'
  | 'waiting'
  | 'deploying-safe'
  | 'registering-ens'
  | 'awaiting-signature'
  | 'signing-company'
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
  totalWei: string
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
  const [treasuryAddress, setTreasuryAddress] = useState<string | null>(null)
  const [paymentTxHash, setPaymentTxHash] = useState<string | null>(null)

  const ensNameRef = useRef<string | null>(null)
  const readyAtRef = useRef<number | null>(null)
  const safeAddressRef = useRef<string | undefined>(undefined)
  const foundersRef = useRef<FounderInput[]>([])
  const thresholdRef = useRef<number>(1)
  const durationYearsRef = useRef<number>(1)

  // Wagmi hooks for payment
  const { sendTransaction, data: txHash, isPending: isSending, error: sendError } = useSendTransaction()
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Wagmi hooks for recordCompany signing
  const {
    writeContract: writeRecordCompany,
    data: recordCompanyTxHash,
    isPending: isSigningCompany,
    error: recordCompanyError,
  } = useWriteContract()
  const {
    isLoading: isConfirmingCompany,
    isSuccess: isCompanyConfirmed,
    error: companyConfirmError,
  } = useWaitForTransactionReceipt({
    hash: recordCompanyTxHash,
  })

  // Handle payment tx hash from wagmi
  useEffect(() => {
    if (txHash && step === 'awaiting-payment') {
      console.log(LOG_PREFIX, 'Payment tx hash received:', txHash)
      setPaymentTxHash(txHash)
      setStep('payment-pending')
    }
  }, [txHash, step])



  // Handle payment errors
  useEffect(() => {
    if (sendError && step === 'awaiting-payment') {
      console.log(LOG_PREFIX, 'Payment send error:', sendError)
      setError(sendError.message || 'Failed to send payment')
      setStep('failed')
    }
    if (confirmError && step === 'payment-pending') {
      console.log(LOG_PREFIX, 'Payment confirm error:', confirmError)
      setError(confirmError.message || 'Payment transaction failed')
      setStep('failed')
    }
  }, [sendError, confirmError, step])

  // Handle company signing - track tx hash
  useEffect(() => {
    if (recordCompanyTxHash && step === 'awaiting-signature') {
      console.log(LOG_PREFIX, 'recordCompany tx hash received:', recordCompanyTxHash)
      setStep('signing-company')
    }
  }, [recordCompanyTxHash, step])

  // Handle company signing confirmation - complete registration
  useEffect(() => {
    if (isCompanyConfirmed && recordCompanyTxHash && step === 'signing-company') {
      console.log(LOG_PREFIX, 'recordCompany confirmed! Completing registration...')
      confirmRecordCompanyAction({ companyTxHash: recordCompanyTxHash })
        .then(() => {
          console.log(LOG_PREFIX, 'Registration completed!')
          setStep('completed')
          setCanComplete(false)
          setCountdown(null)
        })
        .catch((err) => {
          console.log(LOG_PREFIX, 'Error confirming record:', err)
          // Still mark as completed since tx was confirmed on-chain
          setStep('completed')
        })
    }
  }, [isCompanyConfirmed, recordCompanyTxHash, step])

  // Handle company signing errors
  useEffect(() => {
    if (recordCompanyError && step === 'awaiting-signature') {
      console.log(LOG_PREFIX, 'recordCompany sign error:', recordCompanyError)
      setError(recordCompanyError.message || 'Failed to sign transaction')
      setStep('failed')
    }
    if (companyConfirmError && step === 'signing-company') {
      console.log(LOG_PREFIX, 'recordCompany confirm error:', companyConfirmError)
      setError(companyConfirmError.message || 'Transaction failed')
      setStep('failed')
    }
  }, [recordCompanyError, companyConfirmError, step])

  // Countdown timer for waiting step
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
      console.log(LOG_PREFIX, 'calculateCosts called', { ensName, durationYears, founderCount })
      if (!ensName) return null

      const years = Math.max(1, durationYears)
      const founders = Math.max(1, founderCount)
      const result = await getEnsRegistrationCostAction(ensName, years, founders)
      console.log(LOG_PREFIX, 'Cost result:', result)

      const breakdown: CostBreakdown = {
        ensRegistrationCostEth: result.costEth,
        safeDeploymentCostEth: result.safeGasEth,
        serviceFeeEth: result.serviceFeeEth,
        totalEth: result.totalEth,
        totalWei: result.totalWei,
      }

      setCostBreakdown(breakdown)
      return breakdown
    },
    []
  )

  // Step 1: Initialize and validate - sets up for payment
  const initializeRegistration = useCallback(
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
      console.log(LOG_PREFIX, '=== initializeRegistration START ===')
      console.log(LOG_PREFIX, 'Input:', { ensName, founders, threshold, durationYears })
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

      // Store registration details for after payment
      ensNameRef.current = ensName
      foundersRef.current = founders
      thresholdRef.current = threshold
      durationYearsRef.current = durationYears

      // Get treasury address
      const treasury = await getTreasuryAddressAction()
      console.log(LOG_PREFIX, 'Treasury address:', treasury.address)
      setTreasuryAddress(treasury.address)

      // Calculate costs if not already done
      if (!costBreakdown) {
        await calculateCosts(ensName, durationYears, founders.length)
      }

      setStep('awaiting-payment')
      console.log(LOG_PREFIX, '=== initializeRegistration COMPLETE - awaiting payment ===')

      return { treasuryAddress: treasury.address }
    },
    [costBreakdown, calculateCosts]
  )

  // Step 2: Send payment to treasury
  const sendPayment = useCallback(() => {
    console.log(LOG_PREFIX, '=== sendPayment START ===')
    if (!treasuryAddress || !costBreakdown) {
      const message = 'Must initialize registration first'
      setError(message)
      throw new Error(message)
    }

    console.log(LOG_PREFIX, 'Sending', costBreakdown.totalEth, 'ETH to', treasuryAddress)

    sendTransaction({
      to: treasuryAddress as `0x${string}`,
      value: BigInt(costBreakdown.totalWei),
    })
  }, [treasuryAddress, costBreakdown, sendTransaction])

  // Step 3: After payment confirmed, proceed with registration
  const proceedAfterPayment = useCallback(async () => {
    console.log(LOG_PREFIX, '=== proceedAfterPayment START ===')

    if (!ensNameRef.current) {
      const message = 'No pending registration found'
      setError(message)
      setStep('failed')
      throw new Error(message)
    }

    setStep('committing')
    console.log(LOG_PREFIX, 'Calling commitEnsRegistrationAction...')

    try {
      const result = await commitEnsRegistrationAction({
        ensName: ensNameRef.current,
        founders: toFounderPayload(foundersRef.current),
        threshold: thresholdRef.current,
        durationYears: durationYearsRef.current,
        paymentTxHash: paymentTxHash!, // Required - server verifies on-chain
      })
      console.log(LOG_PREFIX, 'commitEnsRegistrationAction result:', result)

      safeAddressRef.current = result.safeAddress
      readyAtRef.current = result.readyAt
      setCountdown(Math.max(0, Math.ceil((result.readyAt - Date.now()) / 1000)))
      setCanComplete(false)
      setStep(result.status === 'waiting' ? 'waiting' : 'committing')
      console.log(LOG_PREFIX, '=== proceedAfterPayment COMPLETE ===')

      return result
    } catch (err) {
      console.log(LOG_PREFIX, 'ERROR in proceedAfterPayment:', err)
      const message =
        err instanceof Error ? err.message : 'Failed to start registration'
      setError(message)
      setStep('failed')
      throw err
    }
  }, [paymentTxHash])

  // Handle payment confirmation - auto-proceed to commit
  useEffect(() => {
    if (isConfirmed && step === 'payment-pending' && ensNameRef.current) {
      console.log(LOG_PREFIX, 'Payment confirmed! Proceeding to commit...')
      proceedAfterPayment()
    }
  }, [isConfirmed, step, proceedAfterPayment])

  const completeRegistration = useCallback(async () => {
    console.log(LOG_PREFIX, '=== completeRegistration START ===')
    console.log(LOG_PREFIX, 'ensNameRef.current:', ensNameRef.current)
    if (!ensNameRef.current) {
      const message = 'No pending registration found'
      console.log(LOG_PREFIX, 'ERROR:', message)
      setError(message)
      setStep('failed')
      throw new Error(message)
    }

    setError(null)
    setStep('deploying-safe')
    console.log(LOG_PREFIX, 'Calling finalizeEnsRegistrationAction...')

    try {
      const result: EnsRegistrationRecord = await finalizeEnsRegistrationAction({
        ensName: ensNameRef.current,
      })
      console.log(LOG_PREFIX, 'finalizeEnsRegistrationAction result:', result)

      // Update step based on status
      if (result.status === 'deploying-safe') {
        console.log(LOG_PREFIX, 'Status: deploying-safe')
        setStep('deploying-safe')
      } else if (result.status === 'registering') {
        console.log(LOG_PREFIX, 'Status: registering-ens')
        setStep('registering-ens')
      } else if (result.status === 'ready-to-record') {
        // ENS registered, now user needs to sign recordCompany()
        console.log(LOG_PREFIX, 'Status: ready-to-record - awaiting user signature')
        if (result.safeAddress) {
          safeAddressRef.current = result.safeAddress
        }
        setStep('awaiting-signature')
      } else if (result.status === 'completed') {
        console.log(LOG_PREFIX, 'Status: completed!')
        setStep('completed')
        setCanComplete(false)
        setCountdown(null)
        if (result.safeAddress) {
          safeAddressRef.current = result.safeAddress
        }
      }
      console.log(LOG_PREFIX, '=== completeRegistration COMPLETE ===')

      return result
    } catch (err) {
      console.log(LOG_PREFIX, 'ERROR in completeRegistration:', err)
      const message =
        err instanceof Error ? err.message : 'Failed to finalize registration'
      setError(message)
      setStep('failed')
      throw err
    }
  }, [])

  // F1: Sign recordCompany() with user's wallet
  const signRecordCompany = useCallback(async () => {
    console.log(LOG_PREFIX, '=== signRecordCompany START ===')

    if (step !== 'awaiting-signature') {
      const message = 'Not ready to sign recordCompany'
      console.log(LOG_PREFIX, 'ERROR:', message)
      setError(message)
      return
    }

    try {
      const data = await getRecordCompanyDataAction()
      console.log(LOG_PREFIX, 'recordCompany data:', data)

      writeRecordCompany({
        address: data.contractAddress,
        abi: startupChainAbi,
        functionName: 'recordCompany',
        args: [
          data.ensLabel,
          data.safeAddress,
          data.founders,
          data.threshold,
        ],
        value: 0n, // User already paid upfront, only gas needed
      })
    } catch (err) {
      console.log(LOG_PREFIX, 'ERROR in signRecordCompany:', err)
      const message =
        err instanceof Error ? err.message : 'Failed to prepare transaction'
      setError(message)
      setStep('failed')
    }
  }, [step, writeRecordCompany])



  // Resume registration from session cookie on mount
  useEffect(() => {
    let mounted = true
    const resume = async () => {
      try {
        const pending = await resumeRegistrationAction()
        if (!mounted || !pending) return

        console.log(LOG_PREFIX, 'Resuming registration:', pending)
        // Restore state refs
        ensNameRef.current = pending.ensName
        readyAtRef.current = pending.readyAt
        safeAddressRef.current = pending.safeAddress

        // Map pending founders back to input format if possible, otherwise keep empty
        // (UI might need to reload them if we want to show them in the form,
        // but for progress card we just need the state)
        // Note: The form usually clears on refresh anyway, so we're mostly concerned with
        // showing the correct progress step.

        // Need to map pending.founders (BackendFounder[]) to FounderInput[]
        // But PendingFounder lacks role/equity sometimes?
        // PendingRegistration type has: founders: PendingFounder[]
        // PendingFounder: { wallet, equityBps?, role? }
        foundersRef.current = pending.founders.map(f => ({
          address: f.wallet,
          equity: f.equityBps ? (f.equityBps / 100).toString() : '0',
          role: f.role
        }))

        thresholdRef.current = pending.threshold
        durationYearsRef.current = pending.durationYears

        // Restore step
        switch (pending.status) {
          case 'waiting':
            setStep('waiting')
            setCountdown(Math.max(0, Math.ceil((pending.readyAt - Date.now()) / 1000)))
            setCanComplete(false)
            break
          case 'deploying-safe':
            setStep('deploying-safe')
            break
          case 'registering': // Mapped to registering-ens
            setStep('registering-ens')
            break
          case 'ready-to-record': // Mapped to awaiting-signature
            setStep('awaiting-signature')
            break
          default:
            // For committing, creating, etc. maybe just idle or specific steps
            if (pending.status === 'committing') setStep('committing')
        }
      } catch (err) {
        console.error(LOG_PREFIX, 'Failed to resume registration:', err)
      }
    }

    resume()
    return () => { mounted = false }
  }, [])

  const reset = useCallback(() => {
    console.log(LOG_PREFIX, 'reset called')
    ensNameRef.current = null
    readyAtRef.current = null
    safeAddressRef.current = undefined
    foundersRef.current = []
    thresholdRef.current = 1
    durationYearsRef.current = 1
    setStep('idle')
    setCountdown(null)
    setCanComplete(false)
    setCostBreakdown(null)
    setError(null)
    setTreasuryAddress(null)
    setPaymentTxHash(null)
  }, [])

  const safeAddress = useMemo(() => safeAddressRef.current, [])

  return {
    // State
    step,
    countdown,
    costBreakdown,
    canComplete,
    error,
    safeAddress,
    treasuryAddress,
    paymentTxHash,
    // Payment state from wagmi
    isSendingPayment: isSending,
    isConfirmingPayment: isConfirming,
    isPaymentConfirmed: isConfirmed,
    // Company signing state
    isSigningCompany,
    isConfirmingCompany,
    // Actions
    calculateCosts,
    initializeRegistration,
    sendPayment,
    completeRegistration,
    signRecordCompany,
    reset,
  }
}
