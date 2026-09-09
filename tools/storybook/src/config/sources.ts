/**
 * @fileoverview Tells Tailwind to read the kit's own components. Automatic source detection
 * skips `node_modules`, so in a repository that installs the kit rather than holding its
 * source, every class the kit draws with is a class Tailwind never generates: a grid comes out
 * with no gaps whatever its recipe says, a legend with no colour, and nothing reports it.
 */

import { resolve } from 'node:path'
import { type Plugin } from 'vite-plus'

/**
 * Matches a stylesheet that roots a Tailwind build, which is the one `@source` has to sit in.
 * A directive in a file loaded as its own entry starts a second build and reaches nothing.
 */
const ROOT_SHEET = /@import\s+["']tailwindcss["']/u

/**
 * Matches a stylesheet asked for as text, which is a string rather than a build.
 */
const AS_TEXT = /\?(?:raw|url)\b/u

/**
 * Answers the kit's own directory, which is what Tailwind is pointed at.
 *
 * @returns {string} The package's root, absolute.
 */
export function kitDirectory(): string {
  return resolve(import.meta.dirname, '..', '..')
}

/**
 * Builds the transform that points Tailwind at one directory.
 *
 * @param {string} directory - The directory to read, absolute.
 * @returns {(source: string, id: string) => null | string} The transform. It answers `null`,
 *     which is what leaves a file as it arrived, for every file that roots no build.
 */
export function sourceTransform(directory: string): (source: string, id: string) => null | string {
  return (source: string, id: string) => {
    if (AS_TEXT.test(id) || !id.includes('.css') || !ROOT_SHEET.test(source)) return null

    return `${source}\n@source ${JSON.stringify(directory)};\n`
  }
}

/**
 * Builds the plugin that points Tailwind at the kit.
 *
 * The directive is appended to the stylesheet that roots the build rather than written into a
 * file the kit ships, because that stylesheet belongs to whichever theme the workspace
 * registered, and a theme has no business knowing a catalogue exists.
 *
 * @returns {Plugin} The plugin, for a Storybook configuration's `viteFinal`.
 */
export function tailwindSources(): Plugin {
  return {
    enforce: 'pre',
    name: 'stealth:tailwind-sources',
    transform: sourceTransform(kitDirectory()),
  }
}
