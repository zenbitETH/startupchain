import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { normalize } from 'viem/ens'
import { addEnsContracts } from '@ensdomains/ensjs'
import { getOwner } from '@ensdomains/ensjs/public'


const alchemyKey = process.env.ALCHEMY_API_KEY?.trim()
const rpcUrl = alchemyKey
  ? alchemyKey.startsWith('http')
    ? alchemyKey
    : `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`
  : sepolia.rpcUrls.default.http[0]

const client = createPublicClient({
  chain: addEnsContracts(sepolia),
  transport: http(rpcUrl),
})

async function checkName(name: string) {
  console.log(`Checking ${name}...`)
  const normalizedName = normalize(name.endsWith('.eth') ? name : `${name}.eth`)

  // Old method (for comparison/logging)
  const address = await client.getEnsAddress({ name: normalizedName })
  console.log(`  getEnsAddress result: ${address}`)

  // New method
  const result = await getOwner(client, { name: normalizedName })
  const owner = result?.owner
  const available = !owner || owner === '0x0000000000000000000000000000000000000000'

  console.log(`  getOwner result: ${owner}`)
  console.log(`  Available: ${available}`)
  console.log('---')
}

async function main() {
  // 1. Check a known available name (random string)
  const randomName = `test-${Date.now()}`
  await checkName(randomName)

  // 2. Check a known taken name (e.g., 'vitalik')
  await checkName('vitalik')

  // 3. Check a name that might be registered but not set (if we knew one,
  //    but 'vitalik' is a good proxy for "taken" in general).
  //    Ideally we'd find a name that has an owner but no resolver/address set.
  //    For now, verifying that 'vitalik' is unavailable via getOwner is a good baseline.
}

main().catch(console.error)
