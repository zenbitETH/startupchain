'use server'

import { http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet, sepolia } from 'viem/chains'

const mainnetRpcUrl = process.env.MAINNET_RPC_URL
if (!mainnetRpcUrl) throw new Error('MAINNET_RPC_URL is not set')

const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL
if (!sepoliaRpcUrl) throw new Error('SEPOLIA_RPC_URL is not set')

const signerKey = process.env.STARTUPCHAIN_SIGNER_KEY as
  | `0x${string}`
  | undefined
if (!signerKey) throw new Error('STARTUPCHAIN_SIGNER_KEY is not set')

const CHAINS = {
  '1': {
    chain: mainnet,
    rpcUrl: mainnetRpcUrl,
  },
  '11155111': {
    chain: sepolia,
    rpcUrl: sepoliaRpcUrl,
  },
} as const

const chainId = (process.env.NEXT_PUBLIC_CHAIN_ID ??
  '11155111') as keyof typeof CHAINS
const target = CHAINS[chainId]
if (!target) throw new Error(`Unsupported chain id: ${chainId}`)

export const startupChainClient = async () => ({
  chain: target.chain,
  transport: http(target.rpcUrl),
  account: privateKeyToAccount(signerKey),
})
