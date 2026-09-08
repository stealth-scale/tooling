import { describe, expect, it } from 'vite-plus/test'

import { contrast } from '#color.ts'
import { oklch, solveContrast } from '#solve.ts'

/** The lightness an `oklch()` value states, 0 to 100. */
function lightness(value: string): number {
  return Number(/^oklch\(([\d.]+)%/u.exec(value)?.[1])
}

describe('oklch', () => {
  it('writes the three channels rounded to what a stylesheet needs', () => {
    expect(oklch(45.678, 0.10123, 258.4)).toBe('oklch(45.7% 0.101 258)')
  })

  it('writes an alpha channel only when given one', () => {
    expect(oklch(12, 0.02, 260, 0.25)).toBe('oklch(12.0% 0.020 260 / 0.25)')
    expect(oklch(12, 0.02, 260)).not.toContain('/')
  })

  it('reduces a chroma the display cannot show, so the value written is the value rendered', () => {
    expect(oklch(75, 0.17, 258), 'a blue past the display at this lightness').toBe(
      'oklch(75.0% 0.129 258)',
    )
    expect(oklch(12, 0.08, 260, 0.25), 'a near-black cannot carry this chroma').toBe(
      'oklch(12.0% 0.048 260 / 0.25)',
    )
  })
})

describe('solveContrast', () => {
  it('darkens a light fill until its white label clears AAA', () => {
    const fill = solveContrast({ chroma: 0.15, hue: 258, lightness: 70 }, 'oklch(99% 0 0)')

    expect(contrast('oklch(99% 0 0)', fill)).toBeGreaterThanOrEqual(7)
  })

  it('lightens a dark fill until its near-black label clears AAA', () => {
    const fill = solveContrast({ chroma: 0.15, hue: 258, lightness: 30 }, 'oklch(16% 0 0)')

    expect(contrast('oklch(16% 0 0)', fill)).toBeGreaterThanOrEqual(7)
  })

  it('stops at the ratio it is given, which is what a lower floor buys', () => {
    const blue = { chroma: 0.19, hue: 258, lightness: 60 }
    const relaxed = solveContrast(blue, 'oklch(99% 0 0)', 4.5)
    const strict = solveContrast(blue, 'oklch(99% 0 0)')

    expect(contrast('oklch(99% 0 0)', relaxed)).toBeGreaterThanOrEqual(4.5)
    expect(lightness(relaxed)).toBeGreaterThan(lightness(strict))
  })

  it('answers its closest attempt when no lightness can reach the ratio', () => {
    const fill = solveContrast({ chroma: 0.1, hue: 258, lightness: 50 }, 'oklch(50% 0 0)')

    expect(fill).toMatch(/^oklch\(/u)
    expect(contrast('oklch(50% 0 0)', fill)).toBeLessThan(7)
  })

  it('walks upward from a label it cannot read, and gives up after sixty steps', () => {
    const fill = solveContrast({ chroma: 0.1, hue: 258, lightness: 20 }, 'not a colour')

    expect(lightness(fill)).toBe(80)
  })
})
