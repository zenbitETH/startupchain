import { isAddress } from 'viem'

export type SafeWalletProvider = {
  request: (args: {
    method: string
    params?: unknown[] | object
  }) => Promise<unknown>
}

export type PrivyWalletLike = {
  address?: string
  chainId?: number | string
  switchChain?: (chainId: number) => Promise<void>
  getEthereumProvider?: () => Promise<SafeWalletProvider>
}

export function parseWalletChainId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value
  }

  if (typeof value === 'string') {
    const normalized = value.startsWith('0x')
      ? parseInt(value, 16)
      : Number(value)
    if (Number.isInteger(normalized)) {
      return normalized
    }
  }

  return null
}

export function findMatchingPrivyWallet<T extends PrivyWalletLike>(
  wallets: readonly T[],
  expectedAddress: string | undefined
): T | undefined {
  if (!expectedAddress || !isAddress(expectedAddress)) {
    return undefined
  }

  const normalizedExpectedAddress = expectedAddress.toLowerCase()

  return wallets.find((wallet) => {
    if (!wallet.address || !isAddress(wallet.address)) {
      return false
    }

    return wallet.address.toLowerCase() === normalizedExpectedAddress
  })
}
