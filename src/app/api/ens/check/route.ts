import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { mainnet, sepolia } from 'viem/chains'
import { normalize } from 'viem/ens'

const client = createPublicClient({
  chain: sepolia,
  transport: http(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')

    if (!name) {
      return NextResponse.json(
        { error: 'Invalid name parameter' },
        { status: 400 }
      )
    }

    const normalizedName = normalize(`${name}.eth`)
    const address = await client.getEnsAddress({ name: normalizedName })

    return NextResponse.json({
      name: normalizedName,
      available: !address,
      address: address || null,
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
