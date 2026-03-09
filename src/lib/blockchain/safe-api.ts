/**
 * Safe Transaction Service API utilities
 * Server-side only - uses SAFE_API_KEY from environment
 */
import pLimit from 'p-limit'

import {
  getSafeApiBaseUrl,
  getSafeWalletUrl as getSafeWalletUrlFromLinks,
} from './safe-links'
import { STARTUPCHAIN_CHAIN_ID } from './startupchain-config'

// Rate limiting config
const MAX_RETRIES = 3
const INITIAL_BACKOFF_MS = 1000

// Limit concurrent Safe API requests to avoid 429 errors
const limit = pLimit(2)

/**
 * Simple delay utility
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
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

type SafeFetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: 'auth_error' | 'unavailable'; statusCode?: number }

export type SafeOwnershipVerificationResult =
  | {
      status: 'ok'
      safeInfo: SafeInfo
    }
  | {
      status: 'auth_error'
      statusCode: 401 | 403
    }
  | {
      status: 'unavailable'
      statusCode?: number
    }

function getSafeApiKey(): string | undefined {
  return process.env.SAFE_API_KEY?.trim() || undefined
}

async function safeFetchDetailed<T>(url: string): Promise<SafeFetchResult<T>> {
  return limit(async () => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    const safeApiKey = getSafeApiKey()
    if (safeApiKey) {
      headers['Authorization'] = `Bearer ${safeApiKey}`
    }

    let lastError: Error | null = null
    let lastRetryStatus: number | undefined

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          headers,
          next: { revalidate: 30 }, // Cache for 30 seconds
        })

        if (response.ok) {
          return {
            ok: true,
            data: (await response.json()) as T,
          }
        }

        if (response.status === 401 || response.status === 403) {
          console.error(
            `Safe API authorization error: ${response.status} ${response.statusText}`
          )
          return {
            ok: false,
            reason: 'auth_error',
            statusCode: response.status as 401 | 403,
          }
        }

        // Retry rate limits and server-side failures with exponential backoff.
        if (response.status === 429 || response.status >= 500) {
          lastRetryStatus = response.status
          const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt)
          console.warn(
            `Safe API error ${response.status}, retrying in ${backoffMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
          )
          await delay(backoffMs)
          continue
        }

        console.error(
          `Safe API error: ${response.status} ${response.statusText}`
        )
        return {
          ok: false,
          reason: 'unavailable',
          statusCode: response.status,
        }
      } catch (error) {
        lastError = error as Error
        const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt)
        console.warn(
          `Safe API network error, retrying in ${backoffMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
        )
        await delay(backoffMs)
      }
    }

    console.error('Safe API fetch error after retries:', lastError)
    return {
      ok: false,
      reason: 'unavailable',
      statusCode: lastRetryStatus,
    }
  })
}

async function safeFetch<T>(url: string): Promise<T | null> {
  const result = await safeFetchDetailed<T>(url)
  return result.ok ? result.data : null
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
 * Get Safe info while preserving auth vs availability failures for proposal flows.
 */
export async function getSafeInfoForVerification(
  safeAddress: string,
  chainId: number = STARTUPCHAIN_CHAIN_ID
): Promise<SafeOwnershipVerificationResult> {
  const baseUrl = getSafeApiBaseUrl(chainId)
  const result = await safeFetchDetailed<SafeInfo>(
    `${baseUrl}/v1/safes/${safeAddress}/`
  )

  if (result.ok) {
    return {
      status: 'ok',
      safeInfo: result.data,
    }
  }

  if (result.reason === 'auth_error') {
    return {
      status: 'auth_error',
      statusCode: result.statusCode as 401 | 403,
    }
  }

  return {
    status: 'unavailable',
    statusCode: result.statusCode,
  }
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
    safeWalletUrl: getSafeWalletUrlFromLinks(safeAddress, chainId),
  }
}

export { getSafeWalletUrlFromLinks as getSafeWalletUrl }
