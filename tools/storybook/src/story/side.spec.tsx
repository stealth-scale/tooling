import { describe, expect, it } from 'vite-plus/test'

import { sideOf } from './side.ts'

/**
 * Sets how wide the container every case measures against is.
 */
const WIDTH = 200

/**
 * Builds an element that reports a box and a direction, since jsdom lays nothing out and
 * every rectangle it measures is zero.
 *
 * @param {number} left - Where the element starts.
 * @param {number} right - Where it ends.
 * @param {string} [direction] - The direction it is written in. Default: left to right.
 * @returns {HTMLElement} The element, ready to measure.
 */
function placed(left: number, right: number, direction = 'ltr'): HTMLElement {
  const element = document.createElement('div')
  element.style.direction = direction
  element.getBoundingClientRect = (): DOMRect => new DOMRect(left, 0, right - left, 10)
  return element
}

describe('sideOf', () => {
  it('reads the near edge as the start where a container runs left to right', () => {
    const container = placed(0, WIDTH)

    expect(sideOf(placed(0, 20), container)).toBe('start')
    expect(sideOf(placed(180, WIDTH), container)).toBe('end')
  })

  it('reads the same two positions the other way round in a right-to-left container', () => {
    const container = placed(0, WIDTH, 'rtl')

    expect(sideOf(placed(0, 20), container), 'the left is the end here').toBe('end')
    expect(sideOf(placed(180, WIDTH), container), 'and the right is the start').toBe('start')
  })

  it('holds one claim across a pair, which is what makes the pair worth drawing', () => {
    const icon = { left: 4, right: 24 }
    const mirrored = { left: WIDTH - 24, right: WIDTH - 4 }

    expect(sideOf(placed(icon.left, icon.right), placed(0, WIDTH))).toBe('start')
    expect(sideOf(placed(mirrored.left, mirrored.right), placed(0, WIDTH, 'rtl'))).toBe('start')
  })

  it('gives a centred element to the start, since the nearer edge decides and a tie is first', () => {
    expect(sideOf(placed(90, 110), placed(0, WIDTH))).toBe('start')
  })
})
