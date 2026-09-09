/**
 * @fileoverview Writes a theme package's artefacts, which is the whole of a theme's build. It
 * is a subpath of its own because it reaches for `node:fs`, and a browser bundle that reads a
 * theme must never pull that in.
 *
 * Everything lands in `dist`, beside what the pack step built, so a theme ships one directory
 * and `src` holds only the recipe a person wrote. It is called from the pack's own
 * `build:before` hook rather than a script beside the build: the task runner caches a script
 * by its inputs and knows nothing about what it wrote, so a run that replayed from cache would
 * leave the directory empty.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import {
  looseObject,
  optional,
  record,
  safeParse,
  string,
  unknown,
} from '@stealthscale/core-schema'

import { type EmittedTheme, emitTheme } from '#emit.ts'
import { THEME_CONTRIBUTION, THEME_KEY } from '#registration.ts'
import { type Tables } from '#tables.ts'
import { type ThemeValues } from '#tokens.ts'

/**
 * Accepts a manifest in the one field this reads: the `stealth` registry, keyed by the kind of
 * contribution. Every value stays unread, because the theme's own schema reads its key.
 */
const MANIFEST = looseObject({ stealth: optional(record(string(), unknown())) })

/**
 * Maps every entry a theme package offers to the file that serves it.
 *
 * `writeTheme` writes those files, so the map and the writer are one decision rather than a
 * list a theme copies into its manifest and its build. A theme hands this to `packConfig` as
 * its `staticExports` and writes the same two entries in its own `exports`, which is what a
 * resolver reads before anything is built.
 *
 * The stylesheets take a subpath pattern rather than one entry each, because a theme ships
 * whichever of them `writeTheme` writes and a manifest that lists them by hand goes stale the
 * day one is added.
 */
export const THEME_EXPORTS = {
  './*.css': './dist/*.css',
  './values': './dist/values.mjs',
} as const

/**
 * Declares what the values module holds. It never changes with the palette, so it is written
 * rather than generated from one.
 */
const VALUES_TYPES = `import { type Tables, type ThemeValues } from '@stealthscale/core-theme'

export declare const tables: Tables
export declare const values: ThemeValues
`

/**
 * Writes the module a consumer imports the solved theme from.
 *
 * The tables ship beside the tokens, so a page that draws what a theme states, its durations,
 * its shadows or its type scale, reads them as data rather than parsing a stylesheet.
 *
 * @param {ThemeValues} values - The solved tokens.
 * @param {Tables} tables - The merged tables.
 * @returns {string} The module's source, as JavaScript, since it lands beside what the pack
 *     step built rather than among what it compiles.
 */
function valuesModule(values: ThemeValues, tables: Tables): string {
  return `export const tables = ${JSON.stringify(tables, null, 2)}

export const values = ${JSON.stringify(values, null, 2)}
`
}

/**
 * Says how each written colour was read, so a build states that a pasted hex ships at a
 * lightness the solver chose rather than the one it was written at.
 *
 * @param {string} name - The theme's name.
 * @param {readonly string[]} report - The lines the resolution wrote.
 */
function announce(name: string, report: readonly string[]): void {
  for (const line of report) process.stdout.write(`theme ${name}: ${line}\n`)
}

/**
 * Reads the value a theme's document attribute is written as, out of its own manifest.
 *
 * The manifest rather than the directory, because the directory is the author's and a
 * consumer installs the package under its name. One declaration serves the stylesheet this
 * writes and the registry that reads the package, so the two cannot drift.
 *
 * @param {string} manifest - The package's manifest file, absolute.
 * @returns {string} The name, as `stealth.theme.name` states it.
 * @throws {Error} When the file registers no theme. Nothing else can supply the name, and a
 *     stylesheet written under a guessed one is scoped to an attribute nothing sets.
 */
function nameFrom(manifest: string): string {
  const read = safeParse(MANIFEST, JSON.parse(readFileSync(manifest, 'utf8')))
  const theme = read.ok
    ? safeParse(THEME_CONTRIBUTION, read.value.stealth?.[THEME_KEY])
    : { ok: false as const }

  if (!theme.ok) throw new Error(`${manifest} states no stealth.${THEME_KEY}.name`)
  return theme.value.name
}

/**
 * Solves a theme and writes everything its package ships.
 *
 * A theme's whole build is one call, and its `dist` is complete on its own: a theme that
 * extends another extends its recipe, not its stylesheets.
 *
 * @param {unknown} recipe - The theme's recipe, as its own module wrote it.
 * @param {string} from - The `import.meta.url` of the script calling this, which sits at the
 *     package root. The manifest and the target directory are both found from it.
 * @returns {EmittedTheme} Everything that was written, so a build or a specification reads it
 *     back without opening the files.
 * @throws {Error} When the manifest states no theme name, when the recipe fails its schema,
 *     when a token is missing, or when a pair the theme promises falls below its floor.
 * @example
 * ```ts
 * // themes/base/vite.config.ts, from the pack's build:before hook
 * hooks: { 'build:before': () => writeTheme(recipe, import.meta.url) }
 * ```
 */
export function writeTheme(recipe: unknown, from: string): EmittedTheme {
  const root = new URL('./', from)
  const dist = new URL('dist/', root)
  const name = nameFrom(fileURLToPath(new URL('package.json', root)))
  const emitted = emitTheme(recipe, name)

  mkdirSync(fileURLToPath(dist), { recursive: true })
  writeFileSync(new URL('base.css', dist), emitted.base)
  writeFileSync(new URL('density.css', dist), emitted.density)
  writeFileSync(new URL('fonts.css', dist), emitted.fonts)
  writeFileSync(new URL('index.css', dist), emitted.index)
  writeFileSync(new URL('motion.css', dist), emitted.motion)
  writeFileSync(new URL('utilities.css', dist), emitted.utilities)
  writeFileSync(new URL('scoped.css', dist), emitted.scoped)
  writeFileSync(new URL('tailwind.css', dist), emitted.tailwind)
  writeFileSync(new URL('tokens.css', dist), emitted.tokens)
  writeFileSync(new URL('values.d.mts', dist), VALUES_TYPES)
  writeFileSync(new URL('values.mjs', dist), valuesModule(emitted.values, emitted.tables))

  announce(name, emitted.report)
  return emitted
}
