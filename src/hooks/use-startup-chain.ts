import { useCallback, useState } from 'react'
import { useWallets } from '@privy-io/react-auth'
import { Address, createWalletClient, custom, encodeFunctionData } from 'viem'
import { sepolia } from 'viem/chains'

// StartUpChain contract deployed address (new version with fixed isOwner)
const STARTUP_CHAIN_ADDRESS = '0xd2AaDf8F0a74Ad7995fB33CC09f2E4a3a765A575' as const

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

      // Create viem wallet client for contract interactions
      const walletClient = createWalletClient({
        chain: sepolia,
        transport: custom(provider)
      })

      // 1. Register company name
      const registerData = encodeFunctionData({
        abi: STARTUP_CHAIN_ABI,
        functionName: 'registerCompany',
        args: [companyName]
      })

      const registerTxHash = await walletClient.sendTransaction({
        account: embeddedWallet.address as Address,
        to: STARTUP_CHAIN_ADDRESS,
        data: registerData,
        gas: BigInt(500000) // Set sufficient gas limit
      })

      console.log('✅ Company registered:', registerTxHash)

      // 2. Set number of shares
      const setSharesData = encodeFunctionData({
        abi: STARTUP_CHAIN_ABI,
        functionName: 'setNumberOfShares',
        args: [BigInt(numberOfShares)]
      })

      const sharesTxHash = await walletClient.sendTransaction({
        account: embeddedWallet.address as Address,
        to: STARTUP_CHAIN_ADDRESS,
        data: setSharesData,
        gas: BigInt(500000)
      })

      console.log('✅ Number of shares set:', sharesTxHash)

      // 3. Add founders
      const founderTxHashes = []
      for (const founder of foundersData) {
        const addFounderData = encodeFunctionData({
          abi: STARTUP_CHAIN_ABI,
          functionName: 'addFounder',
          args: [founder.name, founder.title, BigInt(founder.percentOwnership)]
        })

        const founderTxHash = await walletClient.sendTransaction({
          account: embeddedWallet.address as Address,
          to: STARTUP_CHAIN_ADDRESS,
          data: addFounderData,
          gas: BigInt(500000)
        })

        founderTxHashes.push(founderTxHash)
        console.log(`✅ Founder ${founder.name} added:`, founderTxHash)
      }

      // 4. Set founders ownership percentage
      const setOwnershipData = encodeFunctionData({
        abi: STARTUP_CHAIN_ABI,
        functionName: 'setFoundersOwnership',
        args: [BigInt(foundersOwnershipPercent)]
      })

      const ownershipTxHash = await walletClient.sendTransaction({
        account: embeddedWallet.address as Address,
        to: STARTUP_CHAIN_ADDRESS,
        data: setOwnershipData,
        gas: BigInt(500000)
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

      const walletClient = createWalletClient({
        chain: sepolia,
        transport: custom(provider)
      })
      
      const createSharesData = encodeFunctionData({
        abi: STARTUP_CHAIN_ABI,
        functionName: 'createStartUpSharesContract',
        args: [BigInt(initialValue)]
      })

      const txHash = await walletClient.sendTransaction({
        account: embeddedWallet.address as Address,
        to: STARTUP_CHAIN_ADDRESS,
        data: createSharesData,
        gas: BigInt(500000)
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

