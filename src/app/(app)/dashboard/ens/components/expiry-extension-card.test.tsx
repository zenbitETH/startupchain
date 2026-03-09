import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ExpiryExtensionCard } from './expiry-extension-card'

const { mockUseSafeWallet } = vi.hoisted(() => ({
  mockUseSafeWallet: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}))

vi.mock('@/hooks/use-safe-wallet', () => ({
  useSafeWallet: mockUseSafeWallet,
}))

describe('ExpiryExtensionCard', () => {
  beforeEach(() => {
    mockUseSafeWallet.mockReset()
    mockUseSafeWallet.mockReturnValue({
      authenticated: true,
      ensureWalletReady: vi.fn(),
    })
  })

  it('renders the renewal input without referencing an undefined quote variable', () => {
    const renderCard = () =>
      renderToStaticMarkup(
        <ExpiryExtensionCard
          ensName="acme.eth"
          ensAppBase="https://app.ens.domains/name"
          safeWalletUrl="https://app.safe.global/home?safe=sep:0x2222222222222222222222222222222222222222"
          chainId={11155111}
          safeAddress="0x2222222222222222222222222222222222222222"
          controllerAddress="0x3333333333333333333333333333333333333333"
        />
      )

    expect(renderCard).not.toThrow()

    const html = renderCard()
    expect(html).toContain('Expiry extension')
    expect(html).toContain('id="renewal-value"')
  })
})
