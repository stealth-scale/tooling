/**
 * @fileoverview Tells Tailwind to read the kit's own components. Automatic source detection
 * skips `node_modules`, so in a repository that installs the kit rather than holding its
 * source, every class the kit draws with is one Tailwind never generates: a matrix comes out
 * with no gaps whatever its recipe says, a legend with no colour, and nothing reports it.
 */

import { resolve } from 'node:path'
import { type Plugin } from 'vite-plus'

/**
 * Answers the kit's own directory, which is what Tailwind is pointed at.
 *
 * @returns {string} The package's root, absolute.
 */
export function kitDirectory(): string {
  return resolve(import.meta.dirname, '..', '..')
}

/**
 * Reads the file a request names, without the query Vite appends to it.
 *
 * @param {string} id - The module's id, such as `/w/themes/base/dist/index.css?direct`.
 * @returns {string} The path alone.
 */
function fileOf(id: string): string {
  const [file = ''] = id.split('?')

  return file
}

/**
 * Builds the transform that points Tailwind at one directory.
 *
 * The stylesheets are matched by path rather than by what they hold. A theme's `index.css`
 * imports the file that imports Tailwind, and Tailwind resolves that import itself, off the
 * disk: the file holding `@import "tailwindcss"` never reaches a Vite transform, and the file
 * that does reach one never mentions Tailwind. Only the entry is handed over, so the entry is
 * what this appends to, and the workspace already said which files those are.
 *
 * @param {readonly string[]} stylesheets - The registered appearance stylesheets, absolute.
 * @param {string} directory - The directory to read, absolute.
 * @returns {(source: string, id: string) => null | string} The transform. It answers `null`,
 *     which leaves a file as it arrived, for everything that roots no build.
 */
export function sourceTransform(
  stylesheets: readonly string[],
  directory: string,
): (source: string, id: string) => null | string {
  const roots = new Set(stylesheets)

  return (source: string, id: string) => {
    if (!roots.has(fileOf(id))) return null

    return `${source}\n@source ${JSON.stringify(directory)};\n`
  }
}

/**
 * Builds the plugin that points Tailwind at the kit.
 *
 * @param {readonly string[]} stylesheets - The registered appearance stylesheets, absolute,
 *     which are the entries Vite hands Tailwind.
 * @returns {Plugin} The plugin, for a Storybook configuration's `viteFinal`.
 */
export function tailwindSources(stylesheets: readonly string[]): Plugin {
  return {
    enforce: 'pre',
    name: 'stealth:tailwind-sources',
    transform: sourceTransform(stylesheets, kitDirectory()),
  }
}
