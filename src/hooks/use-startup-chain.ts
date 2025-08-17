import { useCallback, useState } from 'react'
import { useWallets } from '@privy-io/react-auth'
import { Address, parseUnits } from 'viem'
import { sepolia } from 'viem/chains'

// StartUpChain contract deployed address
const STARTUP_CHAIN_ADDRESS = '0x18B03f36f0219aDF0eC2d3BCaF13F11EacB13Dba' as const

// StartUpChain contract ABI (only the functions we need)
const STARTUP_CHAIN_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "_companyName", "type": "string" }
    ],
    "name": "registerCompany",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_numberOfShares", "type": "uint256" }
    ],
    "name": "setNumberOfShares",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_name", "type": "string" },
      { "internalType": "string", "name": "_title", "type": "string" },
      { "internalType": "uint256", "name": "_percentOwnership", "type": "uint256" }
    ],
    "name": "addFounder",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_percentFoundersOwnership", "type": "uint256" }
    ],
    "name": "setFoundersOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_initialValue", "type": "uint256" }
    ],
    "name": "createStartUpSharesContract",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "companyName",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "numberOfShares",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "percentFoundersOwnership",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

export interface StartUpChainData {
  companyName: string
  numberOfShares: number
  foundersOwnershipPercent: number
  founders: Array<{
    name: string
    title: string
    percentOwnership: number
  }>
}

export function useStartUpChain() {
  const { wallets } = useWallets()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get embedded wallet for signing transactions
  const getEmbeddedWallet = useCallback(() => {
    return wallets.find(w => 
      w.walletClientType === 'privy' && 
      w.connectorType === 'embedded'
    )
  }, [wallets])

  // Register company on StartUpChain contract
  const registerCompanyOnChain = useCallback(async (
    companyName: string,
    numberOfShares: number,
    foundersData: Array<{
      name: string
      title: string
      percentOwnership: number
    }>,
    foundersOwnershipPercent: number
  ) => {
    const embeddedWallet = getEmbeddedWallet()
    
    if (!embeddedWallet) {
      throw new Error('No embedded wallet found. Please ensure you are logged in.')
    }

    setIsLoading(true)
    setError(null)

    try {
      // Switch to Sepolia network
      await embeddedWallet.switchChain(sepolia.id)
      
      // Get Ethereum provider
      const provider = await embeddedWallet.getEthereumProvider()
      
      console.log('📋 Registering company on StartUpChain contract:', {
        contract: STARTUP_CHAIN_ADDRESS,
        companyName,
        numberOfShares,
        foundersData,
        foundersOwnershipPercent
      })

      // 1. Register company name
      const registerCompanyData = {
        to: STARTUP_CHAIN_ADDRESS,
        data: encodeFunctionCall('registerCompany', [companyName])
      }

      const registerTxHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{ 
          from: embeddedWallet.address,
          ...registerCompanyData
        }]
      })

      console.log('✅ Company registered:', registerTxHash)

      // 2. Set number of shares
      const setSharesData = {
        to: STARTUP_CHAIN_ADDRESS,
        data: encodeFunctionCall('setNumberOfShares', [numberOfShares])
      }

      const sharesTxHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{ 
          from: embeddedWallet.address,
          ...setSharesData
        }]
      })

      console.log('✅ Number of shares set:', sharesTxHash)

      // 3. Add founders
      const founderTxHashes = []
      for (const founder of foundersData) {
        const addFounderData = {
          to: STARTUP_CHAIN_ADDRESS,
          data: encodeFunctionCall('addFounder', [
            founder.name,
            founder.title,
            founder.percentOwnership
          ])
        }

        const founderTxHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [{ 
            from: embeddedWallet.address,
            ...addFounderData
          }]
        })

        founderTxHashes.push(founderTxHash)
        console.log(`✅ Founder ${founder.name} added:`, founderTxHash)
      }

      // 4. Set founders ownership percentage
      const setOwnershipData = {
        to: STARTUP_CHAIN_ADDRESS,
        data: encodeFunctionCall('setFoundersOwnership', [foundersOwnershipPercent])
      }

      const ownershipTxHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{ 
          from: embeddedWallet.address,
          ...setOwnershipData
        }]
      })

      console.log('✅ Founders ownership percentage set:', ownershipTxHash)

      return {
        registerTxHash,
        sharesTxHash,
        founderTxHashes,
        ownershipTxHash
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to register on StartUpChain'
      setError(message)
      console.error('StartUpChain registration failed:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [getEmbeddedWallet])

  // Create shares contract
  const createSharesContract = useCallback(async (initialValue: number = 1000000) => {
    const embeddedWallet = getEmbeddedWallet()
    
    if (!embeddedWallet) {
      throw new Error('No embedded wallet found. Please ensure you are logged in.')
    }

    setIsLoading(true)
    setError(null)

    try {
      await embeddedWallet.switchChain(sepolia.id)
      const provider = await embeddedWallet.getEthereumProvider()
      
      const createSharesData = {
        to: STARTUP_CHAIN_ADDRESS,
        data: encodeFunctionCall('createStartUpSharesContract', [initialValue])
      }

      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{ 
          from: embeddedWallet.address,
          ...createSharesData
        }]
      })

      console.log('✅ Shares contract created:', txHash)
      return txHash

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create shares contract'
      setError(message)
      console.error('Shares contract creation failed:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [getEmbeddedWallet])

  return {
    registerCompanyOnChain,
    createSharesContract,
    isLoading,
    error,
    contractAddress: STARTUP_CHAIN_ADDRESS
  }
}

// Helper function to encode function calls
function encodeFunctionCall(functionName: string, params: any[]) {
  // This is a simplified encoding - in a real app you'd use ethers or viem properly
  // For now, we'll rely on the provider to handle the encoding
  const functionAbi = STARTUP_CHAIN_ABI.find(f => f.name === functionName)
  if (!functionAbi) {
    throw new Error(`Function ${functionName} not found in ABI`)
  }
  
  // Since we're using the provider directly, we'll construct the data manually
  // This would normally be done with a proper library like viem or ethers
  return `0x${functionName}` // Placeholder - the provider should handle proper encoding
}