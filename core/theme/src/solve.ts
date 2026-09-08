/**
 * @fileoverview Walks a colour's lightness until it clears a contrast ratio. A fixed
 * lightness cannot do this: at 45 a green is perceptibly lighter than a blue, so one theme's
 * primary clears 7:1 with white text and another's does not. Solving for it makes the ratio
 * a property of the builder rather than of hand-tuned numbers that drift the moment a hue
 * moves.
 */

import { contrast, luminance } from '#color.ts'
import { toGamut } from '#convert.ts'
import { RATIOS } from '#ladder.ts'
import { parseColor } from '#notation.ts'

/**
 * Carries a colour the solver walks from, with the lightness as a percentage.
 */
export interface Start {
  /**
   * Sets the chroma, which the walk holds.
   */
  chroma: number

  /**
   * Sets the hue in degrees, which the walk holds.
   */
  hue: number

  /**
   * Sets the lightness, 0 to 100, which the walk moves.
   */
  lightness: number
}

/**
 * Writes one `oklch()` value, rounded to what a stylesheet needs, at a chroma the display
 * shows.
 *
 * The lightness and the hue are rounded first and the chroma is then mapped into the sRGB
 * gamut at those rounded values and rounded down, so the value written is the value
 * rendered: a browser given a chroma the display cannot show would reduce it the same way,
 * and the contrast this package measures is measured on what a person sees.
 *
 * @param {number} lightness - How light the colour is, 0 to 100.
 * @param {number} chroma - How saturated the colour is asked to be. It is reduced where the
 *     display cannot show it at that lightness and hue.
 * @param {number} hue - Where on the wheel the colour sits, in degrees.
 * @param {number} [alpha] - The opacity, 0 to 1. Default: opaque, and the value carries no
 *     alpha channel at all.
 * @returns {string} The colour as a stylesheet writes it.
 */
export function oklch(lightness: number, chroma: number, hue: number, alpha?: number): string {
  const l = Number(lightness.toFixed(1))
  const h = Number(hue.toFixed(0))
  const c = Math.floor(toGamut(l / 100, chroma, h) * 1000) / 1000
  const channels = `${l.toFixed(1)}% ${c.toFixed(3)} ${h.toFixed(0)}`
  return alpha === undefined ? `oklch(${channels})` : `oklch(${channels} / ${alpha.toFixed(2)})`
}

/**
 * Walks one colour's lightness until it clears the ratio against a colour that stays put.
 *
 * Either side of a pair may be the one that moves: a fill walks away from the label on it,
 * and a text colour walks away from the surface under it. The walk moves away from the fixed
 * colour rather than toward it, so a colour that starts on the wrong side of it still ends
 * on the right one: a fill under white text gets darker, one under near-black text gets
 * lighter. The walk is bounded and answers its closest attempt, so a pairing that cannot
 * reach the ratio, such as a mid-grey against a mid-grey, yields the most legible colour
 * available rather than looping.
 *
 * @param {Start} start - The colour that moves. The hue is held, the chroma is held where
 *     the display shows it, and only the lightness walks.
 * @param {string} fixed - The colour that stays put, which the result has to clear the ratio
 *     against.
 * @param {number} [ratio] - The ratio to clear. Default: AAA.
 * @returns {string} The moving colour as `oklch()`, at the first lightness that clears.
 */
export function solveContrast(start: Start, fixed: string, ratio: number = RATIOS.AAA): string {
  const { chroma, hue, lightness } = start
  const parsed = parseColor(fixed)
  const step = parsed !== undefined && luminance(parsed) > 0.5 ? -1 : 1
  let current = lightness
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const candidate = oklch(current, chroma, hue)
    if (contrast(fixed, candidate) >= ratio) return candidate
    const next = current + step
    if (next < 8 || next > 97) break
    current = next
  }
  return oklch(current, chroma, hue)
}
