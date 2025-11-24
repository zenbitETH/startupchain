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

export function PrivyProvider(props: RealPrivyProviderProps) {
  if (isMockPrivy) {
    return <PrivyProviderMock key="privy-provider-mock" {...props} />
  }
  return <RealPrivyProvider key="privy-provider" {...props} />
}

export const usePrivy: () => UsePrivyReturn = isMockPrivy
  ? useMockPrivy
  : usePrivyReal

export const useWallets: () => UseWalletsReturn = isMockPrivy
  ? useMockWallets
  : useWalletsReal
