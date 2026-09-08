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
 * The value written to the document's theme attribute is not here: it is the basename of the
 * package's directory, so two themes cannot claim one name and no package repeats where it
 * already is.
 */
export interface ThemeContribution {
  /**
   * Names the module whose default export is the palette recipe, relative to the package:
   * `./src/recipe.ts`.
   */
  recipe: string

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
  recipe: string(),
  title: string(),
})
