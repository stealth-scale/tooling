/**
 * @fileoverview Converts the colour spaces CSS writes into sRGB, which is the space WCAG
 * measures contrast in. Every notation this package reads lands here, so a colour is
 * converted once and compared once however it was written.
 */

/**
 * Carries a colour in sRGB, each channel between 0 and 1.
 */
export interface Rgb {
  /**
   * Carries the blue channel.
   */
  b: number

  /**
   * Carries the green channel.
   */
  g: number

  /**
   * Carries the red channel.
   */
  r: number
}

/**
 * Carries a colour in a rectangular perceptual space, either CIE Lab or Oklab.
 */
export interface Lab {
  /**
   * Carries the green to red axis.
   */
  a: number

  /**
   * Carries the blue to yellow axis.
   */
  b: number

  /**
   * Carries the lightness, 0 to 1 for Oklab and 0 to 100 for CIE Lab.
   */
  lightness: number
}

/**
 * Sets the white point CIE Lab is measured against, which CSS fixes at D50.
 */
const D50 = { x: 0.3457 / 0.3585, y: 1, z: (1 - 0.3457 - 0.3585) / 0.3585 }

/**
 * Clamps a channel to the unit interval.
 *
 * @param {number} value - The channel as computed.
 * @returns {number} The channel between 0 and 1.
 */
export function unit(value: number): number {
  return Math.min(1, Math.max(0, value))
}

/**
 * Applies the sRGB transfer function, which makes a linear channel displayable.
 *
 * @param {number} channel - The channel in linear light.
 * @returns {number} The channel as sRGB encodes it, clamped.
 */
export function encode(channel: number): number {
  return unit(channel <= 0.003_130_8 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055)
}

/**
 * Inverts the sRGB transfer function for one channel.
 *
 * @param {number} value - The channel as sRGB encodes it.
 * @returns {number} The channel in linear light.
 */
export function decode(value: number): number {
  return value <= 0.040_45 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

/**
 * Turns a polar colour into its rectangular form, which is what Oklch is to Oklab and Lch is
 * to Lab.
 *
 * @param {number} lightness - The lightness, in the space's own units.
 * @param {number} chroma - How saturated the colour is.
 * @param {number} hue - Where on the wheel the colour sits, in degrees.
 * @returns {Lab} The same colour, rectangular.
 */
export function fromPolar(lightness: number, chroma: number, hue: number): Lab {
  const radians = (hue * Math.PI) / 180
  return { a: chroma * Math.cos(radians), b: chroma * Math.sin(radians), lightness }
}

/**
 * Converts Oklab to sRGB through linear sRGB. The matrices are Björn Ottosson's.
 *
 * @param {Lab} color - The colour in Oklab, its lightness 0 to 1.
 * @returns {Rgb} The same colour in sRGB.
 */
export function oklabToRgb({ a, b, lightness }: Lab): Rgb {
  const l = (lightness + 0.396_337_777_4 * a + 0.215_803_757_3 * b) ** 3
  const m = (lightness - 0.105_561_345_8 * a - 0.063_854_172_8 * b) ** 3
  const s = (lightness - 0.089_484_177_5 * a - 1.291_485_548 * b) ** 3

  return {
    b: encode(-0.004_196_086_3 * l - 0.703_418_614_7 * m + 1.707_614_701 * s),
    g: encode(-1.268_438_004_6 * l + 2.609_757_401_1 * m - 0.341_319_396_5 * s),
    r: encode(4.076_741_662_1 * l - 3.307_711_591_3 * m + 0.230_969_929_2 * s),
  }
}

/**
 * Inverts the CIE Lab transfer function for one axis.
 *
 * @param {number} value - The axis as Lab encodes it.
 * @returns {number} The axis as a share of the white point.
 */
function fromLabAxis(value: number): number {
  return value ** 3 > 0.008_856_451_7 ? value ** 3 : (116 * value - 16) / 903.296_296_3
}

/**
 * Converts CIE Lab to sRGB through XYZ at D50, which is the white point CSS fixes for
 * `lab()` and `lch()`. The Bradford-adapted matrix is the one CSS Color 4 publishes.
 *
 * @param {Lab} color - The colour in CIE Lab, its lightness 0 to 100.
 * @returns {Rgb} The same colour in sRGB.
 */
export function labToRgb({ a, b, lightness }: Lab): Rgb {
  const f = (lightness + 16) / 116
  const x = fromLabAxis(f + a / 500) * D50.x
  const y = fromLabAxis(f) * D50.y
  const z = fromLabAxis(f - b / 200) * D50.z

  return {
    b: encode(0.071_945_3 * x - 0.228_991_4 * y + 1.405_242_7 * z),
    g: encode(-0.978_768_4 * x + 1.916_141_5 * y + 0.033_454_0 * z),
    r: encode(3.133_856_1 * x - 1.616_866_7 * y - 0.490_614_6 * z),
  }
}

/**
 * Converts HSL to sRGB. The formula is the one CSS Color 4 writes.
 *
 * @param {number} hue - Where on the wheel the colour sits, in degrees.
 * @param {number} saturation - How saturated the colour is, 0 to 1.
 * @param {number} lightness - How light the colour is, 0 to 1.
 * @returns {Rgb} The same colour in sRGB.
 */
export function hslToRgb(hue: number, saturation: number, lightness: number): Rgb {
  const turns = ((hue % 360) + 360) % 360
  const amount = saturation * Math.min(lightness, 1 - lightness)

  /**
   * Reads one channel off the wheel.
   *
   * @param {number} offset - Where the channel sits relative to the hue.
   * @returns {number} The channel between 0 and 1.
   */
  const channel = (offset: number): number => {
    const position = (offset + turns / 30) % 12
    return unit(lightness - amount * Math.max(-1, Math.min(position - 3, 9 - position, 1)))
  }

  return { b: channel(4), g: channel(8), r: channel(0) }
}

/**
 * Converts HWB to sRGB, which CSS defines as a hue washed with white and blackness.
 *
 * @param {number} hue - Where on the wheel the colour sits, in degrees.
 * @param {number} whiteness - How much white is mixed in, 0 to 1.
 * @param {number} blackness - How much black is mixed in, 0 to 1.
 * @returns {Rgb} The same colour in sRGB.
 */
export function hwbToRgb(hue: number, whiteness: number, blackness: number): Rgb {
  if (whiteness + blackness >= 1) {
    const grey = whiteness / (whiteness + blackness)
    return { b: grey, g: grey, r: grey }
  }
  const pure = hslToRgb(hue, 1, 0.5)

  /**
   * Washes one channel with the whiteness and the blackness.
   *
   * @param {number} value - The pure hue's channel.
   * @returns {number} The washed channel.
   */
  const wash = (value: number): number => value * (1 - whiteness - blackness) + whiteness

  return { b: wash(pure.b), g: wash(pure.g), r: wash(pure.r) }
}

/**
 * Unpacks a colour written as `0xrrggbb`.
 *
 * @param {number} packed - The colour as one integer.
 * @returns {Rgb} The same colour in sRGB.
 */
export function fromPacked(packed: number): Rgb {
  return {
    b: (packed % 256) / 255,
    g: (Math.floor(packed / 256) % 256) / 255,
    r: (Math.floor(packed / 65_536) % 256) / 255,
  }
}
