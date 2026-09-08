/**
 * @fileoverview Picks the sample data a locale is drawn from. A caller names a BCP-47 tag,
 * the same vocabulary the rest of the workspace uses, and gets the nearest locale the sample
 * data actually ships.
 */

import { allLocales, base, en, type LocaleDefinition } from '@faker-js/faker'

import { canonical, negotiate } from '@stealthscale/core-locale'

/**
 * Names the locale a caller gets without asking for one.
 */
export const DEFAULT_LOCALE = 'en'

/**
 * Maps each locale the sample data ships to its definitions.
 *
 * The keys are written with an underscore, `nl_BE`, so they are restated as tags here. A key
 * that is no tag at all, such as the joke locale `en_BORK`, drops out: nothing can ask for it
 * and nothing should.
 */
const SHIPPED = new Map(
  Object.entries(allLocales)
    .map(([key, definition]) => [canonical(key.replaceAll('_', '-')), definition] as const)
    .filter((entry): entry is [string, LocaleDefinition] => entry[0] !== undefined),
)

/**
 * Lists every locale the sample data ships, as BCP-47 tags, sorted.
 *
 * A story that renders in each of them reads this rather than restating the list.
 */
export const LOCALES: readonly string[] = [...SHIPPED.keys()].toSorted()

/**
 * Finds the locale the sample data ships that is nearest the one asked for.
 *
 * The match is ECMA-402's lookup, so `nl-NL` reaches `nl` and `zh-Hans` reaches `zh-CN`. A
 * tag nothing answers falls back to {@link DEFAULT_LOCALE} rather than throwing, because a
 * fixture that refuses to build fails a specification about something else.
 *
 * @param {string} tag - The locale asked for, as a BCP-47 tag.
 * @returns {string} The nearest locale the sample data ships.
 */
export function nearestLocale(tag: string): string {
  return negotiate([tag], LOCALES, DEFAULT_LOCALE)
}

/**
 * Collects the definitions a locale is drawn from, nearest first.
 *
 * English and the language-independent base sit under every locale, so a field the locale
 * does not define is filled in rather than throwing.
 *
 * @param {string} tag - The locale asked for, as a BCP-47 tag.
 * @returns {LocaleDefinition[]} The definitions, the nearest match first.
 */
export function definitionsFor(tag: string): LocaleDefinition[] {
  const nearest = SHIPPED.get(nearestLocale(tag))

  return nearest === undefined || nearest === en ? [en, base] : [nearest, en, base]
}
