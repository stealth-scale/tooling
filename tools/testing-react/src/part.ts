/**
 * @fileoverview Finds a documented part of a rendered component, through the `data-slot` the
 * contract suite holds every component to.
 */

/**
 * Finds the documented part a component drew, through its `data-slot`.
 *
 * It throws rather than answering nothing, so a specification needs neither a non-null
 * assertion, which the lint refuses, nor a guard at every call site.
 *
 * @param {ParentNode} container - The rendered output.
 * @param {string} slot - The part's `data-slot`.
 * @returns {HTMLElement} The element carrying that slot.
 * @throws {Error} When nothing in the output carries that slot, naming the slot.
 */
export function part(container: ParentNode, slot: string): HTMLElement {
  const found = container.querySelector<HTMLElement>(`[data-slot="${slot}"]`)
  if (found === null) {
    throw new Error(`No [data-slot="${slot}"] in the rendered output.`)
  }
  return found
}
