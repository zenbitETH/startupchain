import { addEnsContracts } from '@ensdomains/ensjs'
import { getOwner } from '@ensdomains/ensjs/public'
import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { mainnet, sepolia } from 'viem/chains'
import { normalize } from 'viem/ens'

export const dynamic = 'force-dynamic'

const alchemyKey = process.env.ALCHEMY_API_KEY?.trim()

function getRpcUrl(chainId: number): string {
  if (alchemyKey) {
    if (alchemyKey.startsWith('http')) {
      return alchemyKey
    }
    const host =
      chainId === 1
        ? 'https://eth-mainnet.g.alchemy.com/v2/'
        : 'https://eth-sepolia.g.alchemy.com/v2/'
    return `${host}${alchemyKey}`
  }

  return chainId === 1
    ? mainnet.rpcUrls.default.http[0]
    : sepolia.rpcUrls.default.http[0]
}

function getClient(chainId: number) {
  const chain =
    chainId === 1 ? addEnsContracts(mainnet) : addEnsContracts(sepolia)
  return createPublicClient({
    chain,
    transport: http(getRpcUrl(chainId)),
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const name = searchParams.get('name')
    const chainIdParam = searchParams.get('chainId')

    if (!name) {
      return NextResponse.json(
        { error: 'Invalid name parameter' },
        { status: 400 }
      )
    }

    // Parse chainId, default to Sepolia
    const chainId = chainIdParam ? Number(chainIdParam) : 11155111
    const client = getClient(chainId)

    const normalizedName = normalize(`${name}.eth`)
    const result = await getOwner(client, { name: normalizedName })
    const owner = result?.owner
    console.log(owner)
    const available =
      !owner || owner === '0x0000000000000000000000000000000000000000'

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
