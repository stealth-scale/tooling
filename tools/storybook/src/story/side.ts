/**
 * @fileoverview Says which side of its container an element sits on, in the direction the
 * container is written in. Every component gets a right-to-left story, and `direction` on the
 * root proves only that the harness works: what the story owes a reader is which side an icon
 * moved to, and reading that off a class name asserts the class rather than the layout.
 */

/**
 * Names a side of a container as the writing direction sees it, so one claim holds in a
 * left-to-right story and its right-to-left pair.
 */
export type Side = 'end' | 'start'

/**
 * Says which side of a container an element sits on, measured rather than read off a class.
 *
 * The side is logical, so `start` is the left in a left-to-right container and the right in a
 * right-to-left one. That is what lets an LTR story and its RTL pair make the same assertion:
 * a claim written against `left` passes in one and fails in the other whatever the component
 * did, which is how a mirrored layout ships broken.
 *
 * An element centred in its container has no side, and this answers `start` for it, because
 * the nearer edge decides and a tie goes to the first. A story asserting on a centred element
 * is asserting nothing; measure something the component moves.
 *
 * @param {HTMLElement} element - The element to place, such as an icon or a check mark.
 * @param {HTMLElement} container - The element it sits in, such as the control holding it.
 * @returns {Side} The side it sits on, in the container's own direction.
 */
export function sideOf(element: HTMLElement, container: HTMLElement): Side {
  const box = element.getBoundingClientRect()
  const around = container.getBoundingClientRect()
  const nearerTheLeft = box.left - around.left <= around.right - box.right
  const rightToLeft = getComputedStyle(container).direction === 'rtl'

  return nearerTheLeft === rightToLeft ? 'end' : 'start'
}
