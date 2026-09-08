import { render } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { FONT_WEIGHT, LEADING, TEXT, TRACKING } from '@stealthscale/core-theme'

import { Leading, Mono, Scale, Tracking, Weights } from './type.tsx'

/**
 * Counts the specimens a block drew.
 */
function specimens(container: HTMLElement): number {
  return container.querySelectorAll('[data-slot="specimen"]').length
}

describe('Scale', () => {
  it('draws every step, smallest first, at its own size', () => {
    const { container } = render(<Scale />)
    const first = container.querySelector('[data-slot="specimen"] span')

    expect(specimens(container)).toBe(Object.keys(TEXT).length)
    expect(first?.getAttribute('style')).toContain('font-size: 0.75rem')
  })
})

describe('Weights', () => {
  it('draws every weight, lightest first', () => {
    const { container } = render(<Weights />)

    expect(specimens(container)).toBe(Object.keys(FONT_WEIGHT).length)
    expect(container.textContent).toContain('font-thin')
  })
})

describe('Tracking', () => {
  it('draws every letter spacing in em', () => {
    const { container } = render(<Tracking />)

    expect(specimens(container)).toBe(Object.keys(TRACKING).length)
    expect(container.textContent).toContain('-0.05em')
  })
})

describe('Leading', () => {
  it('draws every line height on text long enough to wrap', () => {
    const { container } = render(<Leading />)

    expect(specimens(container)).toBe(Object.keys(LEADING).length)
    expect(container.querySelector('p')?.textContent?.length).toBeGreaterThan(80)
  })
})

describe('Mono', () => {
  it('draws the monospace family at three sizes', () => {
    const { container } = render(<Mono />)

    expect(specimens(container)).toBe(3)
    expect(container.textContent).toContain('0x4d2')
  })
})
