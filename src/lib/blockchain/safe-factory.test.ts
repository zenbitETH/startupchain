import { describe, expect, it } from 'vitest'

import { calculateThreshold, getThresholdDescription } from './safe-factory'

describe('calculateThreshold', () => {
  it('returns 1 for solo founder', () => {
    expect(calculateThreshold(1)).toBe(1)
  })

  it('returns 2 for 2 founders (both must sign)', () => {
    expect(calculateThreshold(2)).toBe(2)
  })

  it('returns ceil(n/2) for 3 founders', () => {
    expect(calculateThreshold(3)).toBe(2)
  })

  it('returns ceil(n/2) for 4 founders', () => {
    expect(calculateThreshold(4)).toBe(2)
  })

  it('returns ceil(n/2) for 5 founders', () => {
    expect(calculateThreshold(5)).toBe(3)
  })

  it('returns ceil(n/2) for 6 founders', () => {
    // 6 founders -> ceil(6/2) = 3, which is under cap
    expect(calculateThreshold(6)).toBe(3)
  })

  it('caps at 5 for 10 founders', () => {
    expect(calculateThreshold(10)).toBe(5)
  })

  it('caps at 5 for 100 founders', () => {
    expect(calculateThreshold(100)).toBe(5)
  })

  it('throws for 0 owners', () => {
    expect(() => calculateThreshold(0)).toThrow('At least one owner required')
  })

  it('throws for negative owners', () => {
    expect(() => calculateThreshold(-1)).toThrow('At least one owner required')
  })
})

describe('getThresholdDescription', () => {
  it('returns "Solo founder" for single owner', () => {
    expect(getThresholdDescription(1, 1)).toBe('Solo founder')
  })

  it('returns signature requirement for multiple owners', () => {
    expect(getThresholdDescription(3, 2)).toBe('2 of 3 signatures required')
  })

  it('returns signature requirement for 2-of-2', () => {
    expect(getThresholdDescription(2, 2)).toBe('2 of 2 signatures required')
  })
})
