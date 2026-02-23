import { STARTUPCHAIN_CHAIN_ID } from './startupchain-config'

const SAFE_CHAIN_PREFIX_BY_ID: Record<number, string> = {
  1: 'eth',
  10: 'oeth',
  8453: 'base',
  11155111: 'sep',
}

export function getSafeChainPrefix(
  chainId: number = STARTUPCHAIN_CHAIN_ID,
): string {
  return SAFE_CHAIN_PREFIX_BY_ID[chainId]
    ?? SAFE_CHAIN_PREFIX_BY_ID[STARTUPCHAIN_CHAIN_ID]
    ?? 'sep'
}

export function getSafeApiBaseUrl(
  chainId: number = STARTUPCHAIN_CHAIN_ID,
): string {
  const chainPrefix = getSafeChainPrefix(chainId)
  return `https://api.safe.global/tx-service/${chainPrefix}/api`
}

export function getSafeWalletUrl(
  safeAddress: string,
  chainId: number = STARTUPCHAIN_CHAIN_ID,
): string {
  const chainPrefix = getSafeChainPrefix(chainId)
  return `https://app.safe.global/home?safe=${chainPrefix}:${safeAddress}`
}

export function getSafeQueueUrl(
  chainId: number,
  safeAddress: string,
): string {
  const chainPrefix = getSafeChainPrefix(chainId)
  return `https://app.safe.global/transactions/queue?safe=${chainPrefix}:${safeAddress}`
}
