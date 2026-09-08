/**
 * @fileoverview Turns what the toolbars say into what a document is drawn from. The preview
 * holds no appearance state of its own: the toolbars are the only writer, and
 * `core-appearance` decides what each one means, so a story sees exactly what a host would
 * put on the document.
 *
 * Nothing here solves a palette. A theme solves its own in its own build and this reads the
 * table, so the browser carries no solver and every consumer of a theme reads what that
 * theme shipped.
 */

import {
  type Appearance,
  appearanceFor,
  machine,
  type Offered,
} from '@stealthscale/core-appearance'
import { type Tables, type ThemeValues } from '@stealthscale/core-theme'

/**
 * Names the two values the motion toolbar writes. A toolbar carries strings, and an
 * appearance carries a boolean, so the two are named here and read in one place.
 */
export const MOTION = { full: 'full', reduced: 'reduced' } as const

/**
 * Describes one theme the preview can draw with, as its package shipped it.
 */
export interface Theme {
  /**
   * Carries every scale the theme states: its type sizes, its shadows, its timing and its
   * densities. A page draws what the theme says rather than what the contract defaults to.
   */
  tables: Tables

  /**
   * Carries the name a person picks it by.
   */
  title: string

  /**
   * Carries every token in both modes, solved when the theme was built.
   */
  values: ThemeValues
}

/**
 * Names every theme a workspace registered, keyed by the value a document writes.
 */
export type Themes = Readonly<Record<string, Theme>>

/**
 * Reads one toolbar's value, ignoring anything that is not a string.
 *
 * @param {Readonly<Record<string, unknown>>} globals - The values the toolbars are on.
 * @param {string} name - The toolbar to read.
 * @returns {string | undefined} The value, or nothing where the toolbar says nothing.
 */
function chosen(globals: Readonly<Record<string, unknown>>, name: string): string | undefined {
  const value = globals[name]
  return typeof value === 'string' && value !== '' ? value : undefined
}

/**
 * Builds the appearance the toolbars describe.
 *
 * Anything a toolbar does not say takes the value the machine and the offer settle on, which
 * is what a person sees before touching anything: their own colour scheme, their own
 * language, and the first theme and density the workspace offers.
 *
 * @param {Readonly<Record<string, unknown>>} globals - The values the toolbars are on.
 * @param {Offered} offered - The offer the workspace registered.
 * @returns {Appearance} The appearance, with every value inside the offer.
 */
export function appearanceFrom(
  globals: Readonly<Record<string, unknown>>,
  offered: Offered,
): Appearance {
  const overrides: Partial<Appearance> = {}
  const theme = chosen(globals, 'theme')
  const locale = chosen(globals, 'locale')
  const density = chosen(globals, 'density')
  const direction = chosen(globals, 'direction')
  const motion = chosen(globals, 'reducedMotion')

  if (theme !== undefined) overrides.theme = theme
  if (locale !== undefined) overrides.locale = locale
  if (density !== undefined) overrides.density = density
  if (direction === 'ltr' || direction === 'rtl') overrides.direction = direction
  if (globals['mode'] === 'dark' || globals['mode'] === 'light') overrides.mode = globals['mode']
  if (motion === MOTION.full || motion === MOTION.reduced) {
    overrides.reducedMotion = motion === MOTION.reduced
  }

  return appearanceFor(offered, machine(), overrides)
}
