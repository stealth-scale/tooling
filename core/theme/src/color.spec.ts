import { describe, expect, it } from 'vite-plus/test'

import { contrast, luminance, parseColor, type Rgb } from '#color.ts'

/** A colour as the 0 to 255 channels a designer reads, rounded. */
function bytes(color: Rgb | undefined): [number, number, number] | undefined {
  return color === undefined
    ? undefined
    : [Math.round(color.r * 255), Math.round(color.g * 255), Math.round(color.b * 255)]
}

describe('parseColor', () => {
  it('reads long and short hex to the same channels', () => {
    expect(bytes(parseColor('#3b82f6'))).toEqual([59, 130, 246])
    expect(bytes(parseColor('#abc'))).toEqual(bytes(parseColor('#aabbcc')))
    expect(bytes(parseColor('#ABC'))).toEqual(bytes(parseColor('#aabbcc')))
  })

  it('reads past a hex alpha digit, because WCAG contrast is defined for opaque colours', () => {
    expect(parseColor('#3b82f680')).toEqual(parseColor('#3b82f6'))
    expect(parseColor('#abc8')).toEqual(parseColor('#abc'))
  })

  it('agrees with the OKLCH reference: pure red is oklch(62.8% 0.2577 29.23)', () => {
    expect(bytes(parseColor('oklch(62.8% 0.2577 29.23)'))).toEqual([255, 0, 0])
  })

  it('reads rgb() and rgba() as a computed style reports them', () => {
    expect(bytes(parseColor('rgb(30, 41, 59)'))).toEqual([30, 41, 59])
    expect(bytes(parseColor('rgba(30 41 59 / 0.5)'))).toEqual([30, 41, 59])
  })

  it('reads oklch() with the lightness as a percentage or a number', () => {
    expect(bytes(parseColor('oklch(45% 0.17 258)'))).toEqual([0, 79, 177])
    expect(parseColor('oklch(0.45 0.17 258)')).toEqual(parseColor('oklch(45% 0.17 258)'))
  })

  it('clamps a colour the display cannot show, so a channel never leaves 0 to 1', () => {
    const pale = parseColor('oklch(97% 0.02 260)')

    expect(pale?.b).toBe(1)
    expect(bytes(pale)).toEqual([237, 246, 255])
  })

  it('reads black and white to the ends of the range', () => {
    expect(bytes(parseColor('oklch(0% 0 0)'))).toEqual([0, 0, 0])
    expect(bytes(parseColor('oklch(100% 0 0)'))).toEqual([255, 255, 255])
  })

  it('ignores the whitespace around a value', () => {
    expect(parseColor('  #fff  ')).toEqual(parseColor('#fff'))
  })

  it('answers undefined for anything else, because a computed style may be empty', () => {
    expect(parseColor('')).toBeUndefined()
    expect(parseColor('transparent')).toBeUndefined()
    expect(parseColor('#12')).toBeUndefined()
    expect(parseColor('hsl(0 0% 0%)')).toBeUndefined()
  })
})

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

  it('clears AAA for white on the solved primary the palette starts from', () => {
    expect(contrast('#fff', 'oklch(45% 0.17 258)')).toBeGreaterThanOrEqual(7)
  })

  it('answers 0 when either colour cannot be read, which is not the same as unreadable', () => {
    expect(contrast('', '#fff')).toBe(0)
    expect(contrast('#fff', 'nope')).toBe(0)
  })
})
