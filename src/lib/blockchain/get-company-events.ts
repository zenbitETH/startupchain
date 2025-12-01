import { startupChainAbi } from './startupchain-abi'
import { getPublicClient } from './startupchain-client'
import {
  DEFAULT_ENS_RESOLVER,
  STARTUPCHAIN_CHAIN_ID,
  getStartupChainAddress,
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
  ownerAddress: string | undefined,
  chainId: number = STARTUPCHAIN_CHAIN_ID
): Promise<CompanyEvent[]> {
  if (!ownerAddress || !companyRegisteredEvent) return []

  try {
    const client = getPublicClient(chainId)
    const contractAddress = getStartupChainAddress(chainId)

    // Alchemy free tier only supports 10 block range for eth_getLogs
    // We'll just check the last 10 blocks for now to avoid the error
    // In production with a paid plan, we could scan a larger range or use an indexer
    const currentBlock = await client.getBlockNumber()
    const fromBlock = currentBlock - 9n

    const logs = await client.getLogs({
      address: contractAddress,
      event: companyRegisteredEvent,
      args: { ownerAddress: ownerAddress as `0x${string}` },
      fromBlock: fromBlock > 0n ? fromBlock : 0n,
      toBlock: currentBlock,
    })

    const blocks = await Promise.all(
      logs.map((log) => client.getBlock({ blockNumber: log.blockNumber }))
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
