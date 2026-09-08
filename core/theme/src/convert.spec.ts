import { describe, expect, it } from 'vite-plus/test'

import {
  decode,
  encode,
  fromPacked,
  fromPolar,
  hslToRgb,
  hwbToRgb,
  inGamut,
  type Lab,
  labToRgb,
  linearToOklab,
  mapToGamut,
  oklabToLinear,
  oklabToRgb,
  type Rgb,
  toGamut,
  unit,
} from '#convert.ts'

/**
 * Writes a colour as the 0 to 255 channels a designer reads, rounded.
 *
 * @param {Rgb} color - The colour in sRGB.
 * @returns {string} The three channels, comma separated.
 */
function bytes({ b, g, r }: Rgb): string {
  return [r, g, b].map((channel) => Math.round(channel * 255)).join(',')
}

describe('unit', () => {
  it('clamps a channel to the interval a display can show', () => {
    expect(unit(-0.5)).toBe(0)
    expect(unit(1.5)).toBe(1)
    expect(unit(0.25)).toBe(0.25)
  })
})

describe('the transfer functions', () => {
  it('invert one another across the range', () => {
    for (const value of [0, 0.02, 0.04, 0.2, 0.5, 0.9, 1]) {
      expect(encode(decode(value))).toBeCloseTo(value, 6)
    }
  })

  it('meet at the joint the standard puts them either side of', () => {
    expect(decode(0.040_45)).toBeCloseTo(0.003_130_8, 6)
    expect(encode(0.003_130_8)).toBeCloseTo(0.040_45, 6)
  })
})

describe('fromPolar', () => {
  it('turns a hue and a chroma into the two axes', () => {
    expect(fromPolar(0.5, 0.2, 0)).toEqual({ a: 0.2, b: 0, lightness: 0.5 })
    expect(fromPolar(0.5, 0.2, 90).b).toBeCloseTo(0.2, 6)
    expect(fromPolar(0.5, 0.2, 180).a).toBeCloseTo(-0.2, 6)
  })
})

describe('oklabToRgb', () => {
  it('sends the ends of the lightness axis to black and white', () => {
    expect(bytes(oklabToRgb({ a: 0, b: 0, lightness: 0 }))).toBe('0,0,0')
    expect(bytes(oklabToRgb({ a: 0, b: 0, lightness: 1 }))).toBe('255,255,255')
  })

  it('leaves a colour with no chroma neutral', () => {
    const grey = oklabToRgb({ a: 0, b: 0, lightness: 0.6 })

    expect(grey.r).toBeCloseTo(grey.g, 4)
    expect(grey.g).toBeCloseTo(grey.b, 4)
  })

  it('maps what the display cannot show toward grey, as the standard does', () => {
    const blue = fromPolar(0.75, 0.17, 258)
    const linear = oklabToLinear(blue)

    expect(linear.b).toBeGreaterThan(1)
    expect(bytes(oklabToRgb(blue)), 'clipping would give 101,174,255').toBe('111,174,255')
    expect(oklabToRgb(blue).r, 'less chroma is more red in a blue').toBeGreaterThan(
      encode(linear.r),
    )
  })
})

describe('linearToOklab', () => {
  it('inverts oklabToLinear', () => {
    for (const [lightness, chroma, hue] of [
      [0.45, 0.17, 258],
      [0.75, 0.17, 258],
      [0.3, 0.1, 150],
    ] as const) {
      const color = fromPolar(lightness, chroma, hue)
      const back = linearToOklab(oklabToLinear(color))

      expect(back.lightness).toBeCloseTo(color.lightness, 6)
      expect(back.a).toBeCloseTo(color.a, 6)
      expect(back.b).toBeCloseTo(color.b, 6)
    }
  })

  it('agrees with the OKLCH reference: sRGB red has the lightness 0.628', () => {
    expect(linearToOklab({ b: 0, g: 0, r: 1 }).lightness).toBeCloseTo(0.628, 3)
  })
})

describe('mapToGamut', () => {
  it('leaves a colour the display shows alone', () => {
    const grey = { a: 0, b: 0, lightness: 0.5 }

    expect(mapToGamut(grey)).toBe(grey)
  })

  it('brings the chroma down and moves the lightness by less than a person notices', () => {
    const blue = fromPolar(0.75, 0.17, 258)
    const mapped = mapToGamut(blue)

    expect(inGamut(mapped)).toBe(true)
    expect(Math.hypot(mapped.a, mapped.b)).toBeLessThan(0.17)
    expect(Math.abs(mapped.lightness - blue.lightness)).toBeLessThan(0.02)
  })

  it('sends a colour beyond either end of the lightness axis to white or black', () => {
    expect(mapToGamut({ a: 0.1, b: 0, lightness: 1.02 })).toEqual({ a: 0, b: 0, lightness: 1 })
    expect(mapToGamut({ a: 0.1, b: 0, lightness: -0.02 })).toEqual({ a: 0, b: 0, lightness: 0 })
  })
})

