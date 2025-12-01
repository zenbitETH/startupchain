import { publicClient } from '@/lib/blockchain/startupchain-client'

const STARTUPCHAIN_ADDRESS = process.env
  .NEXT_PUBLIC_STARTUPCHAIN_ADDRESS as `0x${string}`

if (!STARTUPCHAIN_ADDRESS)
  throw new Error('Missing NEXT_PUBLIC_STARTUPCHAIN_ADDRESS')

export async function getCompanyByAddress(address: string) {
  if (!address) return null

  try {
    const data = await publicClient.readContract({
      address: STARTUPCHAIN_ADDRESS,
      abi: [
        {
          inputs: [{ name: '_address', type: 'address' }],
          name: 'getCompanyByAddress',
          outputs: [
            { name: 'id', type: 'uint256' },
            { name: 'companyAddress', type: 'address' },
            { name: 'ensName', type: 'string' },
            { name: 'creationDate', type: 'uint256' },
            { name: 'founders', type: 'address[]' },
          ],
          stateMutability: 'view',
          type: 'function',
        },
      ],
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
