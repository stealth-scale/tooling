/**
 * @fileoverview Names the six values a product sets on its document before it draws anything,
 * as one value every writer builds and one reader takes: the host from a deployment document
 * and a person's settings, the catalogue from its toolbars, a settings screen from a form.
 */

import { type Direction } from '@stealthscale/core-locale'
import {
  array,
  boolean,
  locale,
  object,
  picklist,
  type SchemaOf,
  string,
} from '@stealthscale/core-schema'

/**
 * Names the two modes every theme ships, light or dark within it.
 */
export type Mode = 'dark' | 'light'

/**
 * Describes how a product is drawn for one person.
 */
export interface Appearance {
  /**
   * Names the control density the base stylesheet declares: `comfortable`, `compact`.
   */
  density: string

  /**
   * Names the direction the text runs in. It follows the locale's script unless a caller
   * states it.
   */
  direction: Direction

  /**
   * Names the locale the words are rendered in, as a BCP-47 tag the product ships words for.
   */
  locale: string

  /**
   * Picks light or dark within the theme.
   */
  mode: Mode

  /**
   * Marks that motion is reduced to what conveys state, whatever the machine says.
   */
  reducedMotion: boolean

  /**
   * Names the theme whose tokens resolve, which is the `data-theme` value its stylesheet is
   * scoped to.
   */
  theme: string
}

/**
 * Describes what a product offers, which is what a toolbar or a settings screen lists and
 * what a value at a boundary is held to.
 */
export interface Offered {
  /**
   * Lists the densities the base stylesheet declares, the first being the default.
   */
  densities: readonly string[]

  /**
   * Lists the locales the product ships words for, as BCP-47 tags, the first being the
   * fallback.
   */
  locales: readonly string[]

  /**
   * Lists the themes the product ships stylesheets for, the first being the default.
   */
  themes: readonly string[]
}

/**
 * Builds the schema a boundary holds an appearance to: a theme, a density and a mode the
 * product offers, a locale that is a tag, and a direction that is one of the two.
 *
 * @param {Offered} offered - The offer, as the product states it. A value outside it is
 *     refused.
 * @returns {SchemaOf<Appearance>} The schema. It refuses a theme, a density or a mode outside
 *     the offer with the code `picklist`, and a locale that is no tag with `language_tag`.
 */
export function appearanceSchema(offered: Offered): SchemaOf<Appearance> {
  return object({
    density: picklist([...offered.densities]),
    direction: picklist(['ltr', 'rtl']),
    locale: locale(),
    mode: picklist(['dark', 'light']),
    reducedMotion: boolean(),
    theme: picklist([...offered.themes]),
  })
}

/**
 * Builds the schema for an offer as a deployment document states it: three lists of names.
 *
 * @returns {SchemaOf<Offered>} The schema. Each list is refused with the code `array` when it
 *     is no list, and each entry with `string` when it is no string.
 */
export function offeredSchema(): SchemaOf<Offered> {
  return object({
    densities: array(string()),
    locales: array(locale()),
    themes: array(string()),
  })
}
