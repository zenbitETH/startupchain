/**
 * Safe Factory - Deploy company Safes with auto-calculated thresholds
 *
 * Threshold presets:
 * - 1 founder → threshold 1 (solo)
 * - 2 founders → threshold 2 (both sign)
 * - 3-5 founders → ceil(n/2) (e.g., 2 for 3, 3 for 5)
 * - 6+ founders → cap at 5
 */
import SafeApiKit from '@safe-global/api-kit'
import Safe, { type SafeAccountConfig } from '@safe-global/protocol-kit'
import { type Account, type Chain, type PublicClient, type Transport, type WalletClient } from 'viem'
import { mainnet, sepolia } from 'viem/chains'

import { isSupportedChain } from './startupchain-config'

// Chain config mapping
function getChainConfig(chainId: number): { chain: Chain; rpcUrl: string } {
  // Use publicnode as reliable fallback - rpc.sepolia.org is unreliable
  if (chainId === 1) {
    return { chain: mainnet, rpcUrl: 'https://eth.llamarpc.com' }
  }
  return {
    chain: sepolia,
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
  }
}

/**
 * Calculate the optimal threshold for a given number of owners
 */
export function calculateThreshold(ownerCount: number): number {
  if (ownerCount <= 0) {
    throw new Error('At least one owner required')
  }
  if (ownerCount === 1) return 1
  if (ownerCount === 2) return 2
  if (ownerCount <= 5) return Math.ceil(ownerCount / 2)
  // 6+ owners: cap threshold at 5
  return Math.min(5, Math.ceil(ownerCount / 2))
}

/**
 * Get threshold description for UI display
 */
export function getThresholdDescription(
  ownerCount: number,
  threshold: number
): string {
  if (ownerCount === 1) return 'Solo founder'
  return `${threshold} of ${ownerCount} signatures required`
}

export type DeploySafeParams = {
  owners: `0x${string}`[]
  chainId: number
  walletClient: WalletClient<Transport, Chain, Account>
  publicClient: PublicClient
  threshold?: number // Optional override, otherwise auto-calculated
}

export type DeploySafeResult = {
  safeAddress: `0x${string}`
  threshold: number
  owners: `0x${string}`[]
  deploymentTxHash: string
}

/**
 * Deploy a new Safe multisig wallet
 */
export async function deploySafe({
  owners,
  chainId,
  walletClient,
  publicClient,
  threshold: customThreshold,
}: DeploySafeParams): Promise<DeploySafeResult> {
  if (!isSupportedChain(chainId)) {
    throw new Error(`Chain ${chainId} not supported for Safe deployment`)
  }

  if (owners.length === 0) {
    throw new Error('At least one owner required')
  }

  // Validate all owner addresses
  for (const owner of owners) {
    if (!owner || owner === '0x0000000000000000000000000000000000000000') {
      throw new Error('Invalid owner address')
    }
  }

  // Calculate threshold (use custom if provided, otherwise auto-calculate)
  const threshold = customThreshold ?? calculateThreshold(owners.length)

  if (threshold > owners.length) {
    throw new Error('Threshold cannot exceed number of owners')
  }

  // Get signer address
  const [signerAddress] = await walletClient.getAddresses()
  if (!signerAddress) {
    throw new Error('No signer address available')
  }

  const { chain, rpcUrl } = getChainConfig(chainId)

  // Configure Safe account
  const safeAccountConfig: SafeAccountConfig = {
    owners: owners as string[],
    threshold,
  }

  // Initialize Safe with predicted address (counterfactual deployment)
  let protocolKit = await Safe.init({
    provider: rpcUrl,
    signer: signerAddress,
    predictedSafe: {
      safeAccountConfig,
    },
  })

  // Get predicted address before deployment
  const predictedAddress = await protocolKit.getAddress()

  // Create deployment transaction
  const deploymentTransaction =
    await protocolKit.createSafeDeploymentTransaction()

  // Execute the deployment using the passed wallet client (not Safe SDK's internal signer)
  // Safe SDK's getExternalSigner() doesn't work with public RPC nodes that don't support eth_sendTransaction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const txHash = await (walletClient as any).sendTransaction({
    to: deploymentTransaction.to as `0x${string}`,
    value: BigInt(deploymentTransaction.value),
    data: deploymentTransaction.data as `0x${string}`,
    chain,
  }) as `0x${string}`

  // Wait for transaction receipt
  await publicClient.waitForTransactionReceipt({ hash: txHash })

  // Reconnect to the deployed Safe
  protocolKit = await protocolKit.connect({ safeAddress: predictedAddress })

  // Verify deployment
  const isDeployed = await protocolKit.isSafeDeployed()
  if (!isDeployed) {
    throw new Error('Safe deployment verification failed')
  }

  const safeAddress = (await protocolKit.getAddress()) as `0x${string}`

  return {
    safeAddress,
    threshold,
    owners,
    deploymentTxHash: txHash,
  }
}

