import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useState, useCallback, useEffect } from 'react'
import { Address, parseEther, formatEther } from 'viem'
import { baseSepolia } from 'viem/chains'

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
    founders: { address: string; equity: string }[]
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

      // For testing: Mock the business setup process
      // In production, this would:
      // 1. Register ENS name to the business wallet
      // 2. Deploy revenue splitting contracts
      // 3. Configure multi-sig if needed
      
      // Simulate deployment time
      await new Promise(resolve => setTimeout(resolve, 2000))
      
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

      return account
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create business'
      setError(message)
      throw err
    } finally {
      setIsCreating(false)
    }
  }, [authenticated, user, getSmartWallet, getEmbeddedWallet])

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
  }
}