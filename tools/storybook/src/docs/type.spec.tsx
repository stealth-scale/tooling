import { render } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { DEFAULT_TABLES } from '@stealthscale/core-theme'

import { type Themes } from '#preview/appearance.ts'

import { previewWrote, THEMES } from './fixtures.ts'
import { Leading, Mono, Scale, Tracking, Weights } from './type.tsx'

/**
 * Holds a theme reading at seventeen pixels, which every step of its scale follows.
 */
const LARGER: Themes = Object.fromEntries(
  Object.entries(THEMES).map(([name, theme]) => [
    name,
    {
      ...theme,
      tables: {
        ...theme.tables,
        text: {
          ...theme.tables.text,
          base: { lineHeight: 1.6, size: 1.0625 },
          xs: {
            lineHeight: 1.0625,
            size: 0.7969,
          },
        },
      },
    },
  ]),
)

/**
 * Counts the specimens a block drew.
 */
function specimens(container: HTMLElement): number {
  return container.querySelectorAll('[data-slot="specimen"]').length
}

describe('Scale', () => {
  it('draws every step, smallest first, at its own size', () => {
    const { container } = render(<Scale />)
    previewWrote()

    expect(specimens(container)).toBe(Object.keys(DEFAULT_TABLES.text).length)
    expect(
      container.querySelector('[data-slot="specimen"] span')?.getAttribute('style'),
      'xs first, whatever order the table is written in',
    ).toContain('font-size: 0.75rem')
  })

  it('reads the scale off the theme, so a theme that reads larger draws larger', () => {
    const { container } = render(<Scale />)
    previewWrote({}, LARGER)

    expect(container.textContent, 'the theme states seventeen pixels').toContain('1.0625rem')
    expect(
      container.querySelector('[data-slot="specimen"] span')?.getAttribute('style'),
      'and its smallest step moved with it',
    ).toContain('font-size: 0.7969rem')
  })
})

describe('Weights', () => {
  it('draws every weight, lightest first', () => {
    const { container } = render(<Weights />)
    previewWrote()

    expect(specimens(container)).toBe(Object.keys(DEFAULT_TABLES.fontWeight).length)
    expect(container.textContent).toContain('font-thin')
  })
})

describe('Tracking', () => {
  it('draws every letter spacing in em', () => {
    const { container } = render(<Tracking />)
    previewWrote()

    expect(specimens(container)).toBe(Object.keys(DEFAULT_TABLES.tracking).length)
    expect(container.textContent).toContain('-0.05em')
  })
})

describe('Leading', () => {
  it('draws every line height on text long enough to wrap', () => {
    const { container } = render(<Leading />)
    previewWrote()

    expect(specimens(container)).toBe(Object.keys(DEFAULT_TABLES.leading).length)
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
