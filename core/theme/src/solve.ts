/**
 * @fileoverview Walks a colour's lightness until it clears a contrast ratio. A fixed
 * lightness cannot do this: at 45 a green is perceptibly lighter than a blue, so one theme's
 * primary clears 7:1 with white text and another's does not. Solving for it makes the ratio
 * a property of the builder rather than of hand-tuned numbers that drift the moment a hue
 * moves.
 */

import { contrast, luminance, parseColor } from '#color.ts'
import { RATIOS } from '#ladder.ts'

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
 * Writes one `oklch()` value, rounded to what a stylesheet needs.
 *
 * @param {number} lightness - How light the colour is, 0 to 100.
 * @param {number} chroma - How saturated the colour is.
 * @param {number} hue - Where on the wheel the colour sits, in degrees.
 * @param {number} [alpha] - The opacity, 0 to 1. Default: opaque, and the value carries no
 *     alpha channel at all.
 * @returns {string} The colour as a stylesheet writes it.
 */
export function oklch(lightness: number, chroma: number, hue: number, alpha?: number): string {
  const channels = `${lightness.toFixed(1)}% ${chroma.toFixed(3)} ${hue.toFixed(0)}`
  return alpha === undefined ? `oklch(${channels})` : `oklch(${channels} / ${alpha.toFixed(2)})`
}

/**
 * Walks a fill's lightness until it clears the ratio against the label on it.
 *
 * The walk moves away from the label rather than toward it: a fill carrying white text has
 * to get darker, one carrying near-black text has to get lighter. Reading the direction off
 * the label rather than off the starting lightness is what makes this work for a fill that
 * starts on the wrong side. The walk is bounded and answers its closest attempt, so a pairing
 * that cannot reach the ratio, such as a mid-grey label, yields the most legible colour
 * available rather than looping.
 *
 * @param {Start} start - The colour to walk from. Chroma and hue are held; only lightness
 *     moves.
 * @param {string} label - The colour that has to be readable on the result.
 * @param {number} [ratio] - The ratio to clear. Default: AAA.
 * @returns {string} An `oklch()` value.
 */
export function solveContrast(start: Start, label: string, ratio: number = RATIOS.AAA): string {
  const { chroma, hue, lightness } = start
  const parsed = parseColor(label)
  const step = parsed !== undefined && luminance(parsed) > 0.5 ? -1 : 1
  let current = lightness
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const candidate = oklch(current, chroma, hue)
    if (contrast(label, candidate) >= ratio) return candidate
    const next = current + step
    if (next < 8 || next > 97) break
    current = next
  }
  return oklch(current, chroma, hue)
}
