'use client'

import { type ComponentProps } from 'react'
import {
  PrivyProvider as RealPrivyProvider,
  usePrivy as usePrivyReal,
  useWallets as useWalletsReal,
} from '@privy-io/react-auth'

import {
  PrivyProviderMock,
  useMockPrivy,
  useMockWallets,
} from './mock'

const PRIVY_MODE = process.env.NEXT_PUBLIC_PRIVY_MODE
export const isMockPrivy = PRIVY_MODE === 'mock'

type RealPrivyProviderProps = ComponentProps<typeof RealPrivyProvider>
type UsePrivyReturn = ReturnType<typeof usePrivyReal>
type UseWalletsReturn = ReturnType<typeof useWalletsReal>

export function PrivyProvider(props: RealPrivyProviderProps) {
  if (isMockPrivy) {
    return <PrivyProviderMock {...props} />
  }
  return <RealPrivyProvider {...props} />
}

export function usePrivy(): UsePrivyReturn {
  if (isMockPrivy) {
    return useMockPrivy() as unknown as UsePrivyReturn
  }

  return usePrivyReal()
}

export function useWallets(): UseWalletsReturn {
  if (isMockPrivy) {
    return useMockWallets() as unknown as UseWalletsReturn
  }

  return useWalletsReal()
}
