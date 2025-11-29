import { startupChainAbi } from './startupchain-abi'
import { publicClient } from './startupchain-client'
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
  companyAddress: `0x${string}`
  ensName: string
  creationDate: Date
  safeAddress: `0x${string}`
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

    // Get basic company info
    const data = await publicClient.readContract({
      address: contractAddress,
      abi: startupChainAbi,
      functionName: 'getCompanyByAddress',
      args: [address as `0x${string}`],
    })

    const [id, companyAddress, ensName, creationDate, safeAddress, threshold] =
      data

    // Get founders with equity
    const foundersData = await publicClient.readContract({
      address: contractAddress,
      abi: startupChainAbi,
      functionName: 'getCompanyFounders',
      args: [id],
    })

    const founders: Founder[] = foundersData.map((f) => ({
      wallet: f.wallet,
      equityBps: f.equityBps,
      equityPercent: Number(f.equityBps) / 100, // Convert bps to percentage
      role: f.role,
    }))

    return {
      id: id.toString(),
      companyAddress,
      ensName: ensName.endsWith('.eth') ? ensName : `${ensName}.eth`,
      creationDate: new Date(Number(creationDate) * 1000),
      safeAddress,
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

    // Normalize ENS name (remove .eth if present)
    const normalizedName = ensName.endsWith('.eth')
      ? ensName.slice(0, -4)
      : ensName

    const data = await publicClient.readContract({
      address: contractAddress,
      abi: startupChainAbi,
      functionName: 'getCompanyByENS',
      args: [normalizedName],
    })

    const [id, companyAddress, name, creationDate, safeAddress, threshold] =
      data

    // Get founders with equity
    const foundersData = await publicClient.readContract({
      address: contractAddress,
      abi: startupChainAbi,
      functionName: 'getCompanyFounders',
      args: [id],
    })

    const founders: Founder[] = foundersData.map((f) => ({
      wallet: f.wallet,
      equityBps: f.equityBps,
      equityPercent: Number(f.equityBps) / 100,
      role: f.role,
    }))

    return {
      id: id.toString(),
      companyAddress,
      ensName: name.endsWith('.eth') ? name : `${name}.eth`,
      creationDate: new Date(Number(creationDate) * 1000),
      safeAddress,
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

    const data = await publicClient.readContract({
      address: contractAddress,
      abi: startupChainAbi,
      functionName: 'getCompany',
      args: [companyId],
    })

    const [id, companyAddress, ensName, creationDate, safeAddress, threshold] =
      data

    // Get founders with equity
    const foundersData = await publicClient.readContract({
      address: contractAddress,
      abi: startupChainAbi,
      functionName: 'getCompanyFounders',
      args: [id],
    })

    const founders: Founder[] = foundersData.map((f) => ({
      wallet: f.wallet,
      equityBps: f.equityBps,
      equityPercent: Number(f.equityBps) / 100,
      role: f.role,
    }))

    return {
      id: id.toString(),
      companyAddress,
      ensName: ensName.endsWith('.eth') ? ensName : `${ensName}.eth`,
      creationDate: new Date(Number(creationDate) * 1000),
      safeAddress,
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

    const total = await publicClient.readContract({
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
