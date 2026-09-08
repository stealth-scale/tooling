/**
 * @fileoverview Turns what the workspace registered and what the toolbars say into what a
 * document is drawn from: every theme solved from its recipe, the stylesheet that carries
 * them, and the appearance the six toolbars describe. The preview holds no appearance state
 * of its own: the toolbars are the only writer, and `core-appearance` decides what each one
 * means, so a story sees exactly what a host would put on the document.
 */

import {
  type Appearance,
  appearanceFor,
  machine,
  type Offered,
} from '@stealthscale/core-appearance'
import { safeParse } from '@stealthscale/core-schema'
import { buildPalette, emitScoped, recipeSchema, type ThemeValues } from '@stealthscale/core-theme'

/**
 * Names the two values the motion toolbar writes. A toolbar carries strings, and an
 * appearance carries a boolean, so the two are named here and read in one place.
 */
export const MOTION = { full: 'full', reduced: 'reduced' } as const

/**
 * Names the element the theme stylesheet is written into, so it is written once.
 */
const STYLE_ID = 'stealth-themes'

/**
 * Describes one theme as the workspace registered it, before it is solved.
 */
export interface RegisteredTheme {
  /**
   * Carries the recipe module's default export, as written. It is held to the recipe schema
   * before a palette is built from it.
   */
  recipe: unknown

  /**
   * Carries the name a person picks the theme by.
   */
  title: string
}

/**
 * Names every theme a workspace registered, keyed by the value a document writes.
 */
export type RegisteredThemes = Readonly<Record<string, RegisteredTheme>>

/**
 * Describes one theme the preview can draw with.
 */
export interface Theme {
  /**
   * Carries the name a person picks it by.
   */
  title: string

  /**
   * Carries every token in both modes, solved from the theme's recipe.
   */
  values: ThemeValues
}

/**
 * Names every theme a workspace registered, solved, keyed by the value a document writes.
 */
export type Themes = Readonly<Record<string, Theme>>

/**
 * Describes the document the theme stylesheet is written into, in the members it uses.
 */
export interface Sheets {
  /**
   * Creates the element the themes are written into.
   */
  createElement: (tag: 'style') => HTMLStyleElement

  /**
   * Holds where the stylesheet goes.
   */
  head: HTMLHeadElement

  /**
   * Finds the stylesheet, when it has been written already.
   */
  querySelector: (selector: string) => unknown
}

/**
 * Solves every registered theme from its recipe.
 *
 * A recipe is TypeScript in the theme's own package and only the bundler evaluates it, so it
 * arrives here as whatever the module exported. It is held to the recipe schema first, so a
 * theme that cannot be drawn fails at boot naming the theme and the field, instead of
 * drawing something odd.
 *
 * @param {RegisteredThemes} registered - Every theme the workspace registered.
 * @returns {Themes} Every theme, solved.
 * @throws {Error} When a recipe fails its schema. The message names the theme and every
 *     field at fault.
 */
export function solveThemes(registered: RegisteredThemes): Themes {
  return Object.fromEntries(
    Object.entries(registered).map(([name, { recipe, title }]) => {
      const read = safeParse(recipeSchema(), recipe)
      if (!read.ok) {
        const reasons = read.failure.map((issue) => `${issue.path}: ${issue.reason}`)
        throw new Error(
          `Theme ${name} registers a recipe no palette builds from: ${reasons.join('; ')}`,
        )
      }
      return [name, { title, values: buildPalette(read.value) }]
    }),
  )
}

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

/**
 * Writes every theme's tokens as one stylesheet, each scoped to the value a document carries.
 *
 * Every theme is written rather than only the one on, so switching a toolbar changes an
 * attribute rather than reloading a stylesheet, and a docs page showing two themes at once
 * has both.
 *
 * @param {Themes} themes - Every theme the workspace registered.
 * @returns {string} The stylesheet. It is empty where the workspace registered no theme.
 */
export function themeStylesheet(themes: Themes): string {
  return Object.entries(themes)
    .map(([name, theme]) => emitScoped(theme.values, name))
    .join('\n')
}

/**
 * Writes every theme's tokens into the document, once.
 *
 * @param {Themes} themes - The themes the workspace registered.
 * @param {Sheets} into - The document being drawn into.
 */
export function writeThemes(themes: Themes, into: Sheets): void {
  if (into.querySelector(`#${STYLE_ID}`) !== null) return

  const style = into.createElement('style')
  style.id = STYLE_ID
  style.textContent = themeStylesheet(themes)
  into.head.append(style)
}
