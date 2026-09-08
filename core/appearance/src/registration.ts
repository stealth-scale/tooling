/**
 * @fileoverview States how a design system declares what it contributes to anything that
 * draws with it, which is one entry in its `stealth` manifest field. A host and a catalogue
 * both need the same three things before the first pixel: the provider to render, the
 * stylesheets to load before any theme, and the densities on offer. They read that entry
 * rather than each keeping its own list.
 */

import { array, exactOptional, looseObject, type SchemaOf, string } from '@stealthscale/core-schema'

/**
 * Names the key a design system registers itself under, inside the `stealth` field.
 */
export const APPEARANCE_KEY = 'appearance'

/**
 * Describes what a design system contributes to anything drawing with it.
 *
 * Every member is optional, because a package contributes what it has: one package registers
 * the provider and the base stylesheet, another adds a stylesheet of its own and nothing else.
 */
export interface AppearanceContribution {
  /**
   * Lists the densities the base stylesheet declares, the first being the default. They are
   * what an offer's `densities` is built from.
   */
  densities?: readonly string[]

  /**
   * Names the module whose default export applies an appearance to the tree below it,
   * relative to the package. One package in a workspace registers one.
   */
  provider?: string

  /**
   * Lists the stylesheets to load before any theme, relative to the package: the utilities,
   * the fonts, the densities, the keyframes.
   */
  stylesheets?: readonly string[]
}

/**
 * Accepts a design system's entry in the `stealth` field.
 *
 * A key it does not name passes through unread, so a package writing something a later
 * toolchain reads is not refused by this one.
 */
export const APPEARANCE_CONTRIBUTION: SchemaOf<AppearanceContribution> = looseObject({
  densities: exactOptional(array(string())),
  provider: exactOptional(string()),
  stylesheets: exactOptional(array(string())),
})
