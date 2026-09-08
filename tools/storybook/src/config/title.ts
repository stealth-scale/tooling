/**
 * @fileoverview Derives where a story sits in the sidebar from where its file sits in the
 * workspace. A repository that titles its stories by hand ends up with two taxonomies, the
 * directories and the sidebar, and they drift the first time something moves. Here the
 * directories are the only one.
 */

import { relative, sep } from 'node:path'

import { titleCase } from '#pages.ts'

/**
 * Separates the sections of a story's title, which is what Storybook nests the sidebar by.
 */
const SEPARATOR = '/'

/**
 * Names the directory a package keeps its source in, which is not part of any title.
 */
const SOURCE = 'src'

/**
 * Takes every extension off a file name, so `button.stories.tsx` is the component's name.
 *
 * @param {string} name - The file's name, extensions and all.
 * @returns {string} The part before the first dot, or the whole name when it has none.
 */
export function stemOf(name: string): string {
  const dot = name.indexOf('.')
  return dot === -1 ? name : name.slice(0, dot)
}

/**
 * Splits a path into its segments, with every extension gone from the last one.
 *
 * @param {string} path - A path relative to something, with the platform's separator.
 * @returns {string[]} The segments. `story/grid.stories.tsx` gives `story` and `grid`.
 */
function segmentsOf(path: string): string[] {
  const parts = path.split(sep)
  const last = parts.length - 1
  return parts.map((segment, index) => (index === last ? stemOf(segment) : segment))
}

/**
 * Derives a story's title from where its file sits.
 *
 * The group directory is the section, the rest of the package's path is the next level, and
 * what sits below the package's `src` is the rest of it. A file named after the directory it
 * sits in names it once, so `components/library/src/button/button.stories.tsx` is
 * `Components/Library/Button` rather than `Components/Library/Button/Button`.
 *
 * @param {string} file - The story file, absolute.
 * @param {string} directory - The directory of the package the file belongs to, absolute.
 *     `packageRoot` finds it.
 * @param {string} root - The workspace root, absolute.
 * @returns {string | undefined} The title, or `undefined` when the package sits outside the
 *     workspace, when it is the workspace itself, or when the file sits outside its `src`.
 */
export function titleOf(file: string, directory: string, root: string): string | undefined {
  const owner = relative(root, directory)
  if (owner === '' || owner.startsWith('..')) return undefined

  const below = relative(directory, file)
  if (below.startsWith('..')) return undefined

  const [source, ...inside] = segmentsOf(below)
  if (source !== SOURCE || inside.length === 0) return undefined

  const last = inside.at(-1)
  const named = inside.length > 1 && last === inside.at(-2) ? inside.slice(0, -1) : inside
  const [group, ...path] = owner.split(sep)

  const section = path.map((segment) => titleCase(segment)).join(' ')
  const rest = named.map((segment) => titleCase(segment))

  return [titleCase(String(group)), section, ...rest].filter((part) => part !== '').join(SEPARATOR)
}
