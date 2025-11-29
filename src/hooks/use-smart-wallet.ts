import { useCallback, useEffect, useState } from 'react'
import { Address, formatEther, isAddress, parseEther } from 'viem'
import { baseSepolia } from 'viem/chains'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'

import { startupChainAbi } from '@/lib/blockchain/startupchain-abi'
import {
  DEFAULT_ENS_RESOLVER,
  STARTUPCHAIN_ADDRESS,
  STARTUPCHAIN_CHAIN_ID,
} from '@/lib/blockchain/startupchain-config'
import { usePrivy, useWallets } from '@/lib/privy'

import { useEnsRegistration } from './use-ens-registration'

export interface BusinessAccount {
  smartAccountAddress: Address
  ensName: string
  owners: string[]
  ownerEquity: Record<string, number>
  isDeployed: boolean
}

export function useSmartWallet() {
  const { user, authenticated, ready, login } = usePrivy()
  const { wallets } = useWallets()

  const [businessAccount, setBusinessAccount] =
    useState<BusinessAccount | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transactionHashes, setTransactionHashes] = useState<{
    commitTx?: string
    registrationTx?: string
  }>({})
  const [showCongratulations, setShowCongratulations] = useState(false)
  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | null>(null)

  // Get ENS registration functionality
  const ensRegistration = useEnsRegistration()
  const { writeContractAsync } = useWriteContract()
  const {
    data: registrationReceipt,
    isLoading: isWaitingForReceipt,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: pendingTxHash ?? undefined,
    chainId: STARTUPCHAIN_CHAIN_ID,
  })

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
    return wallets.find(
      (w) => w.walletClientType === 'privy' && w.connectorType === 'embedded'
    )
  }, [wallets])

  // Create business account (associates ENS with smart wallet)
  const createBusinessAccount = useCallback(
    async (
      ensName: string,
      founders: { address: string; equity: string }[],
      registrationAddress?: string
    ) => {
      if (!authenticated || !user) {
        throw new Error('User must be authenticated')
      }

      setIsCreating(true)
      setError(null)
      setPendingTxHash(null)

      try {
      // Check if user has a smart wallet or embedded wallet
      let smartWallet = getSmartWallet()
      let embeddedWallet = getEmbeddedWallet()

        let businessWalletAddress: Address

      if (smartWallet) {
        businessWalletAddress = smartWallet.address
      } else if (embeddedWallet) {
        businessWalletAddress = embeddedWallet.address as Address
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

        const isAvailable = await ensRegistration.checkAvailability(ensName)
        if (!isAvailable) {
          throw new Error(
            `ENS name "${ensName}" is not available for registration`
          )
        }

        const normalizedEns =
          ensName.endsWith('.eth') && ensName.length > 4
            ? ensName.slice(0, -4)
            : ensName

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

        const ownerAddress = (registrationAddress ||
          businessWalletAddress) as Address
        if (!ownerAddress || !isAddress(ownerAddress)) {
          throw new Error('Owner address is invalid')
        }

        const durationSeconds = BigInt(365 * 24 * 60 * 60) // 1 year
        const secret = `0x${Array.from(
          crypto.getRandomValues(new Uint8Array(32))
        )
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')}` as `0x${string}`

        const txHash = await writeContractAsync({
          address: STARTUPCHAIN_ADDRESS,
          abi: startupChainAbi,
          functionName: 'registerCompany',
          args: [
            normalizedEns,
            ownerAddress,
            founderAddresses,
            durationSeconds,
            secret,
            DEFAULT_ENS_RESOLVER,
            [] as `0x${string}`[],
            true,
            0,
          ],
          chainId: STARTUPCHAIN_CHAIN_ID,
        })

        setTransactionHashes({
          registrationTx: txHash,
        })
        setPendingTxHash(txHash)

        // Step 5: Deploy business contracts (future implementation)
        // TODO: Deploy revenue splitting contracts
        // TODO: Configure multi-sig if needed

        const account: BusinessAccount = {
          smartAccountAddress: businessWalletAddress,
          ensName: `${normalizedEns}.eth`,
          owners: founders.map((f) => f.address),
          ownerEquity: founders.reduce(
            (acc, f) => {
              acc[f.address] = parseFloat(f.equity)
              return acc
            },
            {} as Record<string, number>
          ),
          isDeployed: true,
        }

        setBusinessAccount(account)

        // Persist to localStorage
        localStorage.setItem(`business-${user.id}`, JSON.stringify(account))

        return account
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to create business'
        setError(message)
        throw err
      } finally {
        setIsCreating(false)
      }
    },
    [
    authenticated,
    user,
    getSmartWallet,
    getEmbeddedWallet,
    ensRegistration,
    writeContractAsync,
    login,
  ]
)

  useEffect(() => {
    if (receiptError instanceof Error) {
      setError(receiptError.message)
    }
  }, [receiptError])

  useEffect(() => {
    if (registrationReceipt?.status === 'success') {
      setShowCongratulations(true)
      setPendingTxHash(null)
    }
  }, [registrationReceipt])

  useEffect(() => {
    if (receiptError) {
      setPendingTxHash(null)
    }
  }, [receiptError])

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

  return {
    businessAccount,
    businessWalletAddress:
      smartWallet?.address || embeddedWallet?.address || null,
    createBusinessAccount,
    sendFromBusinessWallet,
    getBusinessWalletBalance,
    isCreating,
    error,
    hasSmartWallet: !!smartWallet,
    hasEmbeddedWallet: !!embeddedWallet,
    isWalletReady: !!(smartWallet || embeddedWallet),
    transactionHashes,
    showCongratulations,
    setShowCongratulations,
    commitmentCountdown: null,
    pendingTxHash,
    isWaitingForReceipt,
    // ENS registration functionality
    ensRegistration: {
      checkAvailability: ensRegistration.checkAvailability,
      getRegistrationCost: ensRegistration.getRegistrationCost,
      checkWalletBalance: ensRegistration.checkWalletBalance,
      waitForRegisterWindow: ensRegistration.waitForRegisterWindow,
      isCommitting: ensRegistration.isCommitting,
      isRegistering: ensRegistration.isRegistering,
      commitment: ensRegistration.commitment,
      canRegister: ensRegistration.canRegister,
      error: ensRegistration.error,
    },
  }
}
