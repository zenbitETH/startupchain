import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useState, useCallback, useEffect } from 'react'
import { Address, parseEther } from 'viem'
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

  // Get the user's smart wallet (Safe account)
  const getSmartWalletAddress = useCallback(async () => {
    // When using Privy with Smart Wallets enabled,
    // the first wallet in the array is the Smart Account
    const smartWallet = wallets.find(w => 
      w.walletClientType === 'privy' && 
      w.connectorType === 'embedded'
    )
    
    if (!smartWallet) return null
    
    try {
      await smartWallet.switchChain(baseSepolia.id)
      return smartWallet.address as Address
    } catch (err) {
      console.error('Failed to get smart wallet address:', err)
      return null
    }
  }, [wallets])

  // Create business account (associates ENS with smart wallet)
  const createBusinessAccount = useCallback(async (
    ensName: string,
    founders: { address: string; equity: string }[]
  ) => {
    if (!authenticated || !user || !wallets.length) {
      throw new Error('User must be authenticated')
    }

    setIsCreating(true)
    setError(null)

    try {
      // Get the smart wallet address
      const smartWalletAddress = await getSmartWalletAddress()
      if (!smartWalletAddress) {
        throw new Error('Could not get smart wallet address')
      }

      console.log('🏢 Creating business account:', {
        smartWallet: smartWalletAddress,
        ensName,
        founders,
      })

      // For testing: Mock the business setup process
      // In production, this would:
      // 1. Register ENS name to the smart wallet
      // 2. Deploy revenue splitting contracts
      // 3. Configure multi-sig if needed

      await new Promise(resolve => setTimeout(resolve, 1500))

      const account: BusinessAccount = {
        smartAccountAddress: smartWalletAddress,
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
  }, [authenticated, user, wallets, getSmartWalletAddress])

  // Send transaction from smart wallet
  const sendFromSmartWallet = useCallback(async (
    to: Address,
    value: string
  ) => {
    const smartWallet = wallets.find(w => 
      w.walletClientType === 'privy' && 
      w.connectorType === 'embedded'
    )
    
    if (!smartWallet) {
      throw new Error('Smart wallet not available')
    }

    try {
      // Get wallet client from the smart wallet
      const provider = await smartWallet.getEthereumProvider()
      const walletClient = await smartWallet.getWalletClient()
      
      // Send transaction (will be gasless with Biconomy paymaster)
      const txHash = await walletClient.sendTransaction({
        to,
        value: parseEther(value),
        chain: baseSepolia,
      })

      console.log('✅ Transaction sent:', txHash)
      return txHash
    } catch (err) {
      console.error('Failed to send transaction:', err)
      throw err
    }
  }, [wallets])

  // Load existing business account
  useEffect(() => {
    if (user && ready) {
      const stored = localStorage.getItem(`business-${user.id}`)
      if (stored) {
        setBusinessAccount(JSON.parse(stored))
      }
    }
  }, [user, ready])

  return {
    businessAccount,
    createBusinessAccount,
    sendFromSmartWallet,
    isCreating,
    error,
    isSmartWalletReady: wallets.some(w => w.walletClientType === 'privy'),
  }
}
