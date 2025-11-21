'use client'

import {
  PrivyProvider as RealPrivyProvider,
  usePrivy as usePrivyReal,
  useWallets as useWalletsReal,
} from '@privy-io/react-auth'
import { type ComponentProps } from 'react'

import { PrivyProviderMock, useMockPrivy, useMockWallets } from './mock'

const PRIVY_MODE = process.env.NEXT_PUBLIC_PRIVY_MODE
export const isMockPrivy = PRIVY_MODE === 'mock'

type RealPrivyProviderProps = ComponentProps<typeof RealPrivyProvider>
export type UsePrivyReturn = ReturnType<typeof usePrivyReal>
export type UseWalletsReturn = ReturnType<typeof useWalletsReal>

export function PrivyProvider(props: RealPrivyProviderProps) {
  if (isMockPrivy) {
    return <PrivyProviderMock {...props} />
  }
  return <RealPrivyProvider {...props} />
}

export const usePrivy: () => UsePrivyReturn = isMockPrivy
  ? useMockPrivy
  : usePrivyReal

export const useWallets: () => UseWalletsReturn = isMockPrivy
  ? useMockWallets
  : useWalletsReal
