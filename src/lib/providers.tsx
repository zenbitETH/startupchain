'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { mainnet, sepolia } from 'viem/chains'
import { WagmiProvider } from 'wagmi'

import { WalletAuthProvider } from '@/components/providers/wallet-auth-provider'
import { PrivyProvider } from '@/lib/privy'
import { wagmiConfig } from '@/lib/web3'

const queryClient = new QueryClient()

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={{
        appearance: {
          theme: 'dark',
          walletList: ['metamask'],
          walletChainType: 'ethereum-only',
        },
        loginMethods: ['wallet'],
        defaultChain: mainnet,
        supportedChains: [mainnet, sepolia],
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <WalletAuthProvider>{children}</WalletAuthProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  )
}
