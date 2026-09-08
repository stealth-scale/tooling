/**
 * @fileoverview Measures contrast the way WCAG does. This is the number 1.4.3, 1.4.6 and
 * 1.4.11 are written against, and it is what every fill in a generated palette is solved
 * until it clears.
 */

import { decode, type Rgb } from '#convert.ts'
import { parseColor } from '#notation.ts'

/**
 * Measures relative luminance as WCAG defines it.
 *
 * @param {Rgb} color - The colour in sRGB.
 * @returns {number} The luminance between 0 for black and 1 for white.
 */
export function luminance({ b, g, r }: Rgb): number {
  return 0.2126 * decode(r) + 0.7152 * decode(g) + 0.0722 * decode(b)
}

/**
 * Measures the contrast ratio between two colours, from 1 to 21.
 *
 * It answers 0 when either colour cannot be read, so a caller tells "unreadable" from "not
 * measured". The order does not matter: the ratio is the same whichever colour is in front.
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