/**
 * Get Safe API Kit for a specific chain
 */
export function getSafeApiKit(chainId: number): SafeApiKit {
  if (!isSupportedChain(chainId)) {
    throw new Error(`Chain ${chainId} not supported`)
  }

  return new SafeApiKit({
    chainId: BigInt(chainId),
  })
}

/**
 * Predict Safe address before deployment (counterfactual)
 */
export async function predictSafeAddress({
  owners,
  chainId,
  threshold: customThreshold,
}: {
  owners: `0x${string}`[]
  chainId: number
  threshold?: number
}): Promise<`0x${string}`> {
  if (!isSupportedChain(chainId)) {
    throw new Error(`Chain ${chainId} not supported`)
  }

  const threshold = customThreshold ?? calculateThreshold(owners.length)
  const { rpcUrl } = getChainConfig(chainId)

  // Configure Safe account
  const safeAccountConfig: SafeAccountConfig = {
    owners: owners as string[],
    threshold,
  }

  // Initialize Safe with predicted address (no signer needed for prediction)
  const protocolKit = await Safe.init({
    provider: rpcUrl,
    predictedSafe: {
      safeAccountConfig,
    },
  })

  const predictedAddress = await protocolKit.getAddress()
  return predictedAddress as `0x${string}`
}

/**
 * Check if an address is a Safe
 */
export async function isSafeDeployed(
  address: `0x${string}`,
  chainId: number
): Promise<boolean> {
  try {
    const apiKit = getSafeApiKit(chainId)
    await apiKit.getSafeInfo(address)
    return true
  } catch {
    return false
  }
}

/**
 * Get Safe info (owners, threshold, etc.)
 */
export async function getSafeInfo(address: `0x${string}`, chainId: number) {
  const apiKit = getSafeApiKit(chainId)
  return apiKit.getSafeInfo(address)
}

/**
 * Estimate gas for Safe deployment
 * Returns estimated gas in wei
 */
export async function estimateSafeDeploymentGas(
  ownerCount: number
): Promise<bigint> {
  // Base gas for Safe deployment (~250k gas)
  // Additional ~20k per owner
  const baseGas = 250000n
  const perOwnerGas = 20000n
  return baseGas + perOwnerGas * BigInt(ownerCount)
}

/**
 * Types for Safe transaction proposals
 */
export type SafeTransactionData = {
  to: string
  value: string
  data: string
  operation?: 0 | 1 // 0 = Call, 1 = DelegateCall
}

/**
 * Create a Safe transaction proposal
 */
export async function proposeSafeTransaction({
  safeAddress,
  chainId,
  transaction,
  signerAddress,
}: {
  safeAddress: `0x${string}`
  chainId: number
  transaction: SafeTransactionData
  signerAddress: `0x${string}`
}): Promise<string> {
  const apiKit = getSafeApiKit(chainId)
  const { rpcUrl } = getChainConfig(chainId)

  // Get the Safe SDK instance
  const safe = await Safe.init({
    provider: rpcUrl,
    safeAddress,
  })

  // Create the transaction
  const safeTransaction = await safe.createTransaction({
    transactions: [
      {
        to: transaction.to,
        value: transaction.value,
        data: transaction.data,
        operation: transaction.operation ?? 0,
      },
    ],
  })

  // Get transaction hash
  const safeTxHash = await safe.getTransactionHash(safeTransaction)

  // Sign and propose to Safe Transaction Service
  const signature = await safe.signHash(safeTxHash)

  await apiKit.proposeTransaction({
    safeAddress,
    safeTransactionData: safeTransaction.data,
    safeTxHash,
    senderAddress: signerAddress,
    senderSignature: signature.data,
  })

  return safeTxHash
}
