import { describe, expect, it } from 'vite-plus/test'

import { isColor, toneOf } from '#tone.ts'

describe('isColor', () => {
  it('accepts every notation the package reads', () => {
    expect(isColor('#2d5bd7')).toBe(true)
    expect(isColor('rgb(45 91 215)')).toBe(true)
    expect(isColor('oklch(52% 0.19 258)')).toBe(true)
    expect(isColor('rebeccapurple')).toBe(true)
  })

  it('refuses a string that names no colour, and one that names a gamut sRGB cannot hold', () => {
    expect(isColor('#gg5bd7')).toBe(false)
    expect(isColor('periwinkleish')).toBe(false)
    expect(isColor('color(display-p3 1 0 0)')).toBe(false)
  })
})

describe('toneOf', () => {
  it('takes a hue as a hue, and gives it the chroma its role takes', () => {
    expect(toneOf(258, 0.17)).toEqual({ chroma: 0.17, hue: 258 })
  })

  it('keeps the chroma a tone states, and takes the role’s where it states none', () => {
    expect(toneOf({ chroma: 0.2, hue: 258 }, 0.17)).toEqual({ chroma: 0.2, hue: 258 })
    expect(toneOf({ hue: 258 }, 0.17)).toEqual({ chroma: 0.17, hue: 258 })
  })

  it('reads a written colour as its hue and its chroma, and drops the lightness', () => {
    const read = toneOf('oklch(52% 0.19 258)', 0.17)

    expect(read.hue, 'the hue it was written at').toBeCloseTo(258, 0)
    expect(read.chroma, 'the chroma it was written at, not the role’s').toBeCloseTo(0.19, 2)
  })

  it('reads a hex the same way, since a designer has one and not an oklch', () => {
    const read = toneOf('#2d5bd7', 0.17)

    expect(read.hue).toBeGreaterThan(250)
    expect(read.hue).toBeLessThan(280)
    expect(read.chroma).toBeGreaterThan(0.1)
  })

  it('answers a hue of nothing for a grey, which has none to read', () => {
    expect(toneOf('#808080', 0.17).chroma).toBeCloseTo(0, 2)
  })

  it('refuses a string that names no colour, rather than solving one at random', () => {
    expect(() => toneOf('periwinkleish', 0.17)).toThrow('periwinkleish names no colour')
  })
})
