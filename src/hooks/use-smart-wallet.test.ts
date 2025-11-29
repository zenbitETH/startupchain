import { describe, expect, it } from 'vitest'

// Test the pure utility function separately
import { calculateThreshold } from '../lib/blockchain/safe-factory.js'

describe('calculateThreshold', () => {
  it('should return 1 for solo founder', () => {
    expect(calculateThreshold(1)).toBe(1)
  })

  it('should return 2 for 2 founders (both must sign)', () => {
    expect(calculateThreshold(2)).toBe(2)
  })

  it('should return ceil(n/2) for 3-5 founders', () => {
    expect(calculateThreshold(3)).toBe(2) // ceil(3/2) = 2
    expect(calculateThreshold(4)).toBe(2) // ceil(4/2) = 2
    expect(calculateThreshold(5)).toBe(3) // ceil(5/2) = 3
  })

  it('should cap threshold at 5 for large groups', () => {
    expect(calculateThreshold(6)).toBe(3) // ceil(6/2) = 3
    expect(calculateThreshold(10)).toBe(5) // capped at 5
    expect(calculateThreshold(20)).toBe(5) // capped at 5
  })

  it('should throw for zero or negative owners', () => {
    expect(() => calculateThreshold(0)).toThrow('At least one owner required')
    expect(() => calculateThreshold(-1)).toThrow('At least one owner required')
  })
})

describe('getThresholdDescription', () => {
  it('should describe solo founder', async () => {
    const { getThresholdDescription } = await import(
      '../lib/blockchain/safe-factory.js'
    )
    expect(getThresholdDescription(1, 1)).toBe('Solo founder')
  })

  it('should describe multi-sig requirement', async () => {
    const { getThresholdDescription } = await import(
      '../lib/blockchain/safe-factory.js'
    )
    expect(getThresholdDescription(3, 2)).toBe('2 of 3 signatures required')
    expect(getThresholdDescription(5, 3)).toBe('3 of 5 signatures required')
  })
})
