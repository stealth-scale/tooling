import { describe, expect, it } from 'vite-plus/test'

import { type Rgb } from '#convert.ts'
import { NAMED } from '#named.ts'
import { parseColor } from '#notation.ts'

/**
 * Writes a colour as the 0 to 255 channels a designer reads, rounded.
 *
 * @param {Rgb | undefined} color - The colour in sRGB, or nothing.
 * @returns {string | undefined} The three channels, comma separated, or `undefined` for none.
 */
function bytes(color: Rgb | undefined): string | undefined {
  return color === undefined
    ? undefined
    : [color.r, color.g, color.b].map((channel) => Math.round(channel * 255)).join(',')
}

describe('hex', () => {
  it('reads the long form, and the short form as the long one doubled', () => {
    expect(bytes(parseColor('#3b82f6'))).toBe('59,130,246')
    expect(bytes(parseColor('#abc'))).toBe(bytes(parseColor('#aabbcc')))
    expect(bytes(parseColor('#ABC'))).toBe(bytes(parseColor('#aabbcc')))
  })

  it('reads past an alpha digit, because WCAG measures opaque colours', () => {
    expect(bytes(parseColor('#3b82f680'))).toBe(bytes(parseColor('#3b82f6')))
    expect(bytes(parseColor('#abc8'))).toBe(bytes(parseColor('#abc')))
  })

  it('refuses a length that is no hex colour', () => {
    expect(parseColor('#12')).toBeUndefined()
    expect(parseColor('#12345')).toBeUndefined()
    expect(parseColor('#gg0000')).toBeUndefined()
  })
})

describe('the sRGB notations', () => {
  it('reads rgb() and rgba() however the arguments are separated', () => {
    expect(bytes(parseColor('rgb(30, 41, 59)'))).toBe('30,41,59')
    expect(bytes(parseColor('rgb(30 41 59)'))).toBe('30,41,59')
    expect(bytes(parseColor('rgba(30 41 59 / 0.5)'))).toBe('30,41,59')
    expect(bytes(parseColor('rgb(50%, 50%, 50%)'))).toBe('128,128,128')
  })

  it('reads color(srgb …), which a browser reports for a wide-gamut colour', () => {
    expect(bytes(parseColor('color(srgb 0.2 0.4 0.8)'))).toBe('51,102,204')
    expect(bytes(parseColor('color(srgb 0 0 0)'))).toBe('0,0,0')
  })

  it('refuses a gamut sRGB cannot hold, rather than clipping and reporting a ratio', () => {
    expect(parseColor('color(display-p3 0.2 0.4 0.8)')).toBeUndefined()
    expect(parseColor('color(rec2020 0.2 0.4 0.8)')).toBeUndefined()
  })
})

describe('the cylindrical notations', () => {
  it('reads hsl() and hsla()', () => {
    expect(bytes(parseColor('hsl(210 50% 40%)'))).toBe('51,102,153')
    expect(bytes(parseColor('hsla(210, 50%, 40%, 0.5)'))).toBe('51,102,153')
    expect(bytes(parseColor('hsl(0 0% 100%)'))).toBe('255,255,255')
  })

  it('wraps a hue past the wheel, and greys a colour with no saturation', () => {
    expect(bytes(parseColor('hsl(370 50% 40%)'))).toBe(bytes(parseColor('hsl(10 50% 40%)')))
    expect(bytes(parseColor('hsl(-350 50% 40%)'))).toBe(bytes(parseColor('hsl(10 50% 40%)')))
    expect(bytes(parseColor('hsl(210 0% 50%)'))).toBe('128,128,128')
  })

  it('reads a hue written in degrees, and none as nothing', () => {
    expect(parseColor('hsl(210deg 50% 40%)')).toEqual(parseColor('hsl(210 50% 40%)'))
    expect(parseColor('oklch(45% 0.17 258deg)')).toEqual(parseColor('oklch(45% 0.17 258)'))
    expect(parseColor('oklch(45% none 258)')).toEqual(parseColor('oklch(45% 0 258)'))
  })

  it('reads hwb(), including the grey a full wash gives', () => {
    expect(bytes(parseColor('hwb(0 0% 0%)'))).toBe('255,0,0')
    expect(bytes(parseColor('hwb(210 100% 100%)'))).toBe('128,128,128')
    expect(bytes(parseColor('hwb(210 20% 30%)'))).toBe('51,115,179')
  })
})

