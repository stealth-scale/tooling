/**
 * @fileoverview Writes a theme package's artefacts, which is the whole of a theme's build. It
 * is a subpath of its own because it reaches for `node:fs`, and a browser bundle that reads a
 * theme must never pull that in.
 *
 * Everything lands in `dist`, beside what the pack step built, so a theme ships one directory
 * and `src` stays what a person wrote. It is called from the pack's own `build:before` hook
 * rather than a script beside the build: the task runner caches a script by its inputs and
 * knows nothing about what it wrote, so a run that replayed from cache would leave the
 * directory empty.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { basename, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { type EmittedTheme, emitTheme, HEADER } from '#emit.ts'
import { type ThemeValues } from '#tokens.ts'

/**
 * Declares what the values module holds. It never changes with the palette, so it is written
 * rather than generated from one.
 */
const VALUES_TYPES = `import { type ThemeValues } from '@stealthscale/core-theme'

export declare const values: ThemeValues
`

/**
 * Writes the module a consumer imports the solved table from.
 *
 * @param {ThemeValues} values - The solved table.
 * @returns {string} The module's source, as JavaScript, since it lands beside what the pack
 *     step built rather than among what it compiles.
 */
function valuesModule(values: ThemeValues): string {
  return `export const values = ${JSON.stringify(values, null, 2)}\n`
}

/**
 * Describes what a theme builds on.
 */
export interface ThemeBase {
  /**
   * Names the package whose shared base this theme extends, as a consumer imports it:
   * `@stealthscale/theme-base`. Default: `.`, for the theme that carries the base itself.
   */
  base?: string
}

/**
 * Writes the stylesheet an app links: Tailwind, the shared base, the densities, the motion
 * vocabulary, then this theme's own tokens.
 *
 * It is generated rather than authored for two reasons. It names generated files, and a
 * stylesheet a person wrote naming `tokens.css` by hand goes stale the day that file is
 * renamed, with the failure landing in whoever consumes the theme rather than in its build.
 * And which Tailwind a theme runs on is the toolchain's decision, not a theme's: every
 * stealth theme is Tailwind with the same plugins, so no theme restates it and none can
 * drift. What a theme does choose, its families, it imports in its own base.
 *
 * Every line is an import, so the Tailwind stack keeps its own stylesheet: a CSS parser
 * refuses an `@import` that follows another at-rule, and `@plugin` written here would have to
 * come after the overrides it is meant to sit under.
 *
 * @param {string} base - The package whose shared base to import, or `.` for this one.
 * @returns {string} The stylesheet, in the order the cascade needs it.
 */
function indexStylesheet(base: string): string {
  return `${HEADER}
@import '${base}/tailwind.css';
@import '${base}/base.css';
@import '${base}/density.css';
@import '${base}/motion.css';
@import './tokens.css';
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
 * @param {Readonly<ThemeBase>} [options] - The package this theme extends. `ThemeBase`
 *     documents every member. Default: the theme carries the shared base itself.
 * @returns {EmittedTheme} The stylesheets and the table that were written, so a build or a
 *     specification can read them back without opening the files.
 * @throws {Error} When the recipe fails its schema, naming every field at fault.
 * @example
 * ```ts
 * // themes/base/vite.config.ts, from the pack's build:before hook
 * hooks: { 'build:before': () => writeTheme(recipe, import.meta.url) }
 * ```
 */
export function writeTheme(
  recipe: unknown,
  from: string,
  options: Readonly<ThemeBase> = {},
): EmittedTheme {
  const dist = new URL('dist/', new URL('./', from))
  const name = basename(dirname(fileURLToPath(from)))
  const emitted = emitTheme(recipe, name)

  mkdirSync(fileURLToPath(dist), { recursive: true })
  writeFileSync(new URL('tokens.css', dist), emitted.root)
  writeFileSync(new URL('scoped.css', dist), emitted.scoped)
  writeFileSync(new URL('values.mjs', dist), valuesModule(emitted.values))
  writeFileSync(new URL('values.d.mts', dist), VALUES_TYPES)
  writeFileSync(new URL('index.css', dist), indexStylesheet(options.base ?? '.'))

  return emitted
}
