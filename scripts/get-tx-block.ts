import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'

const client = createPublicClient({
  chain: sepolia,
  transport: http(),
})

async function main() {
  const txHash = '0xb3452924392104d4dc11c9d61fd293ec649cdd7213828e007246658ef7273eaa'
  console.log(`Fetching transaction receipt for ${txHash}...`)

  try {
    const receipt = await client.getTransactionReceipt({
      hash: txHash,
    })
    console.log('Block Number:', receipt.blockNumber.toString())
  } catch (error) {
    console.error('Error fetching transaction receipt:', error)
  }
}

main()
