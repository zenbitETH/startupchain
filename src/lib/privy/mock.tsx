'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import type { Address } from 'viem'

import { UsePrivyReturn, UseWalletsReturn } from '@/lib/privy'

type MockSmartWalletAccount = {
  type: 'smart_wallet'
  address: Address
  smartWalletType: 'safe'
}

type MockEmailAccount = {
  type: 'email'
  address: string
  firstVerifiedAt: string
}

type MockLinkedAccount = MockSmartWalletAccount | MockEmailAccount

interface MockPrivyUser {
  id: string
  wallet: {
    address: Address
  }
  email?: {
    address: string
  }
  linkedAccounts: MockLinkedAccount[]
}

type MockEthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on: (event: string, handler: (...args: unknown[]) => void) => void
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void
}

interface MockEmbeddedWallet {
  address: Address
  walletClientType: 'privy'
  connectorType: 'embedded'
  chainId: number
  switchChain: (chainId: number) => Promise<void>
  getEthereumProvider: () => Promise<MockEthereumProvider>
}

interface MockPrivyContext {
  ready: boolean
  authenticated: boolean
  user: MockPrivyUser | null
  login: () => Promise<void>
  logout: () => Promise<void>
}

interface MockWalletContext {
  ready: boolean
  wallets: MockEmbeddedWallet[]
}

const mockUserWalletAddress =
  (process.env.NEXT_PUBLIC_PRIVY_MOCK_WALLET as Address) ||
  ('0x1234567890abcdef1234567890abcdef12345678' as Address)

const mockSmartWalletAddress =
  (process.env.NEXT_PUBLIC_PRIVY_MOCK_SMART_WALLET as Address) ||
  ('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as Address)

const defaultUser: MockPrivyUser = {
  id: 'mock-user',
  wallet: {
    address: mockUserWalletAddress,
  },
  email: {
    address: 'founder@example.com',
  },
  linkedAccounts: [
    {
      type: 'smart_wallet',
      address: mockSmartWalletAddress,
      smartWalletType: 'safe',
    },
    {
      type: 'email',
      address: 'founder@example.com',
      firstVerifiedAt: new Date().toISOString(),
    },
  ],
}

const MockPrivyContext = createContext<MockPrivyContext | null>(null)
const MockWalletContext = createContext<MockWalletContext | null>(null)

function createMockProvider(
  getWalletAddress: () => Address,
  getChainId: () => number
): MockEthereumProvider {
  return {
    request: async ({ method, params }) => {
      switch (method) {
        case 'eth_chainId':
          return `0x${getChainId().toString(16)}`
        case 'eth_requestAccounts':
        case 'eth_accounts':
          return [getWalletAddress()]
        case 'eth_getBalance':
          return '0x21E19E0C9BAB2400000' // ~1000 ETH
        case 'eth_sendTransaction':
          return '0xmocktransactionhash'
        default:
          console.warn(
            `[privy-mock] Unhandled provider method: ${method}`,
            params
          )
          return null
      }
    },
    on: () => {
      /* noop */
    },
    removeListener: () => {
      /* noop */
    },
  }
}

export interface PrivyProviderProps {
  children: React.ReactNode
  appId?: string
  config?: unknown
  [key: string]: unknown
}

export function PrivyProviderMock({ children }: PrivyProviderProps) {
  const [authenticated, setAuthenticated] = useState(false)
  const [user, setUser] = useState<MockPrivyUser>(defaultUser)
  const [chainId, setChainId] = useState(11155111) // sepolia

  const login = useCallback(async () => {
    setAuthenticated(true)
    setUser(defaultUser)
    if (typeof document !== 'undefined') {
      document.cookie = 'privy-token=mock; path=/; max-age=86400'
    }
  }, [])

  const logout = useCallback(async () => {
    setAuthenticated(false)
    if (typeof document !== 'undefined') {
      document.cookie = 'privy-token=; path=/; max-age=0'
    }
  }, [])

  const provider = useMemo(
    () =>
      createMockProvider(
        () => user.wallet.address,
        () => chainId
      ),
    [user.wallet.address, chainId]
  )

  const wallet = useMemo<MockEmbeddedWallet>(
    () => ({
      address: user.wallet.address,
      walletClientType: 'privy',
      connectorType: 'embedded',
      chainId,
      switchChain: async (targetChainId: number) => {
        setChainId(targetChainId)
      },
      getEthereumProvider: async () => provider,
    }),
    [chainId, provider, user.wallet.address]
  )

  const privyValue = useMemo<MockPrivyContext>(
    () => ({
      ready: true,
      authenticated,
      user: authenticated ? user : null,
      login,
      logout,
    }),
    [authenticated, login, logout, user]
  )

  const walletValue = useMemo<MockWalletContext>(
    () => ({
      ready: true,
      wallets: authenticated ? [wallet] : [],
    }),
    [authenticated, wallet]
  )

  return (
    <MockPrivyContext.Provider value={privyValue}>
      <MockWalletContext.Provider value={walletValue}>
        {children}
      </MockWalletContext.Provider>
    </MockPrivyContext.Provider>
  )
}

export function useMockPrivy(): UsePrivyReturn {
  const context = useContext(MockPrivyContext)
  if (!context) {
    throw new Error('usePrivy must be used within PrivyProviderMock')
  }
  return context as unknown as UsePrivyReturn
}

export function useMockWallets(): UseWalletsReturn {
  const context = useContext(MockWalletContext)
  if (!context) {
    throw new Error('useWallets must be used within PrivyProviderMock')
  }
  return context as unknown as UseWalletsReturn
}
