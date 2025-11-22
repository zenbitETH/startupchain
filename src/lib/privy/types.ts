import {
  usePrivy as usePrivyReal,
  useWallets as useWalletsReal,
} from '@privy-io/react-auth'

export type UsePrivyReturn = ReturnType<typeof usePrivyReal>
export type UseWalletsReturn = ReturnType<typeof useWalletsReal>
