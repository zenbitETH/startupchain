import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FounderSubdomainList } from './founder-subdomain-list'

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

const FOUNDER_A = {
  wallet: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as `0x${string}`,
  equityBps: 5_000n,
  equityPercent: 50,
  role: 'CEO',
}

const FOUNDER_B = {
  wallet: '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as `0x${string}`,
  equityBps: 3_000n,
  equityPercent: 30,
  role: 'CTO',
}

const FOUNDER_C = {
  wallet: '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as `0x${string}`,
  equityBps: 2_000n,
  equityPercent: 20,
  role: 'CFO',
}

const BASE_PROPS = {
  companyId: '1',
  ensName: 'acme.eth',
  chainId: 11155111,
  safeAddress: '0x2222222222222222222222222222222222222222' as `0x${string}`,
  startupChainAddress:
    '0x3333333333333333333333333333333333333333' as `0x${string}`,
  subdomainsSupported: true,
}

describe('FounderSubdomainList', () => {
  beforeEach(() => {
    mockUseSafeWallet.mockReset()
    mockUseSafeWallet.mockReturnValue({
      authenticated: true,
      ensureWalletReady: vi.fn(),
      expectedWalletAddress: '0x1111111111111111111111111111111111111111',
    })
  })

  it('renders subdomain name with check icon for founders with active subdomains', () => {
    const html = renderToStaticMarkup(
      <FounderSubdomainList
        {...BASE_PROPS}
        founders={[FOUNDER_A]}
        subdomains={[
          {
            name: 'alice',
            owner: FOUNDER_A.wallet,
            active: true,
            createdAt: '2023-11-15T00:00:00Z',
          },
        ]}
      />
    )

    expect(html).toContain('alice.acme.eth')
    // No assign button needed for assigned founders
    expect(html).not.toContain('Assign subdomains')
  })

  it('shows role and equity for each founder row', () => {
    const html = renderToStaticMarkup(
      <FounderSubdomainList
        {...BASE_PROPS}
        founders={[FOUNDER_A]}
        subdomains={[
          {
            name: 'alice',
            owner: FOUNDER_A.wallet,
            active: true,
            createdAt: '2023-11-15T00:00:00Z',
          },
        ]}
      />
    )

    expect(html).toContain('CEO')
    expect(html).toContain('50%')
  })

  it('renders subdomain pill as tooltip trigger for founders with subdomains', () => {
    const html = renderToStaticMarkup(
      <FounderSubdomainList
        {...BASE_PROPS}
        founders={[FOUNDER_A]}
        subdomains={[
          {
            name: 'alice',
            owner: FOUNDER_A.wallet,
            active: true,
            createdAt: '2023-11-15T00:00:00Z',
          },
        ]}
      />
    )

    expect(html).toContain('data-slot="tooltip-trigger"')
    expect(html).toContain('alice.acme.eth')
  })

  it('shows shortened address and label input for founders without subdomains', () => {
    const html = renderToStaticMarkup(
      <FounderSubdomainList
        {...BASE_PROPS}
        founders={[FOUNDER_B]}
        subdomains={[]}
      />
    )

    expect(html).toContain('0xBBBB...BBBB')
    expect(html).toContain('placeholder="subdomain label"')
    expect(html).not.toContain('.acme.eth')
  })

  it('shows a single batch assign button instead of per-founder buttons', () => {
    const html = renderToStaticMarkup(
      <FounderSubdomainList
        {...BASE_PROPS}
        founders={[FOUNDER_A, FOUNDER_B, FOUNDER_C]}
        subdomains={[]}
      />
    )

    // Single batch button
    expect(html).toContain('Assign subdomains')
    // No individual assign buttons (should only appear once)
    const assignCount = (html.match(/Assign subdomains/g) ?? []).length
    expect(assignCount).toBe(1)
  })

  it('renders each founder on its own row with role and equity', () => {
    const html = renderToStaticMarkup(
      <FounderSubdomainList
        {...BASE_PROPS}
        founders={[FOUNDER_A, FOUNDER_B, FOUNDER_C]}
        subdomains={[]}
      />
    )

    expect(html).toContain('CEO')
    expect(html).toContain('50%')
    expect(html).toContain('CTO')
    expect(html).toContain('30%')
    expect(html).toContain('CFO')
    expect(html).toContain('20%')
  })

  it('renders mixed state: assigned founders get check, unassigned get input', () => {
    const html = renderToStaticMarkup(
      <FounderSubdomainList
        {...BASE_PROPS}
        founders={[FOUNDER_A, FOUNDER_B]}
        subdomains={[
          {
            name: 'alice',
            owner: FOUNDER_A.wallet,
            active: true,
            createdAt: '2023-11-15T00:00:00Z',
          },
        ]}
      />
    )

    // Founder A has subdomain
    expect(html).toContain('alice.acme.eth')
    // Founder B gets input
    expect(html).toContain('0xBBBB...BBBB')
    expect(html).toContain('Assign subdomains')
  })

  it('hides assign button when all founders have subdomains', () => {
    const html = renderToStaticMarkup(
      <FounderSubdomainList
        {...BASE_PROPS}
        founders={[FOUNDER_A]}
        subdomains={[
          {
            name: 'alice',
            owner: FOUNDER_A.wallet,
            active: true,
            createdAt: '2023-11-15T00:00:00Z',
          },
        ]}
      />
    )

    expect(html).not.toContain('Assign subdomains')
  })
})
