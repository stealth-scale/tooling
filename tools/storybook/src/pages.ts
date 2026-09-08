/**
 * @fileoverview Names the pages every Storybook opens with, which document the theme contract
 * rather than a component, and writes a name the way a reader reads it. The configuration
 * finds the pages by these names and the preview sorts the sidebar by them, so the two read
 * one list.
 */

/**
 * Names the section the sidebar shows first. A reader arriving at a design system reads what
 * a theme is before they read one component.
 */
export const FOUNDATIONS = 'Foundations'

/**
 * Lists the pages the kit ships, in the order the sidebar shows them: what a colour is, then
 * type, shape and motion, then what every theme guarantees. Each name is the page's file stem
 * and its title, since Storybook titles a page after its file under the section's prefix.
 */
export const PAGES = ['Colours', 'Typography', 'Shape', 'Motion', 'Accessibility'] as const

/**
 * Writes one path segment as a reader reads it: each dashed word capitalised, spaces between.
 *
 * @param {string} segment - One directory or file name: `library`, `data-display`.
 * @returns {string} The segment title-cased: `Library`, `Data Display`.
 */
export function titleCase(segment: string): string {
  return segment
    .split('-')
    .filter((word) => word !== '')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ')
}
