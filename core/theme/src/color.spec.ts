import { describe, expect, it } from 'vite-plus/test'

import { contrast, luminance } from '#color.ts'

describe('luminance', () => {
  it('runs from 0 for black to 1 for white', () => {
    expect(luminance({ b: 0, g: 0, r: 0 })).toBe(0)
    expect(luminance({ b: 1, g: 1, r: 1 })).toBeCloseTo(1, 5)
  })

  it('weights green most, as the eye does', () => {
    expect(luminance({ b: 0, g: 1, r: 0 })).toBeGreaterThan(luminance({ b: 0, g: 0, r: 1 }))
    expect(luminance({ b: 0, g: 0, r: 1 })).toBeGreaterThan(luminance({ b: 1, g: 0, r: 0 }))
  })
})

describe('contrast', () => {
  it('measures black on white as 21 and the same colour as 1', () => {
    expect(contrast('#000', '#fff')).toBe(21)
    expect(contrast('#777', '#777')).toBe(1)
  })

  it('agrees with the WCAG reference: #777777 on white is 4.48, which fails AA', () => {
    expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 2)
    expect(contrast('#767676', '#ffffff'), 'one step darker passes').toBeGreaterThanOrEqual(4.5)
  })

  it('does not care which colour is in front', () => {
    expect(contrast('#fff', 'oklch(45% 0.17 258)')).toBe(contrast('oklch(45% 0.17 258)', '#fff'))
  })

  it('measures a colour however it was written', () => {
    expect(contrast('white', 'black')).toBe(21)
    expect(contrast('color(srgb 1 1 1)', 'rgb(0, 0, 0)')).toBe(21)
    expect(contrast('hsl(0 0% 100%)', 'lab(0% 0 0)')).toBe(21)
  })

  it('answers 0 when either colour cannot be read, which is not the same as unreadable', () => {
    expect(contrast('', '#fff')).toBe(0)
    expect(contrast('#fff', 'nope')).toBe(0)
    expect(contrast('transparent', '#fff')).toBe(0)
  })
})
