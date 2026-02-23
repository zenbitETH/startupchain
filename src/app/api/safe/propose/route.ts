import type { SafeTransactionData } from '@safe-global/types-kit'
import SafeApiKit from '@safe-global/api-kit'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getServerSession } from '../../../../lib/auth/server-session'
import { getCompanyByAddress } from '../../../../lib/blockchain/get-company'
import {
  getSafeApiKitConfig,
  isSafeApiConfigurationError,
} from '../../../../lib/blockchain/safe-api-config'
import { isSupportedChain } from '../../../../lib/blockchain/startupchain-config'

const proposeSchema = z.object({
  chainId: z.number().int(),
  safeAddress: z.string().min(1),
  safeTxHash: z.string().min(1),
  senderAddress: z.string().min(1),
  senderSignature: z.string().min(1),
  origin: z.string().optional(),
  safeTransactionData: z.object({
    to: z.string().min(1),
    value: z.string(),
    data: z.string(),
    operation: z.number().int(),
    safeTxGas: z.string(),
    baseGas: z.string(),
    gasPrice: z.string(),
    gasToken: z.string(),
    refundReceiver: z.string(),
    nonce: z.number().int(),
  }),
})

function readCookieFromRequestHeader(
  request: Request,
  key: string,
): { value?: string } | undefined {
  const rawCookie = request.headers.get('cookie')
  if (!rawCookie) {
    return undefined
  }

  for (const pair of rawCookie.split(';')) {
    const [name, ...valueParts] = pair.trim().split('=')
    if (name === key) {
      return {
        value: decodeURIComponent(valueParts.join('=')),
      }
    }
  }

  return undefined
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession({
      headers: request.headers,
      cookies: {
        get: key => readCookieFromRequestHeader(request, key),
      },
    })
    if (!session?.walletAddress) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      )
    }

    const body = await request.json()
    const parsed = proposeSchema.parse(body)

    if (!isSupportedChain(parsed.chainId)) {
      return NextResponse.json(
        { error: `Unsupported chain ${parsed.chainId}` },
        { status: 400 },
      )
    }

    const company = await getCompanyByAddress(parsed.safeAddress, parsed.chainId)
    const sessionWallet = session.walletAddress.toLowerCase()
    const isFounder = company?.founders.some(
      founder => founder.wallet.toLowerCase() === sessionWallet,
    )
    if (!company || !isFounder) {
      return NextResponse.json(
        { error: 'You are not authorized to propose for this Safe' },
        { status: 403 },
      )
    }

    const apiKit = new SafeApiKit(getSafeApiKitConfig(parsed.chainId))

    await apiKit.proposeTransaction({
      safeAddress: parsed.safeAddress,
      safeTransactionData: parsed.safeTransactionData as unknown as SafeTransactionData,
      safeTxHash: parsed.safeTxHash,
      senderAddress: parsed.senderAddress,
      senderSignature: parsed.senderSignature,
      origin: parsed.origin,
    })

    return NextResponse.json({
      safeTxHash: parsed.safeTxHash,
    })
  }
  catch (error) {
    if (isSafeApiConfigurationError(error)) {
      return NextResponse.json(
        {
          error: 'Safe proposal service is not configured',
          code: 'SAFE_API_KEY_MISSING',
        },
        { status: 503 },
      )
    }

    const message
      = error instanceof Error ? error.message : 'Unknown Safe proposal error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
