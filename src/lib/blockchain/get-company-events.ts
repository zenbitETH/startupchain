import { startupChainAbi } from './startupchain-abi'
import {
  DEFAULT_ENS_RESOLVER,
  STARTUPCHAIN_ADDRESS,
} from './startupchain-config'
import { publicClient } from './startupchain-client'

type CompanyEvent = {
  companyId: string
  ensName: string
  companyAddress: `0x${string}`
  blockNumber: bigint
  transactionHash: `0x${string}`
  createdAt?: Date
  founders: `0x${string}`[]
}

const companyRegisteredEvent = startupChainAbi.find(
  (item) => item.type === 'event' && item.name === 'CompanyRegistered'
)

export async function getCompanyEvents(
  companyAddress: string | undefined
): Promise<CompanyEvent[]> {
  if (!companyAddress || !companyRegisteredEvent) return []

  try {
    const logs = await publicClient.getLogs({
      address: STARTUPCHAIN_ADDRESS,
      event: companyRegisteredEvent,
      args: { companyAddress: companyAddress as `0x${string}` },
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
          companyAddress: parsed.companyAddress as `0x${string}`,
          ensName: parsed.ensName ?? '',
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          createdAt: block?.timestamp
            ? new Date(Number(block.timestamp) * 1000)
            : undefined,
          founders: (parsed.founders ?? []) as `0x${string}`[],
        }
      })
      .sort((a, b) => Number(b.blockNumber - a.blockNumber))
  } catch (err) {
    console.error('Failed to fetch company events', err)
    return []
  }
}

export const defaultEnsResolverAddress = DEFAULT_ENS_RESOLVER
