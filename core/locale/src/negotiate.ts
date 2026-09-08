/**
 * @fileoverview Picks the locale to answer in: reads what a request asked for, in the order
 * it asked, and matches it against what a catalogue actually ships. The matcher is ECMA-402's
 * lookup algorithm — truncate the requested tag until it names something available.
 */

import { canonical, chain, type Tag, widened } from './tags.ts'

/**
 * What a catalogue ships, keyed by canonical tag and holding the spelling the catalogue used.
 *
 * Read-only because a match reads it and never adds to it, and named because three functions
 * take one and `ReadonlyMap<Tag, Tag>` says less at each of them.
 */
type Offers = ReadonlyMap<Tag, Tag>

/**
 * One entry of an `Accept-Language` header: a tag and how much the client wants it.
 */
export interface Preference {
  /**
   * How much the client wants this tag, above 0 and up to 1. A header that names no quality
   * means 1, and one that names 0 refuses the tag, which `preferences` drops.
   */
  quality: number

  /**
   * The canonical tag the client asked for.
   */
  tag: Tag
}

/**
 * Reads how much a client wants a tag from the `q` parameter beside it.
 *
 * A parameter that names no number leaves the tag fully wanted. Only a `q` the client
 * actually wrote lowers a tag, so `en;` and `en;q=` mean the same as `en`.
 *
 * @param {string} [parameter] - The text after the tag's semicolon, such as `q=0.8`.
 * @returns {number} The quality between 0 and 1, and 1 where the parameter names none.
 */
function qualityOf(parameter?: string): number {
  const named = parameter?.trim().replace(/^q=/u, '').trim() ?? ''
  if (named === '') return 1
  const value = Number(named)
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : 1
}

/**
 * Reads an `Accept-Language` header into the tags a client asked for, most wanted first.
 *
 * A tag the header writes but no canonical form exists for is dropped rather than carried as
 * a string nothing can match. The wildcard `*` is dropped for the same reason: it names no
 * locale, and a caller that runs out of preferences uses its own default.
 *
 * A tag at `q=0` is dropped as well. RFC 9110 gives that quality the meaning "not
 * acceptable", so the client named the tag to refuse it, and a refusal carried on as a
 * preference is a locale the client asked not to be answered in.
 *
 * @param {string} [header] - The header as it arrived, such as `en-GB,en;q=0.9,nl;q=0.8`.
 *     Left out, or empty, means the client asked for nothing.
 * @returns {Preference[]} The tags the client will accept, highest quality first, and in the
 *     header's own order where two share a quality. Empty when the header names nothing
 *     usable.
 */
export function preferences(header?: string): Preference[] {
  if (header === undefined || header.trim() === '') return []

  return header
    .split(',')
    .map((entry): Preference | undefined => {
      const semicolon = entry.indexOf(';')
      const named = semicolon === -1 ? entry : entry.slice(0, semicolon)
      const parameter = semicolon === -1 ? undefined : entry.slice(semicolon + 1)
      const canonicalised = canonical(named.trim())

      return canonicalised === undefined
        ? undefined
        : { quality: qualityOf(parameter), tag: canonicalised }
    })
    .filter(
      (preference): preference is Preference => preference !== undefined && preference.quality > 0,
    )
    .toSorted((left, right) => right.quality - left.quality)
}

/**
 * Keys what a catalogue ships by its canonical tag, keeping the spelling the catalogue used.
 *
 * The spelling matters because that string is a file name. Where two entries canonicalise the
 * same, the first wins, so a catalogue's own order decides.
 *
 * @param {readonly string[]} available - The tags a catalogue ships.
 * @returns {Map<Tag, Tag>} The canonical tag mapped to the tag as it was written, skipping
 *     anything that is not a tag.
 */
function offers(available: readonly string[]): Map<Tag, Tag> {
  const offered = new Map<Tag, Tag>()

  for (const tag of available) {
    const canonicalised = canonical(tag)
    if (canonicalised !== undefined && !offered.has(canonicalised)) offered.set(canonicalised, tag)
  }

  return offered
}

/**
 * Keys the same offers by their widened form, so a comparison can be made at equal depth.
 *
 * @param {Offers} offered - The offers, as `offers` keyed them.
 * @returns {Map<Tag, Tag>} The widened tag mapped to the tag as the catalogue wrote it.
 */
function widenedOffers(offered: Offers): Map<Tag, Tag> {
  const wide = new Map<Tag, Tag>()

  for (const [canonicalised, written] of offered) {
    const widenedTag = widened(canonicalised)
    if (widenedTag !== undefined && !wide.has(widenedTag)) wide.set(widenedTag, written)
  }

  return wide
}

/**
 * Runs ECMA-402's lookup over the requested tags: the first whose chain names an offer wins.
 *
 * @param {readonly string[]} requested - The tags asked for, most wanted first.
 * @param {Offers} offered - The offers to match against.
 * @param {boolean} widen - Whether to widen each requested tag before walking it, which is
 *     what the second pass does when truncation alone found nothing.
 * @returns {Tag | undefined} The offer as the catalogue wrote it, or `undefined` when none
 *     of the requested tags names one.
 */
function lookup(requested: readonly string[], offered: Offers, widen: boolean): Tag | undefined {
  for (const tag of requested) {
    const start = widen ? widened(tag) : tag
    if (start === undefined) continue

    for (const step of chain(start)) {
      const match = offered.get(step)
      if (match !== undefined) return match
    }
  }

  return undefined
}

/**
 * Picks the first available locale a request would accept.
 *
 * Each requested tag is truncated in turn — `en-GB` then `en` — and the first that names an
 * available locale wins, which is ECMA-402's lookup matcher. Where truncation finds nothing,
 * every tag is widened to its likely script and region and compared again, so `zh` reaches a
 * catalogue that ships `zh-Hans` and `nl-BE` reaches one that ships `nl`.
 *
 * @param {readonly string[]} requested - The tags asked for, most wanted first, as
 *     `preferences` orders them.
 * @param {readonly string[]} available - The tags a catalogue ships.
 * @param {string} fallback - The tag to answer in where nothing matches. It is returned as
 *     given, so a caller that ships it gets back something it can serve.
 * @returns {Tag} The available tag to answer in, or the fallback.
 */
export function negotiate(
  requested: readonly string[],
  available: readonly string[],
  fallback: string,
): Tag {
  const offered = offers(available)

  return (
    lookup(requested, offered, false) ?? lookup(requested, widenedOffers(offered), true) ?? fallback
  )
}
