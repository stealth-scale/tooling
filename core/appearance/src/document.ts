/**
 * @fileoverview Writes an appearance on the document root and reads one back. The attribute
 * names are the contract between three parties that never import each other's code: the base
 * stylesheet writes its selectors against them, the host and the catalogue write the document
 * with them, and a spec holds the stylesheet to the table.
 */

import { type Appearance } from './appearance.ts'

/**
 * Names the attribute each value is written to on the document root. The mode is the one
 * value that is a class rather than an attribute, because that is what the `dark:` variant
 * keys off.
 */
export const ATTRIBUTES = {
  density: 'data-density',
  direction: 'dir',
  locale: 'lang',
  reducedMotion: 'data-reduced-motion',
  theme: 'data-theme',
} as const

/**
 * Names the class that marks dark mode on the document root.
 */
export const MODE_CLASS = 'dark'

/**
 * Describes what an appearance is written to: the attributes and the class list of a
 * document's root element. `document.documentElement` satisfies it; a specification hands in
 * a record.
 */
export interface Root {
  /**
   * Carries the classes on the element.
   */
  classList: {
    /**
     * Returns `true` when the element carries the class.
     *
     * @param {string} token - The class to look for.
     * @returns {boolean} `true` when it is there.
     */
    contains: (token: string) => boolean

    /**
     * Adds or removes the class, as `force` says.
     *
     * @param {string} token - The class to add or remove.
     * @param {boolean} force - `true` to add it, `false` to remove it.
     * @returns {boolean} `true` when the class is there afterwards.
     */
    toggle: (token: string, force: boolean) => boolean
  }

  /**
   * Reads an attribute.
   *
   * @param {string} name - The attribute's name.
   * @returns {null | string} Its value, or `null` when the element does not carry it.
   */
  getAttribute: (name: string) => null | string

  /**
   * Removes an attribute. Removing one the element does not carry does nothing.
   *
   * @param {string} name - The attribute's name.
   */
  removeAttribute: (name: string) => void

  /**
   * Writes an attribute.
   *
   * @param {string} name - The attribute's name.
   * @param {string} value - Its value.
   */
  setAttribute: (name: string, value: string) => void
}

/**
 * Writes every value of an appearance on the document root, so every stylesheet and every
 * component below it reads the same six.
 *
 * @param {Appearance} appearance - The appearance to write.
 * @param {Root} root - The document's root element.
 */
export function applyToDocument(appearance: Appearance, root: Root): void {
  root.setAttribute(ATTRIBUTES.theme, appearance.theme)
  root.setAttribute(ATTRIBUTES.density, appearance.density)
  root.setAttribute(ATTRIBUTES.locale, appearance.locale)
  root.setAttribute(ATTRIBUTES.direction, appearance.direction)
  root.classList.toggle(MODE_CLASS, appearance.mode === 'dark')
  if (appearance.reducedMotion) root.setAttribute(ATTRIBUTES.reducedMotion, '')
  else root.removeAttribute(ATTRIBUTES.reducedMotion)
}

/**
 * Reads the appearance a document root carries.
 *
 * The mode and the motion are always read, because a class or an attribute is either there
 * or not. The theme, the density, the locale and the direction are read only when the root
 * carries the attribute, so a document nothing has written yet reports none of them.
 *
 * @param {Root} root - The document's root element.
 * @returns {Partial<Appearance>} The values the root carries.
 */
export function readFromDocument(root: Root): Partial<Appearance> {
  const read: Partial<Appearance> = {
    mode: root.classList.contains(MODE_CLASS) ? 'dark' : 'light',
    reducedMotion: root.getAttribute(ATTRIBUTES.reducedMotion) !== null,
  }
  const theme = root.getAttribute(ATTRIBUTES.theme)
  const density = root.getAttribute(ATTRIBUTES.density)
  const locale = root.getAttribute(ATTRIBUTES.locale)
  const direction = root.getAttribute(ATTRIBUTES.direction)

  if (theme !== null) read.theme = theme
  if (density !== null) read.density = density
  if (locale !== null) read.locale = locale
  if (direction === 'ltr' || direction === 'rtl') read.direction = direction
  return read
}
