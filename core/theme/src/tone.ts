/**
 * @fileoverview Reads a colour the way a person hands one over. A designer has a hex, a
 * developer has a hue, and an expert has a hue with a saturation of its own; all three are one
 * tone here. The solver keeps the hue and the chroma and sets the lightness itself, because
 * the lightness is what a contrast guarantee is solved on.
 */

import { decode, linearToOklab, toPolar } from '#convert.ts'
import { parseColor } from '#notation.ts'

/**
 * States a hue and, where a theme has an opinion, how saturated it is.
 */
export interface ToneParts {
  /**
   * Sets how saturated the tone is. Default: what the role it is used for takes.
   */
  chroma?: number

  /**
   * Sets where on the wheel the tone sits, 0 to 360.
   */
  hue: number
}

/**
 * Names a colour as a person has it: any colour CSS writes and sRGB holds, such as `#2d5bd7`;
 * a hue on the wheel; or a hue with its own chroma.
 */
export type Tone = number | string | ToneParts

/**
 * Carries the two channels of a tone the solver keeps.
 */
export interface Toned {
  /**
   * Carries how saturated the tone is.
   */
  chroma: number

  /**
   * Carries where on the wheel the tone sits, in degrees.
   */
  hue: number
}

/**
 * Returns `true` when a string names a colour this package reads.
 *
 * @param {string} value - The colour as written.
 * @returns {boolean} `true` for a notation `parseColor` reads.
 */
export function isColor(value: string): boolean {
  return parseColor(value) !== undefined
}

/**
 * Reads a tone as the hue and the chroma the solver keeps.
 *
 * A written colour is read into Oklch, and its lightness is dropped on purpose: at the same
 * lightness a green is perceptibly lighter than a blue, so the lightness a brand wrote is not
 * the one its label reads on, and the solver sets it per mode. A hue takes the chroma its role
 * takes; a hue with a chroma keeps its own.
 *
 * @param {Tone} tone - The tone as the recipe wrote it.
 * @param {number} chroma - The chroma the role takes where the tone names none.
 * @returns {Toned} The hue and the chroma.
 * @throws {Error} When a string names no colour this package reads.
 */
export function toneOf(tone: Tone, chroma: number): Toned {
  if (typeof tone === 'number') return { chroma, hue: tone }
  if (typeof tone === 'string') {
    const rgb = parseColor(tone)
    if (rgb === undefined) throw new Error(`${tone} names no colour`)
    const polar = toPolar(linearToOklab({ b: decode(rgb.b), g: decode(rgb.g), r: decode(rgb.r) }))
    return { chroma: polar.chroma, hue: polar.hue }
  }
  return { chroma: tone.chroma ?? chroma, hue: tone.hue }
}
