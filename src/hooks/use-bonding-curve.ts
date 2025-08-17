import { useCallback, useState, useEffect } from 'react'
import { useWallets } from '@privy-io/react-auth'
import { Address, createWalletClient, createPublicClient, custom, encodeFunctionData, decodeFunctionResult, parseEther, formatEther, http } from 'viem'
import { sepolia } from 'viem/chains'

// StartupBondingCurve contract address (to be deployed)
const BONDING_CURVE_ADDRESS = '0x0000000000000000000000000000000000000000' as const // UPDATE AFTER DEPLOYMENT

// Bonding curve contract ABI
const BONDING_CURVE_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "_sharesToken", "type": "address" },
      { "internalType": "string", "name": "_companyName", "type": "string" },
      { "internalType": "address", "name": "_treasury", "type": "address" }
    ],
    "name": "createStartup",
    "outputs": [
      { "internalType": "uint256", "name": "startupId", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "startupId", "type": "uint256" },
      { "internalType": "uint256", "name": "minShares", "type": "uint256" }
    ],
    "name": "buyShares",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "startupId", "type": "uint256" },
      { "internalType": "uint256", "name": "shareAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "minEth", "type": "uint256" }
    ],
    "name": "sellShares",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "supply", "type": "uint256" }
    ],
    "name": "calculatePrice",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "currentSupply", "type": "uint256" },
      { "internalType": "uint256", "name": "shareAmount", "type": "uint256" }
    ],
    "name": "calculatePurchaseCost",
    "outputs": [
      { "internalType": "uint256", "name": "cost", "type": "uint256" },
      { "internalType": "uint256", "name": "fee", "type": "uint256" }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "currentSupply", "type": "uint256" },
      { "internalType": "uint256", "name": "shareAmount", "type": "uint256" }
    ],
    "name": "calculateSaleReturn",
    "outputs": [
      { "internalType": "uint256", "name": "returnAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "fee", "type": "uint256" }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "startupId", "type": "uint256" }
    ],
    "name": "getCurrentPrice",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "startupId", "type": "uint256" }
    ],
    "name": "getMarketCap",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "name": "startups",
    "outputs": [
      { "internalType": "address", "name": "sharesToken", "type": "address" },
      { "internalType": "uint256", "name": "totalSupply", "type": "uint256" },
      { "internalType": "uint256", "name": "reserveBalance", "type": "uint256" },
      { "internalType": "uint256", "name": "tradingVolume", "type": "uint256" },
      { "internalType": "bool", "name": "isActive", "type": "bool" },
      { "internalType": "string", "name": "companyName", "type": "string" },
      { "internalType": "address", "name": "treasury", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

export interface StartupInfo {
  sharesToken: Address
  totalSupply: bigint
  reserveBalance: bigint
  tradingVolume: bigint
  isActive: boolean
  companyName: string
  treasury: Address
}

export interface PriceInfo {
  currentPrice: string // in ETH
  marketCap: string // in ETH
  totalSupply: string
  tradingVolume: string // in ETH
}

export function useBondingCurve() {
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

  // Create public client for reading
  const getPublicClient = useCallback(() => {
    return createPublicClient({
      chain: sepolia,
      transport: http()
    })
  }, [])

  // Create a new startup with bonding curve
  const createStartupWithCurve = useCallback(async (
    sharesToken: Address,
    companyName: string,
    treasury: Address
  ): Promise<number> => {
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

      const createData = encodeFunctionData({
        abi: BONDING_CURVE_ABI,
        functionName: 'createStartup',
        args: [sharesToken, companyName, treasury]
      })

      const txHash = await walletClient.sendTransaction({
        account: embeddedWallet.address as Address,
        to: BONDING_CURVE_ADDRESS,
        data: createData,
        gas: BigInt(500000)
      })

      console.log('✅ Startup created with bonding curve:', txHash)
      
      // TODO: Get startupId from transaction receipt
      return 1 // Placeholder

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create startup'
      setError(message)
      console.error('Startup creation failed:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [getEmbeddedWallet])

  // Buy shares from bonding curve
  const buyShares = useCallback(async (
    startupId: number,
    ethAmount: string,
    minShares: number = 0
  ): Promise<string> => {
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

      const buyData = encodeFunctionData({
        abi: BONDING_CURVE_ABI,
        functionName: 'buyShares',
        args: [BigInt(startupId), BigInt(minShares)]
      })

      const txHash = await walletClient.sendTransaction({
        account: embeddedWallet.address as Address,
        to: BONDING_CURVE_ADDRESS,
        data: buyData,
        value: parseEther(ethAmount),
        gas: BigInt(500000)
      })

      console.log('✅ Shares purchased:', txHash)
      return txHash

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to buy shares'
      setError(message)
      console.error('Share purchase failed:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [getEmbeddedWallet])

  // Sell shares to bonding curve
  const sellShares = useCallback(async (
    startupId: number,
    shareAmount: number,
    minEth: string = '0'
  ): Promise<string> => {
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

      const sellData = encodeFunctionData({
        abi: BONDING_CURVE_ABI,
        functionName: 'sellShares',
        args: [BigInt(startupId), BigInt(shareAmount), parseEther(minEth)]
      })

      const txHash = await walletClient.sendTransaction({
        account: embeddedWallet.address as Address,
        to: BONDING_CURVE_ADDRESS,
        data: sellData,
        gas: BigInt(500000)
      })

      console.log('✅ Shares sold:', txHash)
      return txHash

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sell shares'
      setError(message)
      console.error('Share sale failed:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [getEmbeddedWallet])

  // Calculate purchase cost
  const calculatePurchaseCost = useCallback(async (
    currentSupply: number,
    shareAmount: number
  ): Promise<{ cost: string; fee: string }> => {
    try {
      const publicClient = getPublicClient()
      
      const result = await publicClient.readContract({
        address: BONDING_CURVE_ADDRESS,
        abi: BONDING_CURVE_ABI,
        functionName: 'calculatePurchaseCost',
        args: [BigInt(currentSupply), BigInt(shareAmount)]
      })

      return {
        cost: formatEther(result[0]),
        fee: formatEther(result[1])
      }
    } catch (err) {
      console.error('Failed to calculate purchase cost:', err)
      throw err
    }
  }, [getPublicClient])

  // Calculate sale return
  const calculateSaleReturn = useCallback(async (
    currentSupply: number,
    shareAmount: number
  ): Promise<{ returnAmount: string; fee: string }> => {
    try {
      const publicClient = getPublicClient()
      
      const result = await publicClient.readContract({
        address: BONDING_CURVE_ADDRESS,
        abi: BONDING_CURVE_ABI,
        functionName: 'calculateSaleReturn',
        args: [BigInt(currentSupply), BigInt(shareAmount)]
      })

      return {
        returnAmount: formatEther(result[0]),
        fee: formatEther(result[1])
      }
    } catch (err) {
      console.error('Failed to calculate sale return:', err)
      throw err
    }
  }, [getPublicClient])

  // Get current price info for a startup
  const getPriceInfo = useCallback(async (
    startupId: number
  ): Promise<PriceInfo> => {
    try {
      const publicClient = getPublicClient()
      
      // Get startup info
      const startup = await publicClient.readContract({
        address: BONDING_CURVE_ADDRESS,
        abi: BONDING_CURVE_ABI,
        functionName: 'startups',
        args: [BigInt(startupId)]
      }) as any

      // Get current price
      const currentPrice = await publicClient.readContract({
        address: BONDING_CURVE_ADDRESS,
        abi: BONDING_CURVE_ABI,
        functionName: 'getCurrentPrice',
        args: [BigInt(startupId)]
      })

      // Get market cap
      const marketCap = await publicClient.readContract({
        address: BONDING_CURVE_ADDRESS,
        abi: BONDING_CURVE_ABI,
        functionName: 'getMarketCap',
        args: [BigInt(startupId)]
      })

      return {
        currentPrice: formatEther(currentPrice),
        marketCap: formatEther(marketCap),
        totalSupply: startup.totalSupply.toString(),
        tradingVolume: formatEther(startup.tradingVolume)
      }
    } catch (err) {
      console.error('Failed to get price info:', err)
      throw err
    }
  }, [getPublicClient])

  return {
    createStartupWithCurve,
    buyShares,
    sellShares,
    calculatePurchaseCost,
    calculateSaleReturn,
    getPriceInfo,
    isLoading,
    error,
    contractAddress: BONDING_CURVE_ADDRESS
  }
}