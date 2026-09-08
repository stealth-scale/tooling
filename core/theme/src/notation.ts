/**
 * @fileoverview Reads the notations CSS writes a colour in. A stylesheet this package
 * generates writes `oklch()`, and a browser reporting a computed style answers `rgb()` or
 * `color(srgb …)`, so both ends of the round trip are read here and converted once.
 *
 * An alpha channel is read past. WCAG defines contrast between two opaque colours, and a
 * caller measuring a translucent one is asking about a colour that depends on what is behind
 * it, which no ratio can answer.
 */

import {
  fromPacked,
  fromPolar,
  hslToRgb,
  hwbToRgb,
  labToRgb,
  oklabToRgb,
  type Rgb,
  unit,
} from '#convert.ts'
import { NAMED } from '#named.ts'

/**
 * Matches `#rgb`, `#rgba`, `#rrggbb` and `#rrggbbaa`.
 */
const HEX = /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/iu

/**
 * Matches a functional notation, capturing its name and everything inside the brackets.
 */
const FUNCTION = /^([a-z]+)\(([^)]*)\)$/iu

/**
 * Splits the arguments of a functional notation on commas, whitespace and the alpha slash.
 */
const ARGUMENTS = /[\s,/]+/u

/**
 * Reads one argument as a number, taking a percentage as a share of the range it spans.
 *
 * @param {string | undefined} text - The argument as written.
 * @param {number} span - The value 100 per cent stands for in this position.
 * @returns {number} The number, or `Number.NaN` when the argument is absent.
 */
function scalar(text: string | undefined, span: number): number {
  if (text === undefined || text === '') return Number.NaN
  return text.endsWith('%') ? (Number(text.slice(0, -1)) / 100) * span : Number(text)
}

/**
 * Reads `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa`.
 *
 * @param {string} text - The text, trimmed.
 * @returns {Rgb | undefined} The colour, or `undefined` when the text is no hex colour.
 */
function fromHex(text: string): Rgb | undefined {
  if (!HEX.test(text)) return undefined
  const digits = text.slice(1)
  const width = digits.length > 4 ? 2 : 1

  /**
   * Reads one channel, doubling its digit in the short form.
   *
   * @param {number} index - Which channel to read, counting from red.
   * @returns {number} The channel between 0 and 1.
   */
  const channel = (index: number): number => {
    const pair = digits.slice(index * width, index * width + width)
    return Number.parseInt(width === 1 ? pair + pair : pair, 16) / 255
  }

  return { b: channel(2), g: channel(1), r: channel(0) }
}

/**
 * Reads a colour whose three arguments are already sRGB channels, as `rgb()` and
 * `color(srgb …)` write them.
 *
 * @param {readonly (string | undefined)[]} args - The three channels, in order.
 * @param {number} span - The value 100 per cent stands for in this notation.
 * @returns {Rgb} The colour in sRGB.
 */
function channels(args: readonly (string | undefined)[], span: number): Rgb {
  const [first, second, third] = args
  return {
    b: unit(scalar(third, span) / span),
    g: unit(scalar(second, span) / span),
    r: unit(scalar(first, span) / span),
  }
}

/**
 * Reads the colour a functional notation names.
 *
 * Every space CSS can express and sRGB can hold is here. A wide-gamut space such as
 * `display-p3` is deliberately absent, because clipping it into sRGB would report a ratio for
 * a colour the page does not show.
 */
const FUNCTIONS: Readonly<Record<string, (args: readonly (string | undefined)[]) => Rgb>> = {
  color: (args) => channels(args.slice(1), 1),
  hsl: ([hue, saturation, lightness]) =>
    hslToRgb(scalar(hue, 360), unit(scalar(saturation, 1)), unit(scalar(lightness, 1))),
  hwb: ([hue, whiteness, blackness]) =>
    hwbToRgb(scalar(hue, 360), unit(scalar(whiteness, 1)), unit(scalar(blackness, 1))),
  lab: ([lightness, a, b]) =>
    labToRgb({ a: scalar(a, 125), b: scalar(b, 125), lightness: scalar(lightness, 100) }),
  lch: ([lightness, chroma, hue]) =>
    labToRgb(fromPolar(scalar(lightness, 100), scalar(chroma, 150), scalar(hue, 360))),
  oklab: ([lightness, a, b]) =>
    oklabToRgb({ a: scalar(a, 0.4), b: scalar(b, 0.4), lightness: scalar(lightness, 1) }),
  oklch: ([lightness, chroma, hue]) =>
    oklabToRgb(fromPolar(scalar(lightness, 1), scalar(chroma, 0.4), scalar(hue, 360))),
  rgb: (args) => channels(args, 255),
}

/**
 * Reads any colour CSS names that WCAG can measure: a hex triplet or quad, `rgb()`, `hsl()`,
 * `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, `color(srgb …)`, and the 148 named
 * colours.
 *
 * It answers `undefined` rather than throwing, because a caller is usually reading a computed
 * style that may legitimately be empty, and for `transparent`, which has no colour to
 * measure. A wide-gamut space such as `display-p3` is not read: clipping it into sRGB would
 * report a ratio for a colour the page does not show.
 *
 * @param {string} value - The colour as text.
 * @returns {Rgb | undefined} The colour in sRGB, or `undefined` when the text names none.
 */
export function parseColor(value: string): Rgb | undefined {
  const text = value.trim().toLowerCase()
  if (text === '') return undefined

  const named = NAMED[text]
  if (named !== undefined) return fromPacked(named)

  const hex = fromHex(text)
  if (hex !== undefined) return hex

  const call = FUNCTION.exec(text)
  if (call === null) return undefined

  const [name, inside] = call.slice(1)
  const args = String(inside).trim().split(ARGUMENTS)
  const read = FUNCTIONS[String(name).replace(/a$/u, '')] ?? FUNCTIONS[String(name)]
  if (read === undefined) return undefined
  if (name === 'color' && args[0] !== 'srgb') return undefined

  const parsed = read(args)
  return Number.isNaN(parsed.r + parsed.g + parsed.b) ? undefined : parsed
}
