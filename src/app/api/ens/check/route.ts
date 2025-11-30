import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { normalize } from 'viem/ens'
import { addEnsContracts } from '@ensdomains/ensjs'
import { getOwner } from '@ensdomains/ensjs/public'

export const dynamic = 'force-dynamic'

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const name = searchParams.get('name')

    if (!name) {
      return NextResponse.json(
        { error: 'Invalid name parameter' },
        { status: 400 }
      )
    }

    const normalizedName = normalize(`${name}.eth`)
    const result = await getOwner(client, { name: normalizedName })
    const owner = result?.owner;
    console.log(owner)
    const available = !owner || owner === '0x0000000000000000000000000000000000000000'

    return NextResponse.json({
      name: normalizedName,
      available,
      address: owner || null,
      checked: true,
    })
  } catch (error) {
    console.error('ENS check error:', error)

    return NextResponse.json(
      {
        error: 'Failed to check ENS name',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
