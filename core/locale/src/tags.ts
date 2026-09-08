/**
 * @fileoverview Reads a BCP-47 language tag with the engine's own ECMA-402 implementation:
 * canonicalising it, taking it apart, walking it from most specific to least, and reading
 * the direction its text runs in. `Intl` carries the locale data, including the likely
 * subtags a `zh` to `zh-Hans-CN` widening needs; the one table here is the right-to-left
 * scripts, for the reason `directionOf` gives.
 */

/**
 * Names a canonical BCP-47 language tag: `nl`, `en-GB`, `zh-Hant-TW`.
 *
 * It is a string rather than a class so a tag can be a catalogue key, a URL segment and a
 * `lang` attribute without unwrapping.
 */
export type Tag = string

/**
 * Describes the parts of a tag a caller reaches for.
 */
export interface Parts {
  /**
   * Names the primary language: `nl`, `en`, `zh`.
   */
  language: string

  /**
   * Names the region, where the tag names one: `GB`, `TW`.
   */
  region: string | undefined

  /**
   * Names the script, where the tag names one: `Hant`.
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

/**
 * Names the direction a script's text runs in.
 */
export type Direction = 'ltr' | 'rtl'

/**
 * Lists the scripts written right to left that a living language widens to, as CLDR's
 * script metadata marks them. The engines answer `getTextInfo` differently, Bun's ICU calling
 * Thaana and Hanifi Rohingya left to right, while every engine agrees on the likely script,
 * so the script decides.
 */
const RIGHT_TO_LEFT: ReadonlySet<string> = new Set([
  'Adlm',
  'Arab',
  'Aran',
  'Hebr',
  'Mand',
  'Nkoo',
  'Rohg',
  'Samr',
  'Syrc',
  'Thaa',
  'Yezi',
])

/**
 * Reads the direction a tag's text runs in, from the script the tag names or the one the
 * engine considers likely for its language.
 *
 * @param {string} tag - The tag to read.
 * @returns {Direction} `rtl` for `ar`, `he`, `fa`, `ur` and `dv`. `ltr` for every other
 *     script, for `ar-Latn`, and for a string that is not a tag at all.
 */
export function directionOf(tag: string): Direction {
  try {
    const script = new Intl.Locale(tag).maximize().script
    return script !== undefined && RIGHT_TO_LEFT.has(script) ? 'rtl' : 'ltr'
  } catch {
    return 'ltr'
  }
}

/**
 * Widens a tag and walks the result, which is the depth a lookup compares two tags at.
 *
 * A tag and an offer that widen to different regions still share their script, so both sides
 * of a lookup walk this rather than compare their widened tags whole.
 *
 * @param {string} tag - The tag to widen and walk.
 * @returns {Tag[]} The widened tag and each shorter form, most specific first, empty when the
 *     tag is not a tag at all. `zh-HK` gives `zh-Hant-HK`, `zh-Hant`, `zh`.
 */
export function widenedChain(tag: string): Tag[] {
  const wide = widened(tag)
  return wide === undefined ? [] : chain(wide)
}
