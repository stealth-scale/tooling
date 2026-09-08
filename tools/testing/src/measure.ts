/**
 * @fileoverview Reads geometry off a rendered element, so a specification asserts what a
 * reader would see rather than what a class name promises.
 */

/**
 * Describes the box a measurement reads: the two inline edges of a rendered element.
 */
export interface Box {
  /**
   * Holds the distance from the viewport's left edge to the element's, in pixels.
   */
  left: number

  /**
   * Holds the distance from the viewport's left edge to the element's right edge, in pixels.
   */
  right: number
}

/**
 * Names what a measurement needs of an element: its box, and nothing else.
 *
 * Structural rather than `Element`, for two reasons. This package compiles without the DOM
 * library, and a specification states the boxes it is measuring instead of laying out a
 * document, which jsdom reports as zero anyway. A real element satisfies it, because
 * `DOMRect` carries both edges.
 */
export interface Measured {
  /**
   * Reads the element's box.
   *
   * @returns {Box} The box the element currently occupies.
   */
  getBoundingClientRect: () => Box
}

/**
 * Reads a CSS length as a number.
 *
 * `getComputedStyle` answers in `px` strings. A comparison against `NaN` is false rather than
 * loud, so a measurement that failed to parse would pass while measuring nothing. The
 * conversion lives here once, and a length with no number in it reads as `0`.
 *
 * @param {string} length - A computed length, with its unit.
 * @returns {number} The number in front of the unit. `0` for a length with no number.
 */
export function pixels(length: string): number {
  // eslint-disable-next-line unicorn/prefer-number-coercion -- `Number('16px')` is NaN
  const value = Number.parseFloat(length)
  return Number.isNaN(value) ? 0 : value
}

/**
 * Measures how far apart two elements sit in the inline direction.
 *
 * Zero means flush: a shared border rather than a gap, which is the claim a segmented control
 * makes. Reading it from the boxes rather than from a class catches the day the rounding and
 * the border stop agreeing.
 *
 * @param {Measured} first - The left-hand element in a row.
 * @param {Measured} second - The element after it.
 * @returns {number} The gap between them, in pixels. Never negative.
 */
export function seamBetween(first: Measured, second: Measured): number {
  return Math.abs(second.getBoundingClientRect().left - first.getBoundingClientRect().right)
}
