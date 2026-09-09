/**
 * @fileoverview Reads what a documented part became: the attributes it carries, and the
 * element it rendered as.
 */

import { part } from './part.ts'

/**
 * Reads a `data-` attribute off a documented part.
 *
 * It throws where the part is missing, as `part` does, so an assertion on an absent attribute
 * reads as "no such part" rather than as "undefined is not 'sm'".
 *
 * @param {ParentNode} container - The rendered output.
 * @param {string} slot - The part's `data-slot`.
 * @param {string} name - The attribute, without its `data-` prefix.
 * @returns {string | undefined} The value, or nothing where the attribute is absent.
 * @throws {Error} When nothing in the output carries that slot.
 */
export function attr(container: ParentNode, slot: string, name: string): string | undefined {
  return part(container, slot).dataset[name]
}

/**
 * Reads the element a part rendered as, upper-cased the way the document reports it.
 *
 * This is the polymorphism every component taking `render` owes: a card asked to be an
 * `article` is an `ARTICLE`, and a title asked to be an `h2` is an `H2`, in the page outline
 * rather than only in the class list.
 *
 * @param {ParentNode} container - The rendered output.
 * @param {string} slot - The part's `data-slot`.
 * @returns {string} Its tag name.
 * @throws {Error} When nothing in the output carries that slot.
 */
export function renderedAs(container: ParentNode, slot: string): string {
  return part(container, slot).tagName
}
