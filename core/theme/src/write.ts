/**
 * @fileoverview Writes a theme package's artefacts to disk, which is the whole of a theme's
 * build. It is a subpath of its own because it reaches for `node:fs`, and a browser bundle
 * that reads a theme must never pull that in.
 */

import { writeFileSync } from 'node:fs'
import { basename, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { type EmittedTheme, emitTheme } from '#emit.ts'
import { type ThemeValues } from '#tokens.ts'

/**
 * Writes the module a consumer imports the solved table from.
 *
 * @param {ThemeValues} values - The solved table.
 * @returns {string} The module's source, typed so a consumer reads it as a theme rather than
 *     as an untyped blob.
 */
function valuesModule(values: ThemeValues): string {
  return `import { type ThemeValues } from '@stealthscale/core-theme'

/**
 * Holds every token of this theme in both modes, solved from its recipe.
 */
export const values: ThemeValues = ${JSON.stringify(values, null, 2)}
`
}

/**
 * Solves a theme and writes everything its package ships.
 *
 * The name a document writes is the package directory's basename, so a theme states it
 * nowhere and two themes cannot claim one name. A theme's whole build is one call.
 *
 * @param {unknown} recipe - The theme's recipe, as its own module wrote it.
 * @param {string} from - The `import.meta.url` of the script calling this, which sits at the
 *     package root. The name and the target directory are both read from it.
 * @returns {EmittedTheme} The stylesheets and the table that were written, so a build or a
 *     specification can read them back without opening the files.
 * @throws {Error} When the recipe fails its schema, naming every field at fault.
 * @example
 * ```ts
 * // themes/base/emit.ts
 * import { writeTheme } from '@stealthscale/core-theme/write'
 * import { recipe } from './src/recipe.ts'
 *
 * writeTheme(recipe, import.meta.url)
 * ```
 */
export function writeTheme(recipe: unknown, from: string): EmittedTheme {
  const root = new URL('./', from)
  const name = basename(dirname(fileURLToPath(from)))
  const emitted = emitTheme(recipe, name)

  writeFileSync(new URL('src/tokens.gen.css', root), emitted.root)
  writeFileSync(new URL('src/scoped.gen.css', root), emitted.scoped)
  writeFileSync(new URL('src/values.gen.ts', root), valuesModule(emitted.values))

  return emitted
}
