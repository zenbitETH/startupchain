import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./startupchain-client', () => ({
  publicClient: {
    getLogs: vi.fn(),
    getBlock: vi.fn(),
  },
}))

describe('getCompanyEvents', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_STARTUPCHAIN_ADDRESS =
      '0x1111111111111111111111111111111111111111'
  })

  it('maps logs into timeline entries', async () => {
    const { publicClient } = await import('./startupchain-client.js')
    const { getCompanyEvents } = await import('./get-company-events.js')

    const logArgs = {
      companyId: 1n,
      safeAddress: '0x2222222222222222222222222222222222222222',
      ensName: 'acme',
      creationDate: 10n,
      threshold: 2n,
    }

    const logsMock = publicClient.getLogs as ReturnType<typeof vi.fn>
    logsMock.mockResolvedValue([
      {
        blockNumber: 100n,
        transactionHash: '0xaaaa',
        args: logArgs,
      },
    ])

    const blockMock = publicClient.getBlock as ReturnType<typeof vi.fn>
    blockMock.mockResolvedValue({
      timestamp: 1700000000n,
    })

    const events = await getCompanyEvents(
      '0x2222222222222222222222222222222222222222'
    )

    expect(events).toHaveLength(1)
    expect(events[0].companyId).toBe('1')
    expect(events[0].ensName).toBe('acme')
    expect(events[0].threshold).toBe(2)
    expect(events[0].createdAt?.getFullYear()).toBe(2023)
    expect(publicClient.getLogs).toHaveBeenCalledWith(
      expect.objectContaining({
        args: {
          safeAddress: '0x2222222222222222222222222222222222222222',
        },
      })
    )
  })
})
