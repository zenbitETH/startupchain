/**
 * Safe Transaction Service API utilities
 * Server-side only - uses SAFE_API_KEY from environment
 */
import { STARTUPCHAIN_CHAIN_ID } from './startupchain-config'

const SAFE_API_KEY = process.env.SAFE_API_KEY

// Chain name mapping for Safe API
function getChainName(chainId: number): string {
  switch (chainId) {
    case 1:
      return 'eth'
    case 11155111:
      return 'sep'
    case 10:
      return 'oeth'
    case 8453:
      return 'base'
    default:
      return 'sep' // Default to Sepolia
  }
}

function getSafeApiBaseUrl(chainId: number = STARTUPCHAIN_CHAIN_ID): string {
  const chainName = getChainName(chainId)
  return `https://api.safe.global/tx-service/${chainName}/api`
}

function getSafeWalletUrl(
  safeAddress: string,
  chainId: number = STARTUPCHAIN_CHAIN_ID
): string {
  const prefix = chainId === 1 ? 'eth' : 'sep'
  return `https://app.safe.global/home?safe=${prefix}:${safeAddress}`
}

export type SafeInfo = {
  address: string
  nonce: number
  threshold: number
  owners: string[]
  masterCopy: string
  modules: string[]
  fallbackHandler: string
  guard: string
  version: string
}

export type SafeBalance = {
  tokenAddress: string | null
  token: {
    name: string
    symbol: string
    decimals: number
    logoUri: string
  } | null
  balance: string
}

export type SafeTransaction = {
  safe: string
  to: string
  value: string
  data: string | null
  operation: number
  safeTxHash: string
  nonce: number
  submissionDate: string
  executionDate: string | null
  isExecuted: boolean
  isSuccessful: boolean | null
  confirmationsRequired: number
  confirmations: {
    owner: string
    submissionDate: string
    signature: string
  }[]
}

export type SafeAllTransactions = {
  count: number
  results: SafeTransactionHistoryItem[]
}

export type SafeTransactionHistoryItem = {
  safe: string
  to: string
  value: string
  txType: string
  executionDate: string | null
  submissionDate: string
  safeTxHash?: string
  txHash?: string
  isExecuted?: boolean
  isSuccessful?: boolean
}

async function safeFetch<T>(url: string): Promise<T | null> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (SAFE_API_KEY) {
      headers['Authorization'] = `Bearer ${SAFE_API_KEY}`
    }

    const response = await fetch(url, {
      headers,
      cache: 'no-store', // Always fetch fresh data for Safe info
    })

    if (!response.ok) {
      console.error(`Safe API error: ${response.status} ${response.statusText}`)
      return null
    }

    return response.json()
  } catch (error) {
    console.error('Safe API fetch error:', error)
    return null
  }
}

/**
 * Get Safe info (owners, threshold, etc.)
 */
export async function getSafeInfo(
  safeAddress: string,
  chainId: number = STARTUPCHAIN_CHAIN_ID
): Promise<SafeInfo | null> {
  const baseUrl = getSafeApiBaseUrl(chainId)
  return safeFetch<SafeInfo>(`${baseUrl}/v1/safes/${safeAddress}/`)
}

/**
 * Get Safe balances (ETH and tokens)
 */
export async function getSafeBalances(
  safeAddress: string,
  chainId: number = STARTUPCHAIN_CHAIN_ID
): Promise<SafeBalance[] | null> {
  const baseUrl = getSafeApiBaseUrl(chainId)
  return safeFetch<SafeBalance[]>(
    `${baseUrl}/v1/safes/${safeAddress}/balances/`
  )
}

/**
 * Get pending (queued) transactions requiring signatures
 */
export async function getPendingTransactions(
  safeAddress: string,
  chainId: number = STARTUPCHAIN_CHAIN_ID
): Promise<SafeTransaction[] | null> {
  const baseUrl = getSafeApiBaseUrl(chainId)
  const result = await safeFetch<{ count: number; results: SafeTransaction[] }>(
    `${baseUrl}/v1/safes/${safeAddress}/multisig-transactions/?executed=false&limit=10`
  )
  return result?.results ?? null
}

/**
 * Get all transactions (history)
 */
export async function getTransactionHistory(
  safeAddress: string,
  chainId: number = STARTUPCHAIN_CHAIN_ID,
  limit: number = 10
): Promise<SafeTransactionHistoryItem[] | null> {
  const baseUrl = getSafeApiBaseUrl(chainId)
  const result = await safeFetch<SafeAllTransactions>(
    `${baseUrl}/v1/safes/${safeAddress}/all-transactions/?limit=${limit}`
  )
  return result?.results ?? null
}

/**
 * Get combined Safe data for dashboard
 */
export async function getSafeDashboardData(
  safeAddress: string,
  chainId: number = STARTUPCHAIN_CHAIN_ID
) {
  const [info, balances, pendingTxs, history] = await Promise.all([
    getSafeInfo(safeAddress, chainId),
    getSafeBalances(safeAddress, chainId),
    getPendingTransactions(safeAddress, chainId),
    getTransactionHistory(safeAddress, chainId, 5),
  ])

  // Calculate total ETH balance
  const ethBalance = balances?.find((b) => b.tokenAddress === null)
  const ethBalanceFormatted = ethBalance
    ? (BigInt(ethBalance.balance) / BigInt(10 ** 18)).toString()
    : '0'
  const ethBalanceWei = ethBalance?.balance ?? '0'

  // Get token balances (excluding native ETH)
  const tokenBalances = balances?.filter((b) => b.tokenAddress !== null) ?? []

  return {
    info,
    ethBalance: ethBalanceFormatted,
    ethBalanceWei,
    tokenBalances,
    pendingTransactions: pendingTxs ?? [],
    transactionHistory: history ?? [],
    safeWalletUrl: getSafeWalletUrl(safeAddress, chainId),
  }
}

export { getSafeWalletUrl }
