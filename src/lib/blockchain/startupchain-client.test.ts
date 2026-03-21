import { afterEach, describe, expect, it, vi } from 'vitest'

const VALID_PRIVATE_KEY =
  '0x1111111111111111111111111111111111111111111111111111111111111111'

describe('startupchain-client', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('can be imported without chain RPC env vars', async () => {
    vi.stubEnv('MAINNET_RPC_URL', '')
    vi.stubEnv('SEPOLIA_RPC_URL', '')
    vi.stubEnv('STARTUPCHAIN_SIGNER_KEY', '')

    await expect(import('./startupchain-client.js')).resolves.toBeTruthy()
  })

  it('throws only when requesting a mainnet public client without MAINNET_RPC_URL', async () => {
    vi.stubEnv('MAINNET_RPC_URL', '')
    vi.stubEnv('SEPOLIA_RPC_URL', 'https://example-sepolia-rpc.test')
    vi.stubEnv('STARTUPCHAIN_SIGNER_KEY', VALID_PRIVATE_KEY)

    const { getPublicClient } = await import('./startupchain-client.js')

    expect(() => getPublicClient(1)).toThrowError('MAINNET_RPC_URL is not set')
  })

  it('throws only when requesting a wallet client without STARTUPCHAIN_SIGNER_KEY', async () => {
    vi.stubEnv('SEPOLIA_RPC_URL', 'https://example-sepolia-rpc.test')
    vi.stubEnv('MAINNET_RPC_URL', 'https://example-mainnet-rpc.test')
    vi.stubEnv('STARTUPCHAIN_SIGNER_KEY', '')

    const { getWalletClient } = await import('./startupchain-client.js')

    expect(() => getWalletClient(11155111)).toThrowError(
      'STARTUPCHAIN_SIGNER_KEY is not set'
    )
  })
})
