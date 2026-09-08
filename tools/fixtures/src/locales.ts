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
 * Maps the keys faker spells in its own way to the tag each stands for. Faker writes a script
 * as a trailing word, `sr_RS_latin`, and a Kurdish variety as a subtag of `ku`; the tag is
 * the ISO code with the script where BCP-47 puts it, so a request for the script reaches it.
 * Kurmanji is `ku` here rather than `kmr`, because CLDR aliases the one to the other and
 * Node's ICU applies the alias where Bun's does not.
 */
const RESPELLED: Readonly<Record<string, string>> = {
  ku_ckb: 'ckb',
  ku_kmr_latin: 'ku-Latn',
  mn_MN_cyrl: 'mn-Cyrl-MN',
  sr_RS_latin: 'sr-Latn-RS',
  uz_UZ_latin: 'uz-Latn-UZ',
}

/**
 * Lists the keys nothing should ask for: the language-independent base every locale sits on,
 * and faker's two joke locales.
 */
const DROPPED: ReadonlySet<string> = new Set(['base', 'en_AU_ocker', 'en_BORK'])

/**
 * Reads the tag a faker key stands for.
 *
 * @param {string} key - The key as faker names it: `nl_BE`.
 * @returns {string | undefined} The canonical tag, or `undefined` for a key nothing should
 *     ask for.
 */
function tagOf(key: string): string | undefined {
  if (DROPPED.has(key)) return undefined
  return canonical(RESPELLED[key] ?? key.replaceAll('_', '-'))
}

/**
 * Maps each locale the sample data ships to its definitions, keyed by canonical tag.
 */
const SHIPPED = new Map(
  Object.entries(allLocales)
    .map(([key, definition]) => [tagOf(key), definition] as const)
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
