import { getPrice } from '@ensdomains/ensjs/public'
import { RegistrationParameters } from '@ensdomains/ensjs/utils'
import { commitName, registerName } from '@ensdomains/ensjs/wallet'
import { NextResponse } from 'next/server'
import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  parseAbiItem,
} from 'viem'

import {
  publicClient,
  startupChainClient,
} from '@/lib/blockchain/startupchain-client'
import { mainnetWithEns, sepoliaWithEns } from '@/lib/web3'

// Allow long execution for the 60s wait + tx times
export const maxDuration = 300
export const dynamic = 'force-dynamic'

const STARTUPCHAIN_ADDRESS = process.env.NEXT_PUBLIC_STARTUPCHAIN_ADDRESS as
  | `0x${string}`
  | undefined

// Resolver addresses
const RESOLVERS = {
  '1': '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBa187C', // Mainnet
  '11155111': '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD', // Sepolia
} as const

// StartupChain ABI for events and functions
const STARTUPCHAIN_ABI = [
  parseAbiItem(
    'event RegistrationRequested(uint256 indexed requestId, string ensName, address indexed owner, address[] founders)'
  ),
  parseAbiItem(
    'function registerCompany(string memory _ensName, address[] memory _founders, address _owner) external returns (uint256)'
  ),
  parseAbiItem(
    'function ensNameToCompanyId(string memory) external view returns (uint256)'
  ),
] as const

export async function GET(request: Request) {
  if (!STARTUPCHAIN_ADDRESS) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_STARTUPCHAIN_ADDRESS not set' },
      { status: 500 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const fromBlockParam = searchParams.get('fromBlock')
    const toBlockParam = searchParams.get('toBlock')

    console.log('🤖 Starting registration worker...')

    // 1. Setup Clients
    const clientConfig = await startupChainClient()
    const chainId = clientConfig.chain.id

    // Use ENS-compatible chain definition
    const chainWithEns = chainId === 11155111 ? sepoliaWithEns : mainnetWithEns

    const walletClient = createWalletClient({
      ...clientConfig,
      chain: chainWithEns,
    })

    // Create ENS-compatible public client for getPrice
    const ensPublicClient = createPublicClient({
      chain: chainWithEns,
      transport: clientConfig.transport,
    })

    const resolverAddress =
      RESOLVERS[chainId.toString() as keyof typeof RESOLVERS]

    if (!resolverAddress) {
      throw new Error(`No resolver configured for chain ${chainId}`)
    }

    // 2. Poll Events
    const latestBlock = await publicClient.getBlockNumber()
    let startBlock: bigint
    let endBlock: bigint

    if (fromBlockParam && toBlockParam) {
      startBlock = BigInt(fromBlockParam)
      endBlock = BigInt(toBlockParam)
      console.log(
        `🔧 Manual trigger: processing blocks ${startBlock} to ${endBlock}`
      )
    } else {
      // Default: Last 10 blocks due to Alchemy Free Tier limit
      startBlock = latestBlock - 10n
      endBlock = latestBlock
    }

    console.log(
      `🔍 Polling logs from ${startBlock} to ${endBlock} on ${clientConfig.chain.name}`
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logs: any[] = []
    const MAX_BLOCK_RANGE = 10n

    for (
      let currentFrom = startBlock;
      currentFrom <= endBlock;
      currentFrom += MAX_BLOCK_RANGE
    ) {
      const currentTo =
        currentFrom + MAX_BLOCK_RANGE - 1n > endBlock
          ? endBlock
          : currentFrom + MAX_BLOCK_RANGE - 1n

      console.log(`  - Fetching logs from ${currentFrom} to ${currentTo}...`)

      const chunkLogs = await publicClient.getLogs({
        address: STARTUPCHAIN_ADDRESS,
        event: STARTUPCHAIN_ABI[0], // RegistrationRequested
        fromBlock: currentFrom,
        toBlock: currentTo,
      })
      logs.push(...chunkLogs)
    }

    console.log(`found ${logs.length} registration requests`)

    const results = []

    // 3. Process Loop
    for (const log of logs) {
      const { ensName, owner, founders } = log.args
      if (!ensName || !owner || !founders) continue

      console.log(`\nProcessing request for ${ensName}...`)

      // Check if already registered in StartupChain
      const existingCompanyId = await publicClient.readContract({
        address: STARTUPCHAIN_ADDRESS,
        abi: STARTUPCHAIN_ABI,
        functionName: 'ensNameToCompanyId',
        args: [ensName],
      })

      if (existingCompanyId > 0n) {
        console.log(
          `⏭️ ${ensName} is already registered (Company ID: ${existingCompanyId}). Skipping.`
        )
        results.push({
          ensName,
          status: 'skipped',
          reason: 'already_registered',
        })
        continue
      }

      try {
        // Prepare ENS params
        // Ensure .eth suffix
        const name = ensName.endsWith('.eth') ? ensName : `${ensName}.eth`
        const duration = 31536000 // 1 year
        const secret = `0x${Array.from(
          crypto.getRandomValues(new Uint8Array(32))
        )
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')}` as `0x${string}`

        const params: RegistrationParameters = {
          name,
          owner,
          duration,
          secret,
          resolverAddress,
          fuses: {
            named: [],
            unnamed: [],
          },
        }

        // Step A: Commit
        console.log(`📝 Committing ${name}...`)
        const commitTxData = commitName.makeFunctionData(walletClient, params)
        const commitHash = await walletClient.sendTransaction(commitTxData)
        console.log(`✅ Commit sent: ${commitHash}`)

        // Wait for commit to be mined
        await publicClient.waitForTransactionReceipt({ hash: commitHash })
        console.log(`✅ Commit mined`)

        // Step B: Wait 60 seconds
        console.log(`⏳ Waiting 60 seconds for commitment to mature...`)
        await new Promise((resolve) => setTimeout(resolve, 60000))

        // Step C: Register
        console.log(`📝 Registering ${name}...`)

        // Calculate price with buffer
        const priceData = await getPrice(ensPublicClient, {
          nameOrNames: name,
          duration,
        })
        const totalCost = priceData.base + priceData.premium
        const valueWithBuffer = (totalCost * 102n) / 100n

        const registerTxData = registerName.makeFunctionData(walletClient, {
          ...params,
          value: valueWithBuffer,
        })

        const registerHash = await walletClient.sendTransaction(registerTxData)
        console.log(`✅ Register sent: ${registerHash}`)

        // Wait for registration to be mined
        await publicClient.waitForTransactionReceipt({ hash: registerHash })
        console.log(`✅ Register mined`)

        // Step D: Finalize in StartupChain
        console.log(`📝 Finalizing in StartupChain...`)
        const finalizeData = encodeFunctionData({
          abi: STARTUPCHAIN_ABI,
          functionName: 'registerCompany',
          args: [ensName, founders, owner],
        })

        const finalizeHash = await walletClient.sendTransaction({
          to: STARTUPCHAIN_ADDRESS,
          data: finalizeData,
        })
        console.log(`✅ Finalize sent: ${finalizeHash}`)

        await publicClient.waitForTransactionReceipt({ hash: finalizeHash })
        console.log(`✅ Finalize mined. Company registered!`)

        results.push({ ensName, status: 'success', tx: finalizeHash })
      } catch (error) {
        console.error(`❌ Failed to process ${ensName}:`, error)
        results.push({ ensName, status: 'error', error: String(error) })
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error('Worker failed:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
