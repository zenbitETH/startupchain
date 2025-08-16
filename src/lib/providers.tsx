'use client'

import { ThorinGlobalStyles, lightTheme } from '@ensdomains/thorin'
import { PrivyProvider } from '@privy-io/react-auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { ThemeProvider } from 'styled-components'
import { WagmiProvider } from 'wagmi'

import StyledComponentsRegistry from '@/lib/sc-registry'
import { wagmiConfig } from '@/lib/web3'

const queryClient = new QueryClient()

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => setIsMounted(true), [])

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={{
        appearance: {
          theme: 'light',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <StyledComponentsRegistry>
            <ThemeProvider theme={lightTheme}>
              <ThorinGlobalStyles />
              {isMounted && children}
            </ThemeProvider>
          </StyledComponentsRegistry>
        </QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  )
}
