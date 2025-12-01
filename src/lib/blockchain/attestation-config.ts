import type { SupportedChainId } from './startupchain-config'

/**
 * EAS (Ethereum Attestation Service) contract addresses per chain
 * @see https://docs.attest.sh/docs/quick--start/contracts
 */
export const EAS_ADDRESSES: Record<SupportedChainId, `0x${string}`> = {
  1: '0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587', // Mainnet
  11155111: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e', // Sepolia
}

/**
 * EAS Schema Registry addresses per chain
 */
export const EAS_SCHEMA_REGISTRY_ADDRESSES: Record<
  SupportedChainId,
  `0x${string}`
> = {
  1: '0xA7b39296258348C78294F95B872b282326A97BDF', // Mainnet
  11155111: '0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0', // Sepolia
}

/**
 * AttestationModule contract addresses per chain
 * Set to zero address until deployed
 */
export const ATTESTATION_MODULE_ADDRESSES: Record<
  SupportedChainId,
  `0x${string}`
> = {
  1: '0x0000000000000000000000000000000000000000', // Not deployed yet
  11155111: '0x0000000000000000000000000000000000000000', // TODO: Update after deployment
}

/**
 * EAS Explorer URLs per chain
 */
export const EAS_EXPLORER_URLS: Record<SupportedChainId, string> = {
  1: 'https://easscan.org',
  11155111: 'https://sepolia.easscan.org',
}

/**
 * Get the EAS contract address for a given chain
 */
export function getEasAddress(chainId: SupportedChainId): `0x${string}` {
  return EAS_ADDRESSES[chainId]
}

/**
 * Get the EAS Schema Registry address for a given chain
 */
export function getEasSchemaRegistryAddress(
  chainId: SupportedChainId
): `0x${string}` {
  return EAS_SCHEMA_REGISTRY_ADDRESSES[chainId]
}

/**
 * Get the AttestationModule contract address for a given chain
 */
export function getAttestationModuleAddress(
  chainId: SupportedChainId
): `0x${string}` {
  return ATTESTATION_MODULE_ADDRESSES[chainId]
}

/**
 * Get the EAS Explorer URL for viewing attestations
 */
export function getEasExplorerUrl(chainId: SupportedChainId): string {
  return EAS_EXPLORER_URLS[chainId]
}

/**
 * Build URL to view an attestation on EAS Explorer
 */
export function getAttestationUrl(
  chainId: SupportedChainId,
  uid: string
): string {
  return `${EAS_EXPLORER_URLS[chainId]}/attestation/view/${uid}`
}

/**
 * Build URL to view a schema on EAS Explorer
 */
export function getSchemaUrl(chainId: SupportedChainId, uid: string): string {
  return `${EAS_EXPLORER_URLS[chainId]}/schema/view/${uid}`
}

/**
 * Check if AttestationModule is deployed on a given chain
 */
export function isAttestationModuleDeployed(
  chainId: SupportedChainId
): boolean {
  const address = ATTESTATION_MODULE_ADDRESSES[chainId]
  return address !== '0x0000000000000000000000000000000000000000'
}
