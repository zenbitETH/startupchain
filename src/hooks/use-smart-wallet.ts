import { usePrivy, useWallets, useSmartWallets } from '@privy-io/react-auth'
import { useState, useCallback, useEffect } from 'react'
import { Address, encodeFunctionData, parseEther } from 'viem'
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
  const { client } = useSmartWallets()
  
  const [businessAccount, setBusinessAccount] = useState<BusinessAccount | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get the user's smart wallet address
  const getSmartWalletAddress = useCallback(async () => {
    if (!client) return null
    
    try {
      // The smart wallet client provides the account address
      const address = await client.account?.address
      return address as Address
    } catch (err) {
      console.error('Failed to get smart wallet address:', err)
      return null
    }
  }, [client])

  // Create business account (associates ENS with smart wallet)
  const createBusinessAccount = useCallback(async (
    ensName: string,
    founders: { address: string; equity: string }[]
  ) => {
    if (!authenticated || !user || !client) {
      throw new Error('User must be authenticated with smart wallet')
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
  }, [authenticated, user, client, getSmartWalletAddress])

  // Send transaction from smart wallet
  const sendFromSmartWallet = useCallback(async (
    to: Address,
    value: string
  ) => {
    if (!client) {
      throw new Error('Smart wallet not available')
    }

    try {
      // Use the smart wallet client to send transaction
      // This will be gasless if you have paymaster configured
      const txHash = await client.sendTransaction({
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
  }, [client])

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
    isSmartWalletReady: !!client,
  }
}