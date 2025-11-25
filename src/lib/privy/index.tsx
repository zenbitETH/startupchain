'use client'

import {
  PrivyProvider as RealPrivyProvider,
  usePrivy as usePrivyReal,
  useWallets as useWalletsReal,
} from '@privy-io/react-auth'
import { type ComponentProps } from 'react'

import { PrivyProviderMock, useMockPrivy, useMockWallets } from './mock'
import type { UsePrivyReturn, UseWalletsReturn } from './types'

const PRIVY_MODE = process.env.NEXT_PUBLIC_PRIVY_MODE
export const isMockPrivy = PRIVY_MODE === 'mock'

type RealPrivyProviderProps = ComponentProps<typeof RealPrivyProvider>

// Re-export types for external consumers
export type { UsePrivyReturn, UseWalletsReturn }

/**
 * Wrapper around Privy's provider that switches between real and mock implementations.
 * Note: The RealPrivyProvider may emit a React key warning due to its internal Fragment
 * usage. This is a known library issue with React 19 and will be fixed upstream.
 */
export function PrivyProvider({
  children,
  appId,
  config,
}: RealPrivyProviderProps) {
  if (isMockPrivy) {
    return (
      <PrivyProviderMock appId={appId} config={config}>
        {children}
      </PrivyProviderMock>
    )
  }
  return (
    <RealPrivyProvider appId={appId} config={config}>
      <>{children}</>
    </RealPrivyProvider>
  )
}

export const usePrivy: () => UsePrivyReturn = isMockPrivy
  ? useMockPrivy
  : usePrivyReal

export const useWallets: () => UseWalletsReturn = isMockPrivy
  ? useMockWallets
  : useWalletsReal
