import { startupChainAbi } from './startupchain-abi'
import { getPublicClient } from './startupchain-client'
import {
  STARTUPCHAIN_CHAIN_ID,
  getStartupChainAddress,
} from './startupchain-config'

export type Founder = {
  wallet: `0x${string}`
  equityBps: bigint
  equityPercent: number
  role: string
}

export type Company = {
  id: string
  ownerAddress: `0x${string}`
  safeAddress: `0x${string}`
  ensName: string
  creationDate: Date
  threshold: number
  founders: Founder[]
}

export async function getCompanyByAddress(
  address: string,
  chainId: number = STARTUPCHAIN_CHAIN_ID
): Promise<Company | null> {
  if (!address) return null

  try {
    const contractAddress = getStartupChainAddress(chainId)
    const client = getPublicClient(chainId)

    // Get basic company info
    const data = await client.readContract({
      address: contractAddress,
      abi: startupChainAbi,
      functionName: 'getCompanyByAddress',
      args: [address as `0x${string}`],
    })

    const [id, ownerAddress, ensName, creationDate, safeAddress, threshold] =
      data

    // Get founders with equity
    const foundersData = await client.readContract({
      address: contractAddress,
      abi: startupChainAbi,
      functionName: 'getCompanyFounders',
      args: [id],
    })

    const founders = foundersData.map(
      (f): Founder => ({
        wallet: f.wallet as Founder['wallet'],
        equityBps: f.equityBps,
        equityPercent: Number(f.equityBps) / 100, // Convert bps to percentage
        role: f.role,
      })
    )

    return {
      id: id.toString(),
      ownerAddress: ownerAddress as Company['ownerAddress'],
      safeAddress: safeAddress as Company['safeAddress'],
      ensName: ensName.endsWith('.eth') ? ensName : `${ensName}.eth`,
      creationDate: new Date(Number(creationDate) * 1000),
      threshold: Number(threshold),
      founders,
    }
  } catch {
    // If the contract reverts (e.g., "No company found"), we return null
    return null
  }
}

export async function getCompanyByENS(
  ensName: string,
  chainId: number = STARTUPCHAIN_CHAIN_ID
): Promise<Company | null> {
  if (!ensName) return null

  try {
    const contractAddress = getStartupChainAddress(chainId)
    const client = getPublicClient(chainId)

    // Normalize ENS name (remove .eth if present)
    const normalizedName = ensName.endsWith('.eth')
      ? ensName.slice(0, -4)
      : ensName

    const data = await client.readContract({
      address: contractAddress,
      abi: startupChainAbi,
      functionName: 'getCompanyByENS',
      args: [normalizedName],
    })

    const [id, ownerAddress, name, creationDate, safeAddress, threshold] = data

    // Get founders with equity
    const foundersData = await client.readContract({
      address: contractAddress,
      abi: startupChainAbi,
      functionName: 'getCompanyFounders',
      args: [id],
    })

    const founders = foundersData.map(
      (f): Founder => ({
        wallet: f.wallet as Founder['wallet'],
        equityBps: f.equityBps,
        equityPercent: Number(f.equityBps) / 100,
        role: f.role,
      })
    )

    return {
      id: id.toString(),
      ownerAddress: ownerAddress as Company['ownerAddress'],
      safeAddress: safeAddress as Company['safeAddress'],
      ensName: ensName.endsWith('.eth') ? ensName : `${ensName}.eth`,
      creationDate: new Date(Number(creationDate) * 1000),
      threshold: Number(threshold),
      founders,
    }
  } catch {
    return null
  }
}

export async function getCompanyById(
  companyId: bigint,
  chainId: number = STARTUPCHAIN_CHAIN_ID
): Promise<Company | null> {
  try {
    const contractAddress = getStartupChainAddress(chainId)
    const client = getPublicClient(chainId)

    const data = await client.readContract({
      address: contractAddress,
      abi: startupChainAbi,
      functionName: 'getCompany',
      args: [companyId],
    })

    const [id, ownerAddress, ensName, creationDate, safeAddress, threshold] =
      data

    // Get founders with equity
    const foundersData = await client.readContract({
      address: contractAddress,
      abi: startupChainAbi,
      functionName: 'getCompanyFounders',
      args: [id],
    })

    const founders = foundersData.map(
      (f): Founder => ({
        wallet: f.wallet as Founder['wallet'],
        equityBps: f.equityBps,
        equityPercent: Number(f.equityBps) / 100,
        role: f.role,
      })
    )

    return {
      id: id.toString(),
      ownerAddress: ownerAddress as Company['ownerAddress'],
      safeAddress: safeAddress as Company['safeAddress'],
      ensName: ensName.endsWith('.eth') ? ensName : `${ensName}.eth`,
      creationDate: new Date(Number(creationDate) * 1000),
      threshold: Number(threshold),
      founders,
    }
  } catch {
    return null
  }
}

export async function getTotalCompanies(
  chainId: number = STARTUPCHAIN_CHAIN_ID
): Promise<number> {
  try {
    const contractAddress = getStartupChainAddress(chainId)
    const client = getPublicClient(chainId)

    const total = await client.readContract({
      address: contractAddress,
      abi: startupChainAbi,
      functionName: 'getTotalCompanies',
      args: [],
    })

    return Number(total)
  } catch {
    return 0
  }
}

/**
 * Find a company where the given wallet is listed as a founder.
 * This iterates through companies starting from the most recent.
 * Returns the first company found where the wallet is a founder.
 */
export async function getCompanyByFounderWallet(
  founderWallet: string,
  chainId: number = STARTUPCHAIN_CHAIN_ID
): Promise<Company | null> {
  if (!founderWallet) return null

  try {
    const totalCompanies = await getTotalCompanies(chainId)
    if (totalCompanies === 0) return null

    const normalizedWallet = founderWallet.toLowerCase()

    // Iterate from most recent company backwards (more likely to find recent registrations first)
    for (let i = totalCompanies; i >= 1; i--) {
      const company = await getCompanyById(BigInt(i), chainId)
      if (!company) continue

      // Check if the wallet is a founder in this company
      const isFounder = company.founders.some(
        (founder) => founder.wallet.toLowerCase() === normalizedWallet
      )

      if (isFounder) {
        return company
      }
    }

    return null
  } catch {
    return null
  }
}