describe('the perceptual notations', () => {
  it('reads oklch() with the lightness as a percentage or a number', () => {
    expect(bytes(parseColor('oklch(45% 0.17 258)'))).toBe('0,79,177')
    expect(parseColor('oklch(0.45 0.17 258)')).toEqual(parseColor('oklch(45% 0.17 258)'))
  })

  it('agrees with the OKLCH reference: pure red is oklch(62.8% 0.2577 29.23)', () => {
    expect(bytes(parseColor('oklch(62.8% 0.2577 29.23)'))).toBe('255,0,0')
  })

  it('reads oklch() and oklab() as the same colour', () => {
    expect(bytes(parseColor('oklab(0.45 -0.03 -0.15)'))).toBe('20,81,168')
    expect(bytes(parseColor('oklab(1 0 0)'))).toBe('255,255,255')
  })

  it('reads lab() at the D50 white point CSS fixes', () => {
    expect(bytes(parseColor('lab(100% 0 0)'))).toBe('255,255,255')
    expect(bytes(parseColor('lab(0% 0 0)'))).toBe('0,0,0')
  })

  it('reads lch() as the polar form of the same lab colour', () => {
    const cartesian = parseColor('lab(50% 20 -30)')
    const polar = parseColor('lch(50% 36.06 303.69)')

    expect(polar?.r).toBeCloseTo(Number(cartesian?.r), 2)
    expect(polar?.g).toBeCloseTo(Number(cartesian?.g), 2)
    expect(polar?.b).toBeCloseTo(Number(cartesian?.b), 2)
  })

  it('maps a colour the display cannot show into its gamut, as the standard does', () => {
    expect(bytes(parseColor('oklch(75% 0.17 258)')), 'clipping gives 101,174,255').toBe(
      '111,174,255',
    )
    expect(bytes(parseColor('lch(50% 100 300)')), 'clipping gives 123,88,255').toBe('123,90,255')
    expect(bytes(parseColor('oklch(97% 0.02 260)')), 'barely outside').toBe('237,246,255')
  })
})

describe('the named colours', () => {
  it('reads a name whatever case it is written in', () => {
    expect(bytes(parseColor('rebeccapurple'))).toBe(bytes(parseColor('#663399')))
    expect(bytes(parseColor('WHITE'))).toBe('255,255,255')
    expect(bytes(parseColor('Black'))).toBe('0,0,0')
  })

  it('knows all 148 CSS names, and reads each as its own hex', () => {
    expect(Object.keys(NAMED)).toHaveLength(148)
    for (const [name, packed] of Object.entries(NAMED)) {
      expect(bytes(parseColor(name)), name).toBe(
        bytes(parseColor(`#${packed.toString(16).padStart(6, '0')}`)),
      )
    }
  })
})

describe('what is not a colour', () => {
  it('answers undefined for transparent, which has none to measure', () => {
    expect(parseColor('transparent')).toBeUndefined()
    expect(parseColor('currentColor')).toBeUndefined()
  })

  it('answers undefined for an empty computed style, rather than throwing', () => {
    expect(parseColor('')).toBeUndefined()
    expect(parseColor('   ')).toBeUndefined()
  })

  it('answers undefined for a function it does not read, or one missing an argument', () => {
    expect(parseColor('not a colour')).toBeUndefined()
    expect(parseColor('cmyk(0 0 0 1)'), 'a function this package does not read').toBeUndefined()
    expect(parseColor('device-cmyk(0 0 0 1)'), 'and one whose name is not a word').toBeUndefined()
    expect(parseColor('rgb(30, 41)')).toBeUndefined()
    expect(parseColor('oklch()')).toBeUndefined()
  })

  it('ignores the whitespace around a value', () => {
    expect(parseColor('  #fff  ')).toEqual(parseColor('#fff'))
  })
})
