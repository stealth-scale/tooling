/**
 * @fileoverview Reads a BCP-47 language tag with the engine's own ECMA-402 implementation:
 * canonicalising it, taking it apart, and walking it from most specific to least. Nothing
 * here carries locale data — `Intl` already has it, including the likely subtags a
 * `zh` to `zh-Hans-CN` widening needs.
 */

/**
 * A BCP-47 language tag, canonical: `nl`, `en-GB`, `zh-Hant-TW`.
 *
 * It is a string rather than a class so a tag can be a catalogue key, a URL segment and a
 * `lang` attribute without unwrapping.
 */
export type Tag = string

/**
 * The parts of a tag a caller reaches for.
 */
export interface Parts {
  /**
   * The primary language: `nl`, `en`, `zh`.
   */
  language: string

  /**
   * The region, where the tag names one: `GB`, `TW`.
   */
  region: string | undefined

  /**
   * The script, where the tag names one: `Hant`.
   */
  script: string | undefined
}

/**
 * Canonicalises a tag, correcting the case of each subtag as BCP-47 writes it.
 *
 * @param {string} tag - The tag as it arrived, from a header, a URL or a manifest.
 * @returns {Tag | undefined} The canonical tag, or `undefined` when it is not a tag at all.
 */
export function canonical(tag: string): Tag | undefined {
  try {
    return Intl.getCanonicalLocales(tag)[0]
  } catch {
    return undefined
  }
}

/**
 * Takes a tag apart into the language, script and region.
 *
 * @param {string} tag - The tag to read.
 * @returns {Parts | undefined} The parts, or `undefined` when the tag is not a tag at all.
 */
export function parts(tag: string): Parts | undefined {
  try {
    const locale = new Intl.Locale(tag)
    return { language: locale.language, region: locale.region, script: locale.script }
  } catch {
    return undefined
  }
}

/**
 * Widens a tag to the script and region the engine considers likely, so two tags written at
 * different depths can be compared: `zh` becomes `zh-Hans-CN`.
 *
 * @param {string} tag - The tag to widen.
 * @returns {Tag | undefined} The widened tag, or `undefined` when the tag is not a tag at all.
 */
export function widened(tag: string): Tag | undefined {
  try {
    return new Intl.Locale(tag).maximize().toString()
  } catch {
    return undefined
  }
}

/**
 * Walks a tag from most specific to least, which is the order a catalogue chain resolves in
 * and the order ECMA-402's lookup matcher truncates in.
 *
 * A single-character subtag starts an extension (`-u-`, `-x-`), and everything from there on
 * is dropped rather than walked, as the lookup algorithm requires.
 *
 * @param {string} tag - The tag to walk.
 * @returns {Tag[]} The tag and each shorter form, most specific first, empty when the tag is
 *     not a tag at all. `zh-Hant-TW` gives `zh-Hant-TW`, `zh-Hant`, `zh`.
 */
export function chain(tag: string): Tag[] {
  const start = canonical(tag)
  if (start === undefined) return []

  const subtags = start.split('-')
  const extension = subtags.findIndex((subtag, index) => index > 0 && subtag.length === 1)
  const named = extension === -1 ? subtags : subtags.slice(0, extension)
  const walked: Tag[] = []

  for (let depth = named.length; depth > 0; depth -= 1) {
    walked.push(named.slice(0, depth).join('-'))
  }

  return walked
}
