import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SubdomainManagerCard } from './subdomain-manager-card'

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

describe('SubdomainManagerCard', () => {
  beforeEach(() => {
    mockUseSafeWallet.mockReset()
    mockUseSafeWallet.mockReturnValue({
      authenticated: true,
      ensureWalletReady: vi.fn(),
      expectedWalletAddress: '0x1111111111111111111111111111111111111111',
    })
  })

  it('renders the custom subdomain and active subdomains sections', () => {
    const html = renderToStaticMarkup(
      <SubdomainManagerCard
        companyId="1"
        ensName="acme.eth"
        chainId={11155111}
        safeAddress="0x2222222222222222222222222222222222222222"
        startupChainAddress="0x3333333333333333333333333333333333333333"
        subdomains={[]}
        subdomainsSupported
      />
    )

    expect(html).toContain('Subdomains')
    expect(html).toContain('Custom subdomain')
    expect(html).toContain('Create custom subdomain')
    expect(html).toContain('Active subdomains')
    expect(html).not.toContain('Founder subdomains')
  })

  it('shows the unsupported deployment message', () => {
    const html = renderToStaticMarkup(
      <SubdomainManagerCard
        companyId="1"
        ensName="acme.eth"
        chainId={11155111}
        safeAddress="0x2222222222222222222222222222222222222222"
        startupChainAddress="0x3333333333333333333333333333333333333333"
        subdomains={[]}
        subdomainsSupported={false}
      />
    )

    expect(html).toContain(
      'Subdomain actions unavailable on current deployment.'
    )
  })

  it('shows which founder wallet must sign proposals', () => {
    const html = renderToStaticMarkup(
      <SubdomainManagerCard
        companyId="1"
        ensName="acme.eth"
        chainId={11155111}
        safeAddress="0x2222222222222222222222222222222222222222"
        startupChainAddress="0x3333333333333333333333333333333333333333"
        subdomains={[]}
        subdomainsSupported
      />
    )

    expect(html).toContain('Proposals must be signed by founder wallet')
    expect(html).toContain('0x1111...1111')
  })
})
