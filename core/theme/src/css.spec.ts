import { describe, expect, it } from 'vite-plus/test'

import { boxShadowOf, densityBlocks, densityDefaults, glowOf, HEADER, radiusOf } from '#css.ts'
import { declarations } from '#stylesheet.ts'

/**
 * Holds two densities to write, one of which draws its ring flush.
 */
const DENSITIES = {
  fallback: 'comfortable',
  focusWidth: 2,
  steps: {
    comfortable: { control: 2.5, focusOffset: 2 },
    compact: { control: 2, focusOffset: 0 },
  },
}

describe('the shadow writers', () => {
  it('writes a box shadow the way the stylesheet does, for a page that draws one by hand', () => {
    expect(boxShadowOf([{ fraction: 40, geometry: '0 1px 3px 0' }])).toBe(
      'inset 0 1px 0 0 var(--shadow-highlight), 0 1px 3px 0 color-mix(in oklch, var(--shadow) 40%, transparent)',
    )
  })

  it('throws a glow in the glow colour, with no raised edge under it', () => {
    expect(glowOf([{ fraction: 80, geometry: '0 0 12px -2px' }])).toBe(
      '0 0 12px -2px color-mix(in oklch, var(--glow) 80%, transparent)',
    )
  })

  it('stacks every layer of a step in the order they are given, under the highlight', () => {
    const stacked = boxShadowOf([
      { fraction: 40, geometry: '0 4px 6px -1px' },
      { fraction: 40, geometry: '0 2px 4px -2px' },
    ])

    expect(stacked.indexOf('--shadow-highlight')).toBeLessThan(stacked.indexOf('0 4px 6px -1px'))
    expect(stacked.indexOf('0 4px 6px -1px')).toBeLessThan(stacked.indexOf('0 2px 4px -2px'))
  })

  it('writes a radius as a multiple of the theme’s own', () => {
    expect(radiusOf(0.75)).toBe('calc(var(--radius) * 0.75)')
  })
})

describe('densityDefaults', () => {
  it('gives a scope that sets no attribute the default density and the ring’s width', () => {
    expect(densityDefaults(DENSITIES)).toEqual([
      '--focus-width: 2px',
      '--height-xs: 2rem',
      '--height-sm: 2.25rem',
      '--height-md: 2.5rem',
      '--height-lg: 2.75rem',
      '--focus-offset: 2px',
    ])
  })

  it('declares nothing for a scope whose default density it does not have', () => {
    expect(densityDefaults({ ...DENSITIES, fallback: 'roomy' })).toEqual([])
  })
})

describe('densityBlocks', () => {
  it('writes a block per density, so a region can be denser than the page around it', () => {
    const css = densityBlocks(DENSITIES, ':root')

    expect(declarations(css, "[data-density='compact'] {")['height-md']).toBe('2rem')
    expect(
      declarations(css, "[data-density='compact'] {")['focus-offset'],
      'packed edge to edge, so the ring sits flush',
    ).toBe('0px')
  })

  it('derives every control step from the density’s one length', () => {
    const compact = declarations(densityBlocks(DENSITIES, ':root'), "[data-density='compact'] {")

    expect(compact['height-xs']).toBe('1.5rem')
    expect(compact['height-sm']).toBe('1.75rem')
    expect(compact['height-md']).toBe('2rem')
    expect(compact['height-lg']).toBe('2.25rem')
  })

  it('takes both forms of a theme’s selector, the element and anything below it', () => {
    const css = densityBlocks(DENSITIES, "[data-theme='probe']")

    expect(css).toContain("[data-theme='probe'][data-density='compact'],")
    expect(css).toContain("[data-theme='probe'] [data-density='compact'] {")
    expect(css, 'the default sits in the block the theme already opens').not.toContain(
      "[data-theme='probe'] {",
    )
  })
})

describe('HEADER', () => {
  it('opens a generated stylesheet, so a reader knows not to edit it', () => {
    expect(HEADER).toContain('Do not edit')
    expect(HEADER).toContain('@stealthscale/core-theme')
  })
})
