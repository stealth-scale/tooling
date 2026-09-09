/**
 * @fileoverview States how a package declares itself a theme, which is one entry in its
 * `stealth` manifest field. The toolchain finds every theme in a workspace by reading that
 * entry, so adding a theme is adding a package rather than writing its name in a list. This
 * module owns the words a theme is declared with; the reader that walks the manifests holds
 * the entry to this schema and knows nothing else about it.
 */

import { looseObject, type SchemaOf, string } from '@stealthscale/core-schema'

/**
 * Names the key a theme registers itself under, inside the `stealth` field.
 */
export const THEME_KEY = 'theme'

/**
 * Describes what a package writes to declare itself a theme.
 *
 * The recipe is not here. A theme solves its palette in its own build and exports the result
 * at `./index.css`, `./scoped.css` and `./values`, so a consumer reads an artefact rather than
 * reaching into the package for a module to evaluate.
 */
export interface ThemeContribution {
  /**
   * Carries the value the document's theme attribute is written as: `ember`.
   *
   * It was the basename of the package's directory, which held while every theme was a
   * package in the workspace reading it. A theme a repository installs sits in
   * `node_modules/@scope/theme-ember`, so the author's directory and the consumer's are
   * different names for one theme, and the build baked the author's into `scoped.css` while
   * the reader saw the consumer's. Stating it is what makes the two the same.
   */
  name: string

  /**
   * Carries the name a person picks the theme by, as they read it: `Thesmos`.
   */
  title: string
}

/**
 * Accepts a theme's entry in the `stealth` field.
 *
 * A key it does not name passes through unread, so a package writing something a later
 * toolchain reads is not refused by this one.
 */
export const THEME_CONTRIBUTION: SchemaOf<ThemeContribution> = looseObject({
  name: string(),
  title: string(),
})
