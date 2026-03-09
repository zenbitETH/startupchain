import { describe, expect, it } from 'vitest'

import {
  type PrivyWalletLike,
  findMatchingPrivyWallet,
  parseWalletChainId,
} from './safe-wallet-utils'

describe('parseWalletChainId', () => {
  it('parses decimal chain ids', () => {
    expect(parseWalletChainId(11155111)).toBe(11155111)
    expect(parseWalletChainId('11155111')).toBe(11155111)
  })

  it('parses hex chain ids from providers', () => {
    expect(parseWalletChainId('0xaa36a7')).toBe(11155111)
  })

  it('returns null for invalid values', () => {
    expect(parseWalletChainId('nope')).toBeNull()
    expect(parseWalletChainId(undefined)).toBeNull()
  })
})

describe('findMatchingPrivyWallet', () => {
  const wallets: PrivyWalletLike[] = [
    { address: '0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa' },
    { address: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB' },
  ]

  it('returns the wallet matching the authenticated founder address', () => {
    expect(
      findMatchingPrivyWallet(
        wallets,
        '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'
      )
    ).toEqual(wallets[1])
  })

  it('matches addresses case-insensitively', () => {
    expect(
      findMatchingPrivyWallet(
        wallets,
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
      )
    ).toEqual(wallets[1])
  })

  it('does not fall back to the first wallet when no match exists', () => {
    expect(
      findMatchingPrivyWallet(
        wallets,
        '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
      )
    ).toBeUndefined()
  })
})
