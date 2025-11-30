import { useCallback, useEffect, useRef, useState } from 'react'
import { Address, formatEther, isAddress, parseEther } from 'viem'
import { baseSepolia } from 'viem/chains'

import {
  commitEnsRegistrationAction,
  finalizeEnsRegistrationAction,
  getEnsRegistrationStatusAction,
} from '@/app/(app)/dashboard/setup/actions'
import {
  calculateThreshold,
  predictSafeAddress,
} from '@/lib/blockchain/safe-factory'
import { STARTUPCHAIN_CHAIN_ID } from '@/lib/blockchain/startupchain-config'
import { usePrivy, useWallets } from '@/lib/privy'

export interface BusinessAccount {
  smartAccountAddress: Address
  safeAddress: Address
  ensName: string
  owners: string[]
  ownerEquity: Record<string, number>
  threshold: number
  isDeployed: boolean
}

export type FounderInput = {
  address: string
  equity: string // percentage as string, e.g. "50"
  role?: string
}

export function useSmartWallet() {
  const { user, authenticated, ready, login } = usePrivy()
  const { wallets } = useWallets()
  const pendingStorageKey = user ? `pending-ens-${user.id}` : null

  const [businessAccount, setBusinessAccount] =
    useState<BusinessAccount | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transactionHashes, setTransactionHashes] = useState<{
    commitTx?: string
    registrationTx?: string
    companyTx?: string
  }>({})
  const [showCongratulations, setShowCongratulations] = useState(false)
  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | null>(null)
  const [isWaitingForReceipt, setIsWaitingForReceipt] = useState(false)
  const [commitmentCountdown, setCommitmentCountdown] = useState<number | null>(
    null
  )
  const [readyAt, setReadyAt] = useState<number | null>(null)
  const finalizeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persistPending = useCallback(
    (data: { ensName: string; ownerAddress: Address; readyAt: number }) => {
      if (!pendingStorageKey) return
      localStorage.setItem(pendingStorageKey, JSON.stringify(data))
    },
    [pendingStorageKey]
  )

  const clearPending = useCallback(() => {
    if (!pendingStorageKey) return
    localStorage.removeItem(pendingStorageKey)
  }, [pendingStorageKey])

  const finalizeRegistration = useCallback(
    async (ensName: string) => {
      setIsWaitingForReceipt(true)
      try {
        const result = await finalizeEnsRegistrationAction({ ensName })

        setTransactionHashes((prev) => ({
          ...prev,
          registrationTx: result.registrationTxHash,
          companyTx: result.companyTxHash,
        }))

        const smartAddress =
          (user?.wallet?.address as Address | undefined) ?? result.owner

        const account: BusinessAccount = {
          smartAccountAddress: smartAddress,
          safeAddress: result.owner,
          ensName: `${result.ensLabel}.eth`,
          owners: result.founders.map((f) => f.wallet),
          ownerEquity: result.founders.reduce(
            (acc, f) => {
              acc[f.wallet] = Number(f.equityBps) / 100
              return acc
            },
            {} as Record<string, number>
          ),
          threshold: result.threshold,
          isDeployed: true,
        }

        setBusinessAccount(account)
        setShowCongratulations(true)
        if (user?.id) {
          localStorage.setItem(`business-${user.id}`, JSON.stringify(account))
        }
        clearPending()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to finalize registration'
        setError(message)
        throw err
      } finally {
        setIsWaitingForReceipt(false)
      }
    },
    [clearPending, user?.id, user?.wallet?.address]
  )

  const scheduleFinalize = useCallback(
    (ensName: string, eta: number) => {
      if (finalizeTimer.current) {
        clearTimeout(finalizeTimer.current)
      }
      const delay = Math.max(0, eta - Date.now())
      finalizeTimer.current = setTimeout(() => {
        finalizeRegistration(ensName).catch((err) =>
          console.error('Finalize registration failed:', err)
        )
      }, delay)
    },
    [finalizeRegistration]
  )

  useEffect(() => {
    if (!readyAt) {
      setCommitmentCountdown(null)
      return
    }

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((readyAt - Date.now()) / 1000))
      setCommitmentCountdown(remaining)
    }

    updateCountdown()
    const id = window.setInterval(updateCountdown, 1000)
    return () => window.clearInterval(id)
  }, [readyAt])

  useEffect(() => {
    return () => {
      if (finalizeTimer.current) {
        clearTimeout(finalizeTimer.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!user || !ready || !pendingStorageKey) return
    const stored = localStorage.getItem(pendingStorageKey)
    if (!stored) return

    try {
      const parsed = JSON.parse(stored) as {
        ensName: string
        ownerAddress: Address
        readyAt: number
      }
      setReadyAt(parsed.readyAt)
      const now = Date.now()

      getEnsRegistrationStatusAction(parsed.ensName)
        .then((record) => {
          if (!record) {
            clearPending()
            return
          }
          setTransactionHashes({
            commitTx: record.commitTxHash,
            registrationTx: record.registrationTxHash,
            companyTx: record.companyTxHash,
          })

          if (record.status === 'registered') {
            const account: BusinessAccount = {
              smartAccountAddress:
                (user.wallet?.address as Address | undefined) ?? parsed.ownerAddress,
              safeAddress: record.owner,
              ensName: record.ensName,
              owners: record.founders.map((f) => f.wallet),
              ownerEquity: record.founders.reduce(
                (acc, f) => {
                  acc[f.wallet] = Number(f.equityBps) / 100
                  return acc
                },
                {} as Record<string, number>
              ),
              threshold: record.threshold,
              isDeployed: true,
            }
            setBusinessAccount(account)
            setShowCongratulations(true)
            clearPending()
            return
          }

          if (now >= record.readyAt) {
            finalizeRegistration(record.ensLabel).catch((err) =>
              console.error('Finalize on resume failed:', err)
            )
          } else {
            scheduleFinalize(record.ensLabel, record.readyAt)
          }
        })
        .catch((err) => {
          console.error('Failed to restore ENS registration', err)
        })
    } catch {
      clearPending()
    }
  }, [
    clearPending,
    finalizeRegistration,
    pendingStorageKey,
    ready,
    scheduleFinalize,
    user,
  ])

  // Get smart wallet from user's linked accounts
  const getSmartWallet = useCallback(() => {
    if (!user) return null

    // Find smart wallet in linked accounts (configured in Privy dashboard)
    const smartWallet = user.linkedAccounts?.find(
      (account) => account.type === 'smart_wallet'
    )

    // Type guard to check if it's a smart wallet with address
    if (smartWallet && 'address' in smartWallet && smartWallet.address) {
      return {
        address: smartWallet.address as Address,
        smartWalletType:
          ('smartWalletType' in smartWallet
            ? smartWallet.smartWalletType
            : 'safe') || 'safe',
      }
    }

    return null
  }, [user])

  // Get embedded wallet for signing
  const getEmbeddedWallet = useCallback(() => {
    // First try to find Privy embedded wallet
    const embedded = wallets.find(
      (w) => w.walletClientType === 'privy' && w.connectorType === 'embedded'
    )
    if (embedded) return embedded

    // Fallback to any connected wallet
    return wallets[0] ?? null
  }, [wallets])

  // Create business account with Safe deployment + ENS registration
  const createBusinessAccount = useCallback(
    async (
      ensName: string,
      founders: FounderInput[],
      registrationAddress?: string
    ) => {
      if (!authenticated || !user) {
        throw new Error('User must be authenticated')
      }

      setIsCreating(true)
      setIsWaitingForReceipt(true)
      setError(null)
      setTransactionHashes({})
      setPendingTxHash(null)
      setShowCongratulations(false)

      try {
        // Check if user has a smart wallet or embedded wallet
        let smartWallet = getSmartWallet()
        let embeddedWallet = getEmbeddedWallet()

        let businessWalletAddress: Address

        if (smartWallet) {
          businessWalletAddress = smartWallet.address
        } else if (embeddedWallet) {
          businessWalletAddress = embeddedWallet.address as Address
        } else if (user?.wallet?.address) {
          // Fallback to user's primary wallet from Privy
          businessWalletAddress = user.wallet.address as Address
        } else {
          // Try to prompt login to surface an embedded wallet
          await login()
          smartWallet = getSmartWallet()
          embeddedWallet = getEmbeddedWallet()
          if (smartWallet) {
            businessWalletAddress = smartWallet.address
          } else if (embeddedWallet) {
            businessWalletAddress = embeddedWallet.address as Address
          } else {
            throw new Error('No wallet found. Please ensure you are logged in.')
          }
        }

        const normalizedEns =
          ensName.endsWith('.eth') && ensName.length > 4
            ? ensName.slice(0, -4)
            : ensName

        if (
          registrationAddress &&
          (!isAddress(registrationAddress) || registrationAddress === '0x')
        ) {
          throw new Error('Please provide a valid registration address')
        }

        // Validate founder addresses
        const founderAddresses = founders
          .map((founder) => founder.address as `0x${string}`)
          .filter(
            (addr) => addr && addr !== '0x' && isAddress(addr)
          ) as Address[]

        if (founderAddresses.length === 0) {
          throw new Error('At least one founder address is required')
        }
        if (founderAddresses.length !== founders.length) {
          throw new Error('Please provide valid founder wallet addresses')
        }

        // Validate equity totals (must be <= 100%)
        const totalEquity = founders.reduce(
          (sum, f) => sum + parseFloat(f.equity),
          0
        )
        if (totalEquity > 100) {
          throw new Error('Total equity cannot exceed 100%')
        }

        // Calculate threshold automatically
        const threshold = calculateThreshold(founderAddresses.length)

        // Predict Safe address (for display purposes)
        const predictedSafeAddress = await predictSafeAddress({
          owners: founderAddresses,
          chainId: STARTUPCHAIN_CHAIN_ID,
          threshold,
        })

        // Use Safe address if provided, otherwise use predicted address
        const ownerAddress = registrationAddress
          ? (registrationAddress as `0x${string}`)
          : predictedSafeAddress

        const backendFounders = founders.map((founder) => ({
          wallet: founder.address as `0x${string}`,
          equityPercent: Number.parseFloat(founder.equity) || 0,
          role: founder.role,
        }))

        console.log('📝 Registering company on backend:', {
          ensName: normalizedEns,
          ownerAddress,
          founders: backendFounders,
          threshold,
        })

        const commitResult = await commitEnsRegistrationAction({
          ensName: normalizedEns,
          safeAddress: ownerAddress,
          founders: backendFounders,
          threshold,
        })

        setTransactionHashes({
          commitTx: commitResult.commitTxHash,
        })

        setReadyAt(commitResult.readyAt)
        persistPending({
          ensName: normalizedEns,
          ownerAddress,
          readyAt: commitResult.readyAt,
        })
        scheduleFinalize(normalizedEns, commitResult.readyAt)
        return null
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to create business'
        setError(message)
        throw err
      } finally {
        setIsCreating(false)
        setIsWaitingForReceipt(false)
      }
    },
    [
      authenticated,
      user,
      getSmartWallet,
      getEmbeddedWallet,
      login,
      persistPending,
      scheduleFinalize,
    ]
  )

  // Send transaction from business wallet
  const sendFromBusinessWallet = useCallback(
    async (to: Address, value: string) => {
      const embeddedWallet = getEmbeddedWallet()

      if (!embeddedWallet) {
        throw new Error('Business wallet not available')
      }

      try {
        const businessWallet = getSmartWallet()

        console.log('💸 Sending from business wallet:', {
          from: businessWallet?.address || embeddedWallet.address,
          to,
          value: `${value} ETH`,
          walletType: businessWallet ? 'Smart Wallet' : 'Embedded Wallet',
        })

        // Switch to correct chain
        await embeddedWallet.switchChain(baseSepolia.id)

        // Get Ethereum provider
        const provider = await embeddedWallet.getEthereumProvider()

        // Send transaction using the provider
        const txHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: embeddedWallet.address,
              to,
              value: `0x${parseEther(value).toString(16)}`,
            },
          ],
        })

        console.log('✅ Transaction sent:', txHash)
        return txHash
      } catch (err) {
        console.error('Failed to send transaction:', err)
        throw err
      }
    },
    [getSmartWallet, getEmbeddedWallet]
  )

  // Get business wallet balance
  const getBusinessWalletBalance = useCallback(async () => {
    const smartWallet = getSmartWallet()
    const embeddedWallet = getEmbeddedWallet()

    const businessAddress = smartWallet?.address || embeddedWallet?.address
    if (!businessAddress) return null

    try {
      if (!embeddedWallet) return null

      await embeddedWallet.switchChain(baseSepolia.id)
      const provider = await embeddedWallet.getEthereumProvider()

      const balance = await provider.request({
        method: 'eth_getBalance',
        params: [businessAddress, 'latest'],
      })

      return formatEther(BigInt(balance as string))
    } catch (err) {
      console.error('Failed to get balance:', err)
      return null
    }
  }, [getSmartWallet, getEmbeddedWallet])

  // Load existing business account
  useEffect(() => {
    if (user && ready) {
      const stored = localStorage.getItem(`business-${user.id}`)
      if (stored) {
        setBusinessAccount(JSON.parse(stored))
      }
    }
  }, [user, ready])

  const smartWallet = getSmartWallet()
  const embeddedWallet = getEmbeddedWallet()
  const primaryWalletAddress =
    smartWallet?.address ||
    embeddedWallet?.address ||
    user?.wallet?.address ||
    null

  return {
    businessAccount,
    businessWalletAddress: primaryWalletAddress as Address | null,
    createBusinessAccount,
    sendFromBusinessWallet,
    getBusinessWalletBalance,
    isCreating,
    error,
    hasSmartWallet: !!smartWallet,
    hasEmbeddedWallet: !!embeddedWallet,
    isWalletReady: !!(smartWallet || embeddedWallet || user?.wallet?.address),
    transactionHashes,
    showCongratulations,
    setShowCongratulations,
    commitmentCountdown,
    pendingTxHash,
    isWaitingForReceipt,
  }
}
