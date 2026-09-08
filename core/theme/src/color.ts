/**
 * @fileoverview Reads a colour and measures contrast the way WCAG does. Every colour this
 * system writes is `oklch()`, and everything a computed style reports is `rgb()` or hex, so
 * both are read into one shape and compared there.
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
 * Carries an `oklch()` colour as numbers.
 */
export interface Oklch {
  /**
   * Carries the chroma, from 0 for a grey upwards.
   */
  chroma: number

  /**
   * Carries the hue in degrees, 0 to 360.
   */
  hue: number

  /**
   * Carries the lightness between 0 and 1.
   */
  lightness: number
}

/**
 * Matches `#rgb` and `#rgba`. The alpha digit is read past, because WCAG defines contrast
 * for opaque colours.
 */
const HEX_SHORT = /^#[\da-f]{3}[\da-f]?$/iu

/**
 * Matches `#rrggbb` and `#rrggbbaa`, reading past the alpha for the same reason.
 */
const HEX_LONG = /^#[\da-f]{6}(?:[\da-f]{2})?$/iu

/**
 * Matches the three channels of `oklch()`, with the lightness as a percentage or a number.
 */
const OKLCH = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)/iu

/**
 * Matches the three channels of `rgb()` or `rgba()`, as a computed style reports them.
 */
const RGB = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/iu

/**
 * Clamps a channel to the unit interval.
 *
 * @param {number} value - The channel as computed.
 * @returns {number} The channel between 0 and 1.
 */
function unit(value: number): number {
  return Math.min(1, Math.max(0, value))
}

/**
 * Applies the sRGB transfer function, which makes a linear channel displayable.
 *
 * @param {number} channel - The channel in linear light.
 * @returns {number} The channel as sRGB encodes it.
 */
function encode(channel: number): number {
  return unit(channel <= 0.003_130_8 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055)
}

/**
 * Reads two hex digits as a channel.
 *
 * @param {string} pair - Two hex digits.
 * @returns {number} The channel between 0 and 1.
 */
function fromHex(pair: string): number {
  return Number.parseInt(pair, 16) / 255
}

/**
 * Reads an `oklch()` value.
 *
 * @param {string} value - The text, trimmed.
 * @returns {Oklch | undefined} The channels, or `undefined` when the text is no `oklch()`.
 */
function parseOklch(value: string): Oklch | undefined {
  const match = OKLCH.exec(value)
  if (match === null) return undefined
  const [lightness, percent, chroma, hue] = match.slice(1)
  return {
    chroma: Number(chroma),
    hue: Number(hue),
    lightness: percent === '%' ? Number(lightness) / 100 : Number(lightness),
  }
}

/**
 * Converts Oklch to sRGB through linear sRGB. The matrices are Björn Ottosson's.
 *
 * @param {Oklch} color - The colour in Oklch.
 * @returns {Rgb} The same colour in sRGB.
 */
function oklchToRgb({ chroma, hue, lightness }: Oklch): Rgb {
  const radians = (hue * Math.PI) / 180
  const a = chroma * Math.cos(radians)
  const b = chroma * Math.sin(radians)

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
 * Reads `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa`.
 *
 * @param {string} text - The text, trimmed.
 * @returns {Rgb | undefined} The colour, or `undefined` when the text is no hex colour.
 */
function parseHex(text: string): Rgb | undefined {
  if (HEX_LONG.test(text)) {
    return {
      b: fromHex(text.slice(5, 7)),
      g: fromHex(text.slice(3, 5)),
      r: fromHex(text.slice(1, 3)),
    }
  }
  if (!HEX_SHORT.test(text)) return undefined
  const [r, g, b] = [text.slice(1, 2), text.slice(2, 3), text.slice(3, 4)]
  return { b: fromHex(b + b), g: fromHex(g + g), r: fromHex(r + r) }
}

/**
 * Reads `rgb()` or `rgba()`.
 *
 * @param {string} text - The text, trimmed.
 * @returns {Rgb | undefined} The colour, or `undefined` when the text is no `rgb()`.
 */
function parseRgb(text: string): Rgb | undefined {
  const match = RGB.exec(text)
  if (match === null) return undefined
  const [r, g, b] = match.slice(1)
  return { b: Number(b) / 255, g: Number(g) / 255, r: Number(r) / 255 }
}

/**
 * Reads any colour this system writes or a browser reports: `oklch()`, `#rgb`, `#rrggbb`,
 * `rgb()` and `rgba()`.
 *
 * It answers `undefined` rather than throwing, because the caller is usually reading a
 * computed style that may legitimately be empty.
 *
 * @param {string} value - The colour as text.
 * @returns {Rgb | undefined} The colour in sRGB, or `undefined` when the text is none.
 */
export function parseColor(value: string): Rgb | undefined {
  const text = value.trim()
  const oklch = parseOklch(text)
  if (oklch !== undefined) return oklchToRgb(oklch)
  return parseHex(text) ?? parseRgb(text)
}

/**
 * Inverts the sRGB transfer function for one channel.
 *
 * @param {number} value - The channel as sRGB encodes it.
 * @returns {number} The channel in linear light.
 */
function linearise(value: number): number {
  return value <= 0.040_45 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

/**
 * Measures relative luminance as WCAG defines it.
 *
 * @param {Rgb} color - The colour in sRGB.
 * @returns {number} The luminance between 0 for black and 1 for white.
 */
export function luminance({ b, g, r }: Rgb): number {
  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b)
}

/**
 * Measures the contrast ratio between two colours, from 1 to 21.
 *
 * This is the number WCAG 1.4.3 and 1.4.6 are written against: 4.5 for normal text at AA and
 * 7 at AAA. It answers 0 when either colour cannot be read, so a caller tells "unreadable"
 * from "not measured".
 *
 * @param {string} foreground - The text colour.
 * @param {string} background - The colour behind it.
 * @returns {number} The ratio, or 0 when either colour cannot be read.
 */
export function contrast(foreground: string, background: string): number {
  const front = parseColor(foreground)
  const back = parseColor(background)
  if (front === undefined || back === undefined) return 0
  const a = luminance(front)
  const b = luminance(back)
  const [dark, light] = a < b ? [a, b] : [b, a]
  return (light + 0.05) / (dark + 0.05)
}