describe('inGamut', () => {
  it('accepts black, white and a grey between them', () => {
    expect(inGamut({ a: 0, b: 0, lightness: 0 })).toBe(true)
    expect(inGamut({ a: 0, b: 0, lightness: 1 })).toBe(true)
    expect(inGamut({ a: 0, b: 0, lightness: 0.5 })).toBe(true)
  })

  it('refuses a colour a channel of which the display would have to clip', () => {
    expect(inGamut(fromPolar(0.45, 0.1, 258)), 'a blue the display shows').toBe(true)
    expect(inGamut(fromPolar(0.75, 0.17, 258)), 'a blue past the display').toBe(false)
    expect(inGamut({ a: 0, b: 0, lightness: 1.02 }), 'lighter than white').toBe(false)
  })
})

describe('toGamut', () => {
  it('leaves a chroma the display shows alone', () => {
    expect(toGamut(0.45, 0.1, 258)).toBe(0.1)
  })

  it('reduces a chroma the display cannot show to the boundary, and no further', () => {
    const shown = toGamut(0.75, 0.17, 258)

    expect(shown).toBeLessThan(0.17)
    expect(shown).toBeGreaterThan(0)
    expect(inGamut(fromPolar(0.75, shown, 258))).toBe(true)
    expect(inGamut(fromPolar(0.75, shown + 0.001, 258)), 'the next thousandth is out').toBe(false)
  })

  it('answers no chroma at all where even the grey is outside the display', () => {
    expect(toGamut(1.02, 0.01, 258)).toBe(0)
  })
})

describe('labToRgb', () => {
  it('sends the ends of the lightness axis to black and white', () => {
    expect(bytes(labToRgb({ a: 0, b: 0, lightness: 0 }))).toBe('0,0,0')
    expect(bytes(labToRgb({ a: 0, b: 0, lightness: 100 }))).toBe('255,255,255')
  })

  it('reproduces each sRGB primary from the Lab the standard gives for it, within a step', () => {
    // The reference is rounded to four decimals, which puts a primary a hair outside the
    // gamut, so a channel may land one step of 255 off after the mapping.
    const primaries: readonly (readonly [Lab, Rgb])[] = [
      [
        { a: 80.8124, b: 69.8851, lightness: 54.2905 },
        { b: 0, g: 0, r: 1 },
      ],
      [
        { a: -79.2873, b: 80.9902, lightness: 87.8181 },
        { b: 0, g: 1, r: 0 },
      ],
      [
        { a: 68.2986, b: -112.0294, lightness: 29.5683 },
        { b: 1, g: 0, r: 0 },
      ],
    ]

    for (const [lab, primary] of primaries) {
      const shown = labToRgb(lab)

      for (const channel of ['r', 'g', 'b'] as const) {
        expect(Math.abs(shown[channel] - primary[channel]) * 255, channel).toBeLessThan(1)
      }
    }
  })

  it('leaves a colour with no chroma neutral, which a mistyped matrix row would tint', () => {
    const grey = labToRgb({ a: 0, b: 0, lightness: 50 })

    expect(bytes(grey)).toBe('119,119,119')
    expect(grey.r).toBeCloseTo(grey.g, 3)
    expect(grey.g).toBeCloseTo(grey.b, 3)
  })

  it('maps a lab colour the display cannot show into its gamut, as the standard does', () => {
    expect(
      bytes(labToRgb({ a: 80, b: -100, lightness: 50 })),
      'clipping would give 165,40,255',
    ).toBe('159,77,255')
  })
})

describe('hslToRgb', () => {
  it('walks the six primaries round the wheel', () => {
    const wheel = [0, 60, 120, 180, 240, 300].map((hue) => hslToRgb(hue, 1, 0.5))

    expect(wheel.map((color) => bytes(color))).toEqual([
      '255,0,0',
      '255,255,0',
      '0,255,0',
      '0,255,255',
      '0,0,255',
      '255,0,255',
    ])
  })

  it('greys a colour with no saturation, whatever its hue', () => {
    expect(hslToRgb(210, 0, 0.5)).toEqual(hslToRgb(30, 0, 0.5))
  })
})

describe('hwbToRgb', () => {
  it('gives the pure hue when nothing is washed in', () => {
    expect(hwbToRgb(120, 0, 0)).toEqual(hslToRgb(120, 1, 0.5))
  })

  it('gives a grey when the washes fill the colour, in their own proportion', () => {
    expect(hwbToRgb(120, 0.5, 0.5)).toEqual({ b: 0.5, g: 0.5, r: 0.5 })
    expect(hwbToRgb(120, 0.75, 0.25)).toEqual({ b: 0.75, g: 0.75, r: 0.75 })
  })
})

describe('fromPacked', () => {
  it('unpacks each channel out of one integer', () => {
    expect(fromPacked(0xff_00_00)).toEqual({ b: 0, g: 0, r: 1 })
    expect(fromPacked(0x00_ff_00)).toEqual({ b: 0, g: 1, r: 0 })
    expect(fromPacked(0x00_00_ff)).toEqual({ b: 1, g: 0, r: 0 })
    expect(fromPacked(0x66_33_99).r).toBeCloseTo(102 / 255, 6)
  })
})
