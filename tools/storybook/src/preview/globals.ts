/**
 * @fileoverview Builds the six toolbars Storybook draws with, from what the workspace
 * offers, and the values they start on. A toolbar that would list one thing is left out, so a
 * repository with one theme carries no theme picker and a repository with one language
 * carries no language picker.
 */

import { type GlobalTypes } from 'storybook/internal/types'

import { appearanceFor, machine, type Offered } from '@stealthscale/core-appearance'

import { MOTION, type Themes } from './appearance.ts'

/**
 * Names the icons Storybook can draw beside a toolbar.
 */
type Icon = NonNullable<NonNullable<GlobalTypes[string]['toolbar']>['icon']>

/**
 * Describes one entry of a toolbar's list.
 */
export interface Item {
  /**
   * Carries the name a person reads in the list.
   */
  title: string

  /**
   * Carries the value the toolbar sets.
   */
  value: string
}

/**
 * Lists the two modes every theme ships.
 */
const MODES: readonly Item[] = [
  { title: 'Light', value: 'light' },
  { title: 'Dark', value: 'dark' },
]

/**
 * Lists the two directions text runs in.
 */
const DIRECTIONS: readonly Item[] = [
  { title: 'Left to right', value: 'ltr' },
  { title: 'Right to left', value: 'rtl' },
]

/**
 * Lists what the motion toolbar offers.
 */
const MOTIONS: readonly Item[] = [
  { title: 'Full motion', value: MOTION.full },
  { title: 'Reduced motion', value: MOTION.reduced },
]

/**
 * Writes a name as a reader reads it, for a list built from directory names.
 *
 * @param {string} name - The value a document carries: `comfortable`, `compact`.
 * @returns {string} The same name with its first letter capitalised.
 */
function labelled(name: string): string {
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`
}

/**
 * Describes one toolbar to build.
 */
interface Wanted {
  /**
   * Names the global the toolbar writes, which is a member of an appearance.
   */
  global: string

  /**
   * Names the icon Storybook draws.
   */
  icon: Icon

  /**
   * Lists what the toolbar offers.
   */
  items: readonly Item[]

  /**
   * Carries the label beside the icon.
   */
  title: string
}

/**
 * Builds one toolbar, or nothing where it would offer a single choice.
 *
 * @param {Wanted} wanted - The toolbar to build. `Wanted` documents every member.
 * @returns {GlobalTypes} The toolbar keyed by its global, or nothing to add.
 */
function toolbar({ global, icon, items, title }: Wanted): GlobalTypes {
  if (items.length < 2) return {}
  return { [global]: { toolbar: { dynamicTitle: true, icon, items: [...items], title } } }
}

/**
 * Builds every toolbar the workspace has something to offer in.
 *
 * @param {Offered} offered - The offer the workspace registered.
 * @param {Themes} themes - Every theme, for the name a person reads in the list.
 * @returns {GlobalTypes} The toolbars, keyed by the global each writes.
 */
export function toolbarsFor(offered: Offered, themes: Themes): GlobalTypes {
  return {
    ...toolbar({
      global: 'theme',
      icon: 'paintbrush',
      items: offered.themes.map((name) => ({
        title: themes[name]?.title ?? labelled(name),
        value: name,
      })),
      title: 'Theme',
    }),
    ...toolbar({ global: 'mode', icon: 'contrast', items: MODES, title: 'Mode' }),
    ...toolbar({
      global: 'locale',
      icon: 'globe',
      items: offered.locales.map((tag) => ({ title: tag, value: tag })),
      title: 'Locale',
    }),
    ...toolbar({ global: 'direction', icon: 'transfer', items: DIRECTIONS, title: 'Direction' }),
    ...toolbar({
      global: 'density',
      icon: 'grow',
      items: offered.densities.map((name) => ({ title: labelled(name), value: name })),
      title: 'Density',
    }),
    ...toolbar({ global: 'reducedMotion', icon: 'lightning', items: MOTIONS, title: 'Motion' }),
  }
}

/**
 * Sets the value every toolbar starts on: where the machine and the offer settle.
 *
 * @param {Offered} offered - The offer the workspace registered.
 * @returns {Record<string, string>} One value per global, whether or not its toolbar is drawn.
 */
export function initialGlobalsFor(offered: Offered): Record<string, string> {
  const starting = appearanceFor(offered, machine())

  return {
    density: starting.density,
    direction: starting.direction,
    locale: starting.locale,
    mode: starting.mode,
    reducedMotion: starting.reducedMotion ? MOTION.reduced : MOTION.full,
    theme: starting.theme,
  }
}
