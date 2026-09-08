/**
 * @fileoverview Builds the appearance a person starts with: what the machine says, negotiated
 * against what the product offers, with a stored setting or a scene's own choice on top.
 */

import { directionOf, negotiate } from '@stealthscale/core-locale'

import { type Appearance, type Offered } from './appearance.ts'

/**
 * Describes what a person's machine says about how it wants to be drawn for.
 */
export interface Machine {
  /**
   * Lists the languages the person accepts, most wanted first, as the browser reports them.
   * Empty on a server.
   */
  languages: readonly string[]

  /**
   * Marks that the machine asks for a dark colour scheme.
   */
  prefersDark: boolean

  /**
   * Marks that the machine asks for reduced motion.
   */
  prefersReducedMotion: boolean
}

/**
 * Describes a media query's answer, as `window.matchMedia` gives it.
 */
export interface MediaQueryAnswer {
  /**
   * Marks that the query matches.
   */
  matches: boolean
}

/**
 * Describes what `window.navigator` says about the person's languages.
 */
export interface Languages {
  /**
   * Lists the languages the person accepts, most wanted first.
   */
  languages?: readonly string[]
}

/**
 * Describes where `machine` reads from: the window in a browser, and nothing on a server.
 */
export interface MachineSource {
  /**
   * Evaluates a media query, as `window.matchMedia` does.
   */
  matchMedia?: (query: string) => MediaQueryAnswer

  /**
   * Carries the languages the person accepts, as `window.navigator` does.
   */
  navigator?: Languages
}

/**
 * Names the locale a product answers in when it offers none and the machine names none.
 */
const FALLBACK_LOCALE = 'en'

/**
 * Reads what the machine says: its colour scheme, its motion preference and its languages.
 *
 * @param {MachineSource} [source] - Where to read from. Default: the global object, which is
 *     the window in a browser and says nothing on a server.
 * @returns {Machine} The machine's answers. A source that cannot answer a query answers
 *     `false` to it and lists no languages.
 */
export function machine(source: MachineSource = globalThis): Machine {
  /**
   * Evaluates one media query against the source.
   *
   * @param {string} query - The media query.
   * @returns {boolean} `true` when it matches, and `false` when the source cannot answer.
   */
  const matches = (query: string): boolean => source.matchMedia?.(query).matches ?? false

  return {
    languages: source.navigator?.languages ?? [],
    prefersDark: matches('(prefers-color-scheme: dark)'),
    prefersReducedMotion: matches('(prefers-reduced-motion: reduce)'),
  }
}

/**
 * Builds the appearance a person starts with.
 *
 * The locale is negotiated from the machine's languages against what the product offers, so
 * it is always one the product ships words for; the direction follows that locale's script;
 * the mode and the motion follow the machine; the theme and the density are the first the
 * product offers. Anything stated in `overrides` wins over all of that, which is how a stored
 * setting and a scene's own choice reach the document.
 *
 * @param {Offered} offered - The offer, as the product states it.
 * @param {Machine} from - The machine's answers, as `machine` read them.
 * @param {Partial<Appearance>} [overrides] - The values a caller states, which win over the
 *     machine and the offer. Default: none.
 * @returns {Appearance} The appearance. A product that offers no theme or no density gets an
 *     empty name there, which `appearanceSchema` then refuses.
 */
export function appearanceFor(
  offered: Offered,
  from: Machine,
  overrides: Partial<Appearance> = {},
): Appearance {
  const locale = negotiate(from.languages, offered.locales, offered.locales[0] ?? FALLBACK_LOCALE)
  const defaults: Appearance = {
    density: offered.densities[0] ?? '',
    direction: directionOf(overrides.locale ?? locale),
    locale,
    mode: from.prefersDark ? 'dark' : 'light',
    reducedMotion: from.prefersReducedMotion,
    theme: offered.themes[0] ?? '',
  }

  return { ...defaults, ...overrides }
}
