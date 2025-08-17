import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useState, useCallback, useEffect } from 'react'
import { Address, parseEther, formatEther } from 'viem'
import { baseSepolia, sepolia, mainnet } from 'viem/chains'
import { useEnsRegistration } from './use-ens-registration'
import { useStartUpChain } from './use-startup-chain'

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
  const { user, authenticated, ready } = usePrivy()
  const { wallets } = useWallets()
  
  const [businessAccount, setBusinessAccount] = useState<BusinessAccount | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transactionHashes, setTransactionHashes] = useState<{
    commitTx?: string
    registrationTx?: string
    startupChainTxs?: {
      registerTx?: string
      sharesTx?: string
      founderTxs?: string[]
      ownershipTx?: string
    }
  }>({})
  const [showCongratulations, setShowCongratulations] = useState(false)
  const [commitmentCountdown, setCommitmentCountdown] = useState<number | null>(null)
  const [startupChainProgress, setStartupChainProgress] = useState<{
    step: string
    completed: string[]
    current?: string
    error?: string
  } | null>(null)

  // Get ENS registration functionality
  const ensRegistration = useEnsRegistration()
  
  // Get StartUpChain contract functionality
  const startUpChain = useStartUpChain()

  // Get smart wallet from user's linked accounts
  const getSmartWallet = useCallback(() => {
    if (!user) return null
    
    // Find smart wallet in linked accounts (configured in Privy dashboard)
    const smartWallet = user.linkedAccounts?.find(
      account => account.type === 'smart_wallet'
    )
    
    // Type guard to check if it's a smart wallet with address
    if (smartWallet && 'address' in smartWallet && smartWallet.address) {
      return {
        address: smartWallet.address as Address,
        smartWalletType: ('smartWalletType' in smartWallet ? smartWallet.smartWalletType : 'safe') || 'safe'
      }
    }
    
    return null
  }, [user])

  // Get embedded wallet for signing
  const getEmbeddedWallet = useCallback(() => {
    return wallets.find(w => 
      w.walletClientType === 'privy' && 
      w.connectorType === 'embedded'
    )
  }, [wallets])

  // Create business account (associates ENS with smart wallet)
  const createBusinessAccount = useCallback(async (
    ensName: string,
    founders: { address: string; equity: string }[],
    registrationAddress?: string
  ) => {
    if (!authenticated || !user) {
      throw new Error('User must be authenticated')
    }

    setIsCreating(true)
    setError(null)

    try {
      // Check if user has a smart wallet or embedded wallet
      const smartWallet = getSmartWallet()
      const embeddedWallet = getEmbeddedWallet()

      let businessWalletAddress: Address

      if (smartWallet) {
        // User has a smart wallet (Safe) - use it as business wallet
        businessWalletAddress = smartWallet.address
        console.log('🏦 Using existing Smart Wallet (Safe) as business wallet:', businessWalletAddress)
      } else if (embeddedWallet) {
        // User has embedded wallet - use it as business wallet for now
        businessWalletAddress = embeddedWallet.address as Address
        console.log('👤 Using embedded wallet as business wallet:', businessWalletAddress)
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
      console.log('💧 Make sure you have Sepolia ETH: https://sepoliafaucet.com/')
      
      try {
        // Real ENS registration on Sepolia
        try {
          console.log(`🔍 Checking availability for "${ensName}"...`)
          const isAvailable = await ensRegistration.checkAvailability(ensName)
          if (!isAvailable) {
            throw new Error(`ENS name "${ensName}" is not available for registration`)
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
          console.log('⚠️ You can close this and check back later - the process will continue')
          
          // Wait 61 seconds for commitment period with UI countdown
          setCommitmentCountdown(61)
          for (let i = 61; i > 0; i--) {
            setCommitmentCountdown(i)
            console.log(`⏳ ${i} seconds remaining...`)
            await new Promise(resolve => setTimeout(resolve, 1000))
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
            registrationTx: registrationTxHash
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

      // Step 5: Register company on StartUpChain contract (fixed version)
      try {
        console.log('🔗 Registering company on StartUpChain contract...')
        
        // Initialize progress tracking
        setStartupChainProgress({
          step: 'Starting StartUpChain registration...',
          completed: [],
          current: 'Preparing data'
        })
        
        // Calculate total founder ownership percentage
        const totalFounderOwnership = founders.reduce((sum, f) => sum + parseFloat(f.equity), 0)
        
        // Convert founders data to the format expected by StartUpChain
        const startupChainFounders = founders.map((founder, index) => ({
          name: `Founder ${index + 1}`, // Using generic names as we don't have names in the current form
          title: 'Founder', // Generic title
          percentOwnership: Math.round(parseFloat(founder.equity))
        }))
        
        // Default number of shares (can be made configurable later)
        const numberOfShares = 1000000
        
        setStartupChainProgress({
          step: 'Registering on StartUpChain...',
          completed: [],
          current: 'Writing to blockchain'
        })
        
        const startupChainTxs = await startUpChain.registerCompanyOnChain(
          ensName,
          numberOfShares,
          startupChainFounders,
          Math.round(totalFounderOwnership)
        )
        
        // Update transaction hashes
        setTransactionHashes(prev => ({
          ...prev,
          startupChainTxs: {
            registerTx: startupChainTxs.registerTxHash,
            sharesTx: startupChainTxs.sharesTxHash,
            founderTxs: startupChainTxs.founderTxHashes,
            ownershipTx: startupChainTxs.ownershipTxHash
          }
        }))
        
        setStartupChainProgress({
          step: 'StartUpChain registration complete!',
          completed: [
            '✅ Company registered',
            '✅ Shares allocated',
            `✅ ${startupChainFounders.length} founders added`,
            '✅ Ownership percentages set'
          ],
          current: undefined
        })
        
        console.log('✅ Company registered on StartUpChain contract!')
      } catch (startupChainError) {
        console.error('StartUpChain registration failed:', startupChainError)
        setStartupChainProgress({
          step: 'StartUpChain registration failed',
          completed: [],
          error: startupChainError instanceof Error ? startupChainError.message : 'Unknown error'
        })
        console.log('⚠️ Continuing with business creation without StartUpChain registration...')
        // Continue without StartUpChain registration - this is optional
      }

      // Step 6: Deploy additional contracts (future implementation)
      // TODO: Deploy revenue splitting contracts
      // TODO: Configure multi-sig if needed
      
      const account: BusinessAccount = {
        smartAccountAddress: businessWalletAddress,
        ensName: `${ensName}.eth`,
        owners: founders.map(f => f.address),
        ownerEquity: founders.reduce((acc, f) => {
          acc[f.address] = parseFloat(f.equity)
          return acc
        }, {} as Record<string, number>),
        isDeployed: true,
      }

      setBusinessAccount(account)
      
      // Persist to localStorage
      localStorage.setItem(
        `business-${user.id}`,
        JSON.stringify(account)
      )
      
      // Show congratulations modal
      setShowCongratulations(true)

      return account
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create business'
      setError(message)
      throw err
    } finally {
      setIsCreating(false)
    }
  }, [authenticated, user, getSmartWallet, getEmbeddedWallet, ensRegistration, startUpChain])

  // Send transaction from business wallet
  const sendFromBusinessWallet = useCallback(async (
    to: Address,
    value: string
  ) => {
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
        params: [{
          from: embeddedWallet.address,
          to,
          value: `0x${parseEther(value).toString(16)}`,
        }]
      })

      console.log('✅ Transaction sent:', txHash)
      return txHash
    } catch (err) {
      console.error('Failed to send transaction:', err)
      throw err
    }
  }, [getSmartWallet, getEmbeddedWallet])

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
        params: [businessAddress, 'latest']
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
    businessWalletAddress: smartWallet?.address || embeddedWallet?.address || null,
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
    commitmentCountdown,
    startupChainProgress,
    setStartupChainProgress,
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