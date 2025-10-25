import { useCallback, useEffect, useState } from 'react'
import { Address, formatEther, parseEther } from 'viem'
import { baseSepolia, mainnet, sepolia } from 'viem/chains'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

import { useEnsRegistration } from './use-ens-registration'

// Get current environment
const isDevelopment = process.env.NODE_ENV === 'development'
const currentChain = isDevelopment ? sepolia : mainnet

export interface BusinessAccount {
  smartAccountAddress: Address
  ensName: string
  owners: string[]
  ownerEquity: Record<string, number>
  isDeployed: boolean
}

export function useSmartWallet() {
  const { address, isConnected } = useAccount()

  // const { user, authenticated, ready } = usePrivy()
  // const { wallets } = useWallets()

  const [businessAccount, setBusinessAccount] =
    useState<BusinessAccount | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transactionHashes, setTransactionHashes] = useState<{
    commitTx?: string
    registrationTx?: string
  }>({})
  const [showCongratulations, setShowCongratulations] = useState(false)
  const [commitmentCountdown, setCommitmentCountdown] = useState<number | null>(
    null
  )

  // Get ENS registration functionality
  const ensRegistration = useEnsRegistration()

  // Get smart wallet from user's linked accounts
  const getSmartWallet = useCallback(() => {
    if (!address) return null

    // Find smart wallet in linked accounts (configured in Privy dashboard)
    // const smartWallet = user.linkedAccounts?.find(
    //   (account) => account.type === 'smart_wallet'
    // )

    // // Type guard to check if it's a smart wallet with address
    // if (smartWallet && 'address' in smartWallet && smartWallet.address) {
    //   return {
    //     address: smartWallet.address as Address,
    //     smartWalletType:
    //       ('smartWalletType' in smartWallet
    //         ? smartWallet.smartWalletType
    //         : 'safe') || 'safe',
    //   }
    // }

    return null
  }, [address])

  // Get embedded wallet for signing
  // const getEmbeddedWallet = useCallback(() => {
  //   return wallets.find(
  //     (w) => w.walletClientType === 'privy' && w.connectorType === 'embedded'
  //   )
  // }, [wallets])

  // Create business account (associates ENS with smart wallet)
  const createBusinessAccount = useCallback(
    async (
      ensName: string,
      founders: { address: string; equity: string }[],
      registrationAddress?: string
    ) => {
      if (!isConnected || !address) {
        throw new Error('User must be authenticated')
      }

      setIsCreating(true)
      setError(null)

      try {
        // Check if user has a smart wallet or embedded wallet
        const smartWallet = null // getSmartWallet()
        const embeddedWallet = null // getEmbeddedWallet()

        let businessWalletAddress: Address

        if (smartWallet) {
          // User has a smart wallet (Safe) - use it as business wallet
          businessWalletAddress = address //smartWallet?.address
          console.log(
            '🏦 Using existing Smart Wallet (Safe) as business wallet:',
            businessWalletAddress
          )
        } else if (embeddedWallet) {
          // User has embedded wallet - use it as business wallet for now
          businessWalletAddress = address // embeddedWallet?.address as Address
          console.log(
            '👤 Using embedded wallet as business wallet:',
            businessWalletAddress
          )
        } else {
          throw new Error('No wallet found. Please ensure you are logged in.')
        }

        console.log('🏢 Creating business account:', {
          businessWallet: businessWalletAddress,
          ensName,
          founders,
          walletType: smartWallet ? 'Smart Wallet (Safe)' : 'Embedded Wallet',
        })

        // ENS Registration on Sepolia (Real transactions!)
        console.log('📝 Starting real ENS registration on Sepolia...')
        console.log(
          '💧 Make sure you have Sepolia ETH: https://sepoliafaucet.com/'
        )

        try {
          // Real ENS registration on Sepolia
          try {
            console.log(`🔍 Checking availability for "${ensName}"...`)
            const isAvailable = await ensRegistration.checkAvailability(ensName)
            if (!isAvailable) {
              throw new Error(
                `ENS name "${ensName}" is not available for registration`
              )
            }
            console.log(`✅ "${ensName}" is available for registration!`)

            console.log('🔐 Making ENS commitment...')
            const commitTxHash = await ensRegistration.makeCommitment({
              name: ensName,
              durationYears: 1,
              reverseRecord: true,
              owner: registrationAddress as Address,
            })

            console.log('⏳ Waiting for commitment period (61 seconds)...')
            console.log(
              '⚠️ You can close this and check back later - the process will continue'
            )

            // Wait 61 seconds for commitment period with UI countdown
            setCommitmentCountdown(61)
            for (let i = 61; i > 0; i--) {
              setCommitmentCountdown(i)
              console.log(`⏳ ${i} seconds remaining...`)
              await new Promise((resolve) => setTimeout(resolve, 1000))
            }
            setCommitmentCountdown(null)
            console.log('✅ Commitment period complete!')

            console.log('📝 Registering ENS name...')
            const registrationTxHash = await ensRegistration.register({
              name: ensName,
              durationYears: 1,
              reverseRecord: true,
              owner: registrationAddress as Address,
            })

            // Store transaction hashes
            setTransactionHashes({
              commitTx: commitTxHash,
              registrationTx: registrationTxHash,
            })

            console.log('✅ ENS name registered successfully!')
          } catch (ensError) {
            console.error('ENS registration failed:', ensError)
            console.log('⚠️ Continuing with business creation without ENS...')
            // Continue without ENS registration
          }
        } catch (ensError) {
          console.error('ENS registration failed:', ensError)
          console.log('⚠️ Continuing with business creation without ENS...')
        }

        // Step 5: Deploy business contracts (future implementation)
        // TODO: Deploy revenue splitting contracts
        // TODO: Configure multi-sig if needed

        const account: BusinessAccount = {
          smartAccountAddress: address,
          ensName: `${ensName}.eth`,
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
        localStorage.setItem(`business-${address}`, JSON.stringify(account))

        // Show congratulations modal
        setShowCongratulations(true)

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
    [isConnected, address, ensRegistration]
  )

  // Send transaction from business wallet
  const sendFromBusinessWallet = useCallback(
    async (to: Address, value: string) => {
      const embeddedWallet = null // getEmbeddedWallet()

      if (!embeddedWallet) {
        throw new Error('Business wallet not available')
      }

      try {
        const businessWallet = getSmartWallet()

        console.log('💸 Sending from business wallet:', {
          from: address, // businessWallet?.address || address, // embeddedWallet.address,
          to,
          value: `${value} ETH`,
          walletType: businessWallet ? 'Smart Wallet' : 'Embedded Wallet',
        })

        // Switch to correct chain
        // await embeddedWallet.switchChain(baseSepolia.id)

        // // Get Ethereum provider
        // const provider = await embeddedWallet.getEthereumProvider()

        // Send transaction using the provider
        // const txHash = await provider.request({
        //   method: 'eth_sendTransaction',
        //   params: [
        //     {
        //       from: address, // embeddedWallet.address,
        //       to,
        //       value: `0x${parseEther(value).toString(16)}`,
        //     },
        //   ],
        // })

        // console.log('✅ Transaction sent:', txHash)
        // return txHash
      } catch (err) {
        console.error('Failed to send transaction:', err)
        throw err
      }
    },
    [getSmartWallet, address]
  )

  // Get business wallet balance
  const getBusinessWalletBalance = useCallback(async () => {
    const smartWallet = getSmartWallet()
    const embeddedWallet = null //getEmbeddedWallet()

    const businessAddress = address // smartWallet?.address || embeddedWallet?.address
    if (!businessAddress) return null

    try {
      // if (!embeddedWallet) return null
      // await embeddedWallet.switchChain(baseSepolia.id)
      // const provider = await embeddedWallet.getEthereumProvider()
      // const balance = await provider.request({
      //   method: 'eth_getBalance',
      //   params: [businessAddress, 'latest'],
      // })
      // return formatEther(BigInt(balance as string))
    } catch (err) {
      console.error('Failed to get balance:', err)
      return null
    }
  }, [address, getSmartWallet])

  // Load existing business account
  useEffect(() => {
    if (address && isConnected) {
      const stored = localStorage.getItem(`business-${address}`)
      if (stored) {
        setBusinessAccount(JSON.parse(stored))
      }
    }
  }, [address, isConnected])

  const smartWallet = getSmartWallet()
  // const embeddedWallet = getEmbeddedWallet()

  return {
    businessAccount,
    businessWalletAddress: address,
    // smartWallet?.address || embeddedWallet?.address || null,
    createBusinessAccount,
    sendFromBusinessWallet,
    getBusinessWalletBalance,
    isCreating,
    error,
    hasSmartWallet: !!smartWallet,
    hasEmbeddedWallet: !!address, // embeddedWallet,
    isWalletReady: !!(smartWallet || address), // embeddedWallet
    transactionHashes,
    showCongratulations,
    setShowCongratulations,
    commitmentCountdown,
    // ENS registration functionality
    ensRegistration: {
      checkAvailability: ensRegistration.checkAvailability,
      getRegistrationCost: ensRegistration.getRegistrationCost,
      checkWalletBalance: ensRegistration.checkWalletBalance,
      isCommitting: ensRegistration.isCommitting,
      isRegistering: ensRegistration.isRegistering,
      commitment: ensRegistration.commitment,
      canRegister: ensRegistration.canRegister,
      error: ensRegistration.error,
    },
  }
}
