import { startupChainAbi } from './startupchain-abi'
import { publicClient } from './startupchain-client'
import {
  DEFAULT_ENS_RESOLVER,
  STARTUPCHAIN_ADDRESS,
} from './startupchain-config'

type CompanyEvent = {
  companyId: string
  ensName: string
  ownerAddress: `0x${string}`
  threshold: number
  blockNumber: bigint
  transactionHash: `0x${string}`
  createdAt?: Date
}

const companyRegisteredEvent = startupChainAbi.find(
  (item) => item.type === 'event' && item.name === 'CompanyRegistered'
)

export async function getCompanyEvents(
  ownerAddress: string | undefined
): Promise<CompanyEvent[]> {
  if (!ownerAddress || !companyRegisteredEvent) return []

  try {
    const logs = await publicClient.getLogs({
      address: STARTUPCHAIN_ADDRESS,
      event: companyRegisteredEvent,
      args: { ownerAddress: ownerAddress as `0x${string}` },
      fromBlock: 0n,
    })

    const blocks = await Promise.all(
      logs.map((log) => publicClient.getBlock({ blockNumber: log.blockNumber }))
    )

    return logs
      .map((log, index) => {
        const parsed = log.args
        const block = blocks[index]
        return {
          companyId: parsed.companyId?.toString() ?? '',
          ownerAddress: parsed.ownerAddress as `0x${string}`,
          ensName: parsed.ensName ?? '',
          threshold: Number(parsed.threshold ?? 1),
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          createdAt: block?.timestamp
            ? new Date(Number(block.timestamp) * 1000)
            : undefined,
        }
      })
      .sort((a, b) => Number(b.blockNumber - a.blockNumber))
  } catch (err) {
    console.error('Failed to fetch company events', err)
    return []
  }
}

export const defaultEnsResolverAddress = DEFAULT_ENS_RESOLVER
