import { describe, expect, it } from 'vite-plus/test'

import { type Measured, pixels, seamBetween } from './measure.ts'

/**
 * Builds an element that reports the box a case is about.
 *
 * @param {number} left - The box's left edge.
 * @param {number} right - Its right edge.
 * @returns {Measured} An element reporting exactly that box.
 */
function boxed(left: number, right: number): Measured {
  return { getBoundingClientRect: () => ({ left, right }) }
}

describe('pixels', () => {
  it('reads the number in front of the unit', () => {
    expect(pixels('16px')).toBe(16)
    expect(pixels('0.5rem')).toBe(0.5)
  })

  it('reads a negative length, which a margin may be', () => {
    expect(pixels('-4px')).toBe(-4)
  })

  it('answers 0 for a length with no number, rather than a NaN nothing compares against', () => {
    expect(pixels('auto')).toBe(0)
    expect(pixels('')).toBe(0)
  })
})

describe('seamBetween', () => {
  it('answers 0 when the two share an edge, which is the claim a segmented control makes', () => {
    expect(seamBetween(boxed(0, 80), boxed(80, 160))).toBe(0)
  })

  it('measures the gap between them', () => {
    expect(seamBetween(boxed(0, 80), boxed(92, 160))).toBe(12)
  })

  it('answers a distance rather than a direction when the two overlap', () => {
    expect(seamBetween(boxed(0, 80), boxed(72, 160))).toBe(8)
  })
})
