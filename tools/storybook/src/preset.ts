/**
 * @fileoverview Registers the two halves of the kit with Storybook: the entry that draws the
 * frame around a story, and the annotations that run inside the story's own document.
 * `storybookConfig` names this preset, so a repository configures neither.
 */

import { extname, join } from 'node:path'

/**
 * Names this package, which is what the preview annotation is known as.
 */
const SELF = '@stealthscale/tool-storybook'

/**
 * Names one preview annotation the way Storybook's Vite builder takes it: the file to import,
 * and the specifier it is known by.
 */
export interface PreviewAnnotation {
  /**
   * Names the file, absolute. The builder imports it by this path and hands it to Vite's
   * dependency scanner, so what the preview reaches is optimised before the first story loads.
   */
  absolute: string

  /**
   * Carries the specifier the preview is known by.
   */
  bare: string
}

/**
 * Names a file of this package relative to this preset, with the extension this layout uses.
 *
 * The preset sits beside the manager and above the preview in both layouts, and the extension
 * is the same for all three: `.ts` beside the source, `.mjs` beside what was packed.
 *
 * @param {readonly string[]} directories - The directories below this file's own, if any.
 * @param {string} name - The file's name, extension left off.
 * @returns {string} The file, absolute.
 */
function beside(directories: readonly string[], name: string): string {
  const here = import.meta.filename
  return join(here, '..', ...directories, `${name}${extname(here)}`)
}

/**
 * Names the entries Storybook loads into the manager, which is the frame around a story.
 *
 * @param {readonly string[]} [existing] - The entries Storybook has already. Default: none.
 * @returns {string[]} The entries, this package's own last.
 */
export function managerEntries(existing: readonly string[] = []): string[] {
  return [...existing, beside([], 'manager')]
}

/**
 * Names the modules Storybook loads into the preview, which is the document a story draws in.
 *
 * The path is what the builder imports, and it is read in Node, where the repository's source
 * condition is off: in the repository that owns this kit it therefore names `dist` while a
 * page importing `@stealthscale/tool-storybook/docs` is resolved by Vite with the condition on
 * and reaches `src`. The builder writes every annotation into its entry as a path, so a bare
 * specifier here is read as a relative one and resolves nowhere. What the two resolutions
 * would otherwise split, the preview's store keeps whole.
 *
 * @param {readonly (PreviewAnnotation | string)[]} [existing] - The modules Storybook has
 *     already. Default: none.
 * @returns {(PreviewAnnotation | string)[]} The modules, this package's own last.
 */
export function previewAnnotations(
  existing: readonly (PreviewAnnotation | string)[] = [],
): (PreviewAnnotation | string)[] {
  return [...existing, { absolute: beside(['preview'], 'index'), bare: `${SELF}/preview` }]
}
