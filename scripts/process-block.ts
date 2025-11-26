import { createPublicClient, createWalletClient, http, encodeFunctionData, parseAbiItem } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { getPrice } from '@ensdomains/ensjs/public'
import { RegistrationParameters } from '@ensdomains/ensjs/utils'
import { commitName, registerName } from '@ensdomains/ensjs/wallet'
import { addEnsContracts } from '@ensdomains/ensjs'

// Configuration
const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/6Is2BEODT2eeBuHPwD9Hp'
const SIGNER_KEY = 'baedc296ebf9a8d2bb5919dec185bf35a896f8630cfba46e8312e3f4ac651323'
const STARTUPCHAIN_ADDRESS = '0x51a6D3Ed17eDB1361B728007042FCe45A6e8f164'
const RESOLVER_ADDRESS = '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD'

// ABIs
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

async function main() {
  const blockNumber = 9711679n // From previous step
  console.log(`Processing block ${blockNumber}...`)

  // Setup clients
  const chainWithEns = addEnsContracts(sepolia)

  const account = privateKeyToAccount(`0x${SIGNER_KEY}`)

  const publicClient = createPublicClient({
    chain: chainWithEns,
    transport: http(RPC_URL),
  })

  const walletClient = createWalletClient({
    chain: chainWithEns,
    transport: http(RPC_URL),
    account,
  })

  // Fetch logs
  console.log('Fetching logs...')
  const logs = await publicClient.getLogs({
    address: STARTUPCHAIN_ADDRESS,
    event: STARTUPCHAIN_ABI[0],
    fromBlock: blockNumber,
    toBlock: blockNumber,
  })

  console.log(`Found ${logs.length} logs`)

  for (const log of logs) {
    const { ensName, owner, founders } = log.args
    if (!ensName || !owner || !founders) continue

    console.log(`\nProcessing request for ${ensName}...`)

    // Check if already registered
    const existingCompanyId = await publicClient.readContract({
      address: STARTUPCHAIN_ADDRESS,
      abi: STARTUPCHAIN_ABI,
      functionName: 'ensNameToCompanyId',
      args: [ensName],
    })

    if (existingCompanyId > 0n) {
      console.log(`Already registered (ID: ${existingCompanyId}). Skipping.`)
      continue
    }

    try {
      // Prepare ENS params
      const name = ensName.endsWith('.eth') ? ensName : `${ensName}.eth`
      const duration = 31536000 // 1 year
      const secret = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')}` as `0x${string}`

      const params: RegistrationParameters = {
        name,
        owner,
        duration,
        secret,
        resolverAddress: RESOLVER_ADDRESS,
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

      console.log('Waiting for commit receipt...')
      await publicClient.waitForTransactionReceipt({ hash: commitHash })
      console.log('✅ Commit mined')

      // Step B: Wait 60 seconds
      console.log(`⏳ Waiting 60 seconds for commitment to mature...`)
      await new Promise((resolve) => setTimeout(resolve, 60000))

      // Step C: Register
      console.log(`📝 Registering ${name}...`)
      const priceData = await getPrice(publicClient, {
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

      console.log('Waiting for register receipt...')
      await publicClient.waitForTransactionReceipt({ hash: registerHash })
      console.log('✅ Register mined')

      // Step D: Finalize
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

    } catch (error) {
      console.error(`❌ Failed to process ${ensName}:`, error)
    }
  }
}

main()
