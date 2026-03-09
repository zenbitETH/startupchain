'use client'

import Safe from '@safe-global/protocol-kit'

import type { SafeWalletProvider } from '@/hooks/safe-wallet-utils'

import type { SafeTransactionRequest } from './ens-management'

export type SafeProposeErrorCode =
  | 'SAFE_API_KEY_MISSING'
  | 'SAFE_API_AUTH_ERROR'
  | 'SAFE_API_UNAVAILABLE'

export type SafeProposeError = {
  error: string
  code?: SafeProposeErrorCode
}

type ProposeResponse = {
  safeTxHash: string
}

export class SafeProposeClientError extends Error {
  code?: SafeProposeErrorCode
  status?: number

  constructor(
    message: string,
    options?: { code?: SafeProposeErrorCode; status?: number }
  ) {
    super(message)
    this.name = 'SafeProposeClientError'
    this.code = options?.code
    this.status = options?.status
  }
}

export function isSafeProposeClientError(
  error: unknown
): error is SafeProposeClientError {
  return error instanceof SafeProposeClientError
}

export function handleSafeProposalError(
  error: unknown,
  fallbackMessage: string,
  callbacks: {
    onApiUnavailable: (msg: string) => void
    onError: (msg: string) => void
  }
): void {
  if (isSafeProposeClientError(error)) {
    if (
      error.code === 'SAFE_API_KEY_MISSING' ||
      error.code === 'SAFE_API_AUTH_ERROR'
    ) {
      callbacks.onApiUnavailable(error.message)
      return
    }

    callbacks.onError(error.message)
    return
  }

  callbacks.onError(error instanceof Error ? error.message : fallbackMessage)
}

function parseSafeProposeError(data: unknown): SafeProposeError | null {
  if (!data || typeof data !== 'object') {
    return null
  }

  const payload = data as { error?: unknown; code?: unknown }
  if (typeof payload.error !== 'string') {
    return null
  }

  const maybeCode =
    payload.code === 'SAFE_API_KEY_MISSING' ||
    payload.code === 'SAFE_API_AUTH_ERROR' ||
    payload.code === 'SAFE_API_UNAVAILABLE'
      ? payload.code
      : undefined

  return {
    error: payload.error,
    code: maybeCode,
  }
}

function toSerializableSafeTransactionData(
  input: unknown
): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify(input, (_, value) => {
      if (typeof value === 'bigint') {
        return value.toString()
      }
      return value
    })
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
  provider: SafeWalletProvider
  chainId: number
  safeAddress: `0x${string}`
  senderAddress: `0x${string}`
  transaction: SafeTransactionRequest
  origin?: string
}): Promise<ProposeResponse> {
  return proposeBatchSafeTransactionFromWallet({
    provider,
    chainId,
    safeAddress,
    senderAddress,
    transactions: [transaction],
    origin,
  })
}

export async function proposeBatchSafeTransactionFromWallet({
  provider,
  chainId,
  safeAddress,
  senderAddress,
  transactions,
  origin,
}: {
  provider: SafeWalletProvider
  chainId: number
  safeAddress: `0x${string}`
  senderAddress: `0x${string}`
  transactions: SafeTransactionRequest[]
  origin?: string
}): Promise<ProposeResponse> {
  if (transactions.length === 0) {
    throw new Error('At least one transaction is required')
  }

  const protocolKit = await Safe.init({
    provider,
    signer: senderAddress,
    safeAddress,
  })

  const safeTransaction = await protocolKit.createTransaction({
    transactions,
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
      safeTransactionData: toSerializableSafeTransactionData(
        safeTransaction.data
      ),
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
