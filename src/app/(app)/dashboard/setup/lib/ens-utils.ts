import { normalize } from 'viem/ens'

import { isValidEnsName } from '@/lib/ens'

/**
 * Normalize ENS name input and validate
 */
export function normalizeEnsInput(name: string) {
  const trimmed = name.trim().toLowerCase()
  const label = trimmed.endsWith('.eth') ? trimmed.slice(0, -4) : trimmed

  if (!isValidEnsName(label)) {
    throw new Error('Invalid ENS name')
  }

  return {
    label,
    fullName: normalize(`${label}.eth`),
  }
}

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
