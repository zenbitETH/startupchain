import { startupChainAbi } from './startupchain-abi'
import { STARTUPCHAIN_ADDRESS } from './startupchain-config'
import { publicClient } from './startupchain-client'

export async function getCompanyByAddress(address: string) {
  if (!address) return null

  try {
    const data = await publicClient.readContract({
      address: STARTUPCHAIN_ADDRESS,
      abi: startupChainAbi,
      functionName: 'getCompanyByAddress',
      args: [address as `0x${string}`],
    })

    // Format the result into a nice object
    // The return type of readContract with this ABI will be an array/tuple
    const [id, companyAddress, ensName, creationDate, founders] = data

    return {
      id: id.toString(),
      companyAddress,
      ensName,
      creationDate: new Date(Number(creationDate) * 1000),
      founders,
    }
  } catch {
    // If the contract reverts (e.g., "No company found"), we return null
    return null
  }
}
