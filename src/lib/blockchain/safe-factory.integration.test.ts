/**
 * Integration test for Safe deterministic deployment on Sepolia
 *
 * This test verifies that predictSafeAddress() returns the exact address
 * where deploySafe() will deploy the Safe. This is critical for the
 * registration flow where we commit ENS to the predicted Safe address
 * before actually deploying it.
 *
 * Requirements:
 * - SEPOLIA_TEST_WALLET_KEY env var with a funded Sepolia wallet
 * - Sepolia ETH for gas (~0.01 ETH per test run)
 *
 */
import { createPublicClient, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { describe, expect, it } from 'vitest'

import { deploySafe, predictSafeAddress } from './safe-factory'

const RAW_KEY = process.env.SEPOLIA_TEST_WALLET_KEY
const SEPOLIA_TEST_WALLET_KEY = RAW_KEY
  ? ((RAW_KEY.startsWith('0x') ? RAW_KEY : `0x${RAW_KEY}`) as `0x${string}`)
  : undefined
const SEPOLIA_RPC = 'https://ethereum-sepolia-rpc.publicnode.com'

const shouldRun = !!SEPOLIA_TEST_WALLET_KEY

describe.skipIf(!shouldRun)('Safe deterministic deployment (Sepolia)', () => {
  it('deployed address matches predicted address', async () => {
    if (!SEPOLIA_TEST_WALLET_KEY) {
      throw new Error('SEPOLIA_TEST_WALLET_KEY not set')
    }

    const account = privateKeyToAccount(SEPOLIA_TEST_WALLET_KEY)

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(SEPOLIA_RPC),
    })

    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(SEPOLIA_RPC),
    })

    const owners: `0x${string}`[] = [account.address]
    const chainId = sepolia.id
    const saltNonce = `${Date.now()}`

    const predicted = await predictSafeAddress({
      owners,
      chainId,
      saltNonce,
    })

    expect(predicted).toMatch(/^0x[a-fA-F0-9]{40}$/)

    const result = await deploySafe({
      owners,
      chainId,
      walletClient,
      publicClient,
      saltNonce,
    })

    expect(result.safeAddress).toBe(predicted)
    expect(result.deploymentTxHash).toMatch(/^0x[a-fA-F0-9]{64}$/)
  }, 120_000)

  it('different saltNonce produces different address', async () => {
    if (!SEPOLIA_TEST_WALLET_KEY) {
      throw new Error('SEPOLIA_TEST_WALLET_KEY not set')
    }

    const account = privateKeyToAccount(SEPOLIA_TEST_WALLET_KEY)
    const owners: `0x${string}`[] = [account.address]
    const chainId = sepolia.id

    const addr1 = await predictSafeAddress({
      owners,
      chainId,
      saltNonce: '111111',
    })

    const addr2 = await predictSafeAddress({
      owners,
      chainId,
      saltNonce: '222222',
    })

    expect(addr1).not.toBe(addr2)
  }, 30_000)
})
