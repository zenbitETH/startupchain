import { isAddress } from 'viem'

import { type PendingRegistration } from '@/lib/auth/pending-registration'
import { type FounderStruct } from '@/lib/blockchain/startupchain-abi'

type BackendFounderInput = {
  wallet: string
  equityPercent: number
  role?: string
}

export type { BackendFounderInput }

/**
 * Convert backend founder input to FounderStruct for contract calls
 */
export function toFounderStructs(
  founders: BackendFounderInput[]
): FounderStruct[] {
  if (founders.length === 0) {
    throw new Error('At least one founder required')
  }

  const structs = founders.map((founder) => {
    if (!isAddress(founder.wallet)) {
      throw new Error(`Invalid founder address: ${founder.wallet}`)
    }

    const equityPercent = Number.isFinite(founder.equityPercent)
      ? founder.equityPercent
      : 0

    if (equityPercent < 0) {
      throw new Error('Equity percentage cannot be negative')
    }

    return {
      wallet: founder.wallet as FounderStruct['wallet'],
      equityBps: BigInt(Math.round(equityPercent * 100)),
      role: founder.role ?? '',
    }
  })

  const totalEquityBps = structs.reduce(
    (sum, founder) => sum + founder.equityBps,
    0n
  )

  if (totalEquityBps > 10_000n) {
    throw new Error('Total equity cannot exceed 100%')
  }

  return structs
}

/**
 * Validate threshold against founder count
 */
export function validateThreshold(threshold: number, founderCount: number) {
  if (!Number.isFinite(threshold) || threshold <= 0) {
    throw new Error('Threshold must be greater than zero')
  }

  if (threshold > founderCount) {
    throw new Error('Threshold cannot exceed number of founders')
  }
}

/**
 * Convert FounderStruct to cookie-safe format
 */
export function toCookieFounders(founders: FounderStruct[]) {
  return founders.map((founder) => ({
    wallet: founder.wallet,
    equityBps: Number(founder.equityBps),
    role: founder.role,
  }))
}

/**
 * Convert cookie founders back to FounderStruct for contract calls
 */
export function toContractFounders(
  founders: PendingRegistration['founders']
): FounderStruct[] {
  return founders.map((founder) => ({
    wallet: founder.wallet,
    equityBps: BigInt(founder.equityBps ?? 0),
    role: founder.role ?? '',
  }))
}
