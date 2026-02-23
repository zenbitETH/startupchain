'use client'

import Safe from '@safe-global/protocol-kit'

import type { SafeTransactionRequest } from './ens-management'

export type SafeProposeErrorCode = 'SAFE_API_KEY_MISSING'

export type SafeProposeError = {
  error: string
  code?: SafeProposeErrorCode
}

type Eip1193Provider = {
  request: (args: { method: string, params?: unknown[] | object }) => Promise<unknown>
}

type ProposeResponse = {
  safeTxHash: string
}

export class SafeProposeClientError extends Error {
  code?: SafeProposeErrorCode
  status?: number

  constructor(message: string, options?: { code?: SafeProposeErrorCode, status?: number }) {
    super(message)
    this.name = 'SafeProposeClientError'
    this.code = options?.code
    this.status = options?.status
  }
}

export function isSafeProposeClientError(error: unknown): error is SafeProposeClientError {
  return error instanceof SafeProposeClientError
}

function parseSafeProposeError(data: unknown): SafeProposeError | null {
  if (!data || typeof data !== 'object') {
    return null
  }

  const payload = data as { error?: unknown, code?: unknown }
  if (typeof payload.error !== 'string') {
    return null
  }

  const maybeCode
    = payload.code === 'SAFE_API_KEY_MISSING'
      ? payload.code
      : undefined

  return {
    error: payload.error,
    code: maybeCode,
  }
}

function toSerializableSafeTransactionData(input: unknown): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify(input, (_, value) => {
      if (typeof value === 'bigint') {
        return value.toString()
      }
      return value
    }),
  ) as Record<string, unknown>
}

export async function proposeSafeTransactionFromWallet({
  provider,
  chainId,
  safeAddress,
  senderAddress,
  transaction,
  origin,
}: {
  provider: Eip1193Provider
  chainId: number
  safeAddress: `0x${string}`
  senderAddress: `0x${string}`
  transaction: SafeTransactionRequest
  origin?: string
}): Promise<ProposeResponse> {
  const protocolKit = await Safe.init({
    provider,
    signer: senderAddress,
    safeAddress,
  })

  const safeTransaction = await protocolKit.createTransaction({
    transactions: [transaction],
  })
  const safeTxHash = await protocolKit.getTransactionHash(safeTransaction)
  const signature = await protocolKit.signHash(safeTxHash)

  const response = await fetch('/api/safe/propose', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chainId,
      safeAddress,
      safeTxHash,
      senderAddress,
      senderSignature: signature.data,
      safeTransactionData: toSerializableSafeTransactionData(safeTransaction.data),
      origin,
    }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const parsed = parseSafeProposeError(body)
    const message = parsed?.error ?? 'Failed to submit Safe proposal'
    throw new SafeProposeClientError(message, {
      code: parsed?.code,
      status: response.status,
    })
  }

  return { safeTxHash }
}
