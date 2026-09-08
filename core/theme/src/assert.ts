/**
 * @fileoverview Checks that a theme defines every token and that the pairs it promises are
 * readable. The type system already requires the tokens, so this catches what types cannot: a
 * value read from JSON, generated output, a token added to the contract after a theme was
 * written, and a colour a theme stated by hand that no longer clears its floor.
 */

import { contrast } from '#color.ts'
import { FILL_PAIRS, OUTLINE_PAIRS, type Pair, TEXT_PAIRS } from '#guarantees.ts'
import { type ContrastLevel, RATIOS } from '#ladder.ts'
import { MODES, REQUIRED_TOKENS, type ThemeValues, type TokenName } from '#tokens.ts'

/**
 * Lists the tokens a mode's values leave out or leave empty.
 *
 * @param {Readonly<Record<string, string>>} values - One mode's values, by token.
 * @returns {TokenName[]} The missing tokens, in the order they are emitted.
 */
function missingFrom(values: Readonly<Record<string, string>>): TokenName[] {
  return REQUIRED_TOKENS.filter((token) => (values[token] ?? '') === '')
}

/**
 * Returns `true` when the values define every token, and narrows them to the complete
 * record.
 *
 * @param {Readonly<Record<string, string>>} values - One mode's values, by token.
 * @returns {boolean} `true` when no token is missing or empty.
 */
export function isComplete(
  values: Readonly<Record<string, string>>,
): values is Record<TokenName, string> {
  return missingFrom(values).length === 0
}

/**
 * Narrows one mode's values to the complete record, or throws naming what is missing.
 *
 * A builder returns this rather than asserting its own output, so the check that every
 * token came out is the same check a hand-written theme is held to.
 *
 * @param {Readonly<Record<string, string>>} values - One mode's values, by token.
 * @returns {Record<TokenName, string>} The same values, every token present.
 * @throws {Error} When a token is missing or empty. The message names each one.
 */
export function completeTokens(
  values: Readonly<Record<string, string>>,
): Record<TokenName, string> {
  if (isComplete(values)) return values
  const missing = missingFrom(values)
  throw new Error(`Theme is missing ${String(missing.length)} token(s): ${missing.join(', ')}`)
}

/**
 * Throws unless the theme defines every token in both modes.
 *
 * @param {ThemeValues} values - The theme, both modes.
 * @throws {Error} When a token is missing or empty in either mode. The message names each
 *     one as `mode.token`, so the fix is the error message.
 */
export function assertComplete(values: ThemeValues): void {
  const missing = MODES.flatMap((mode) =>
    missingFrom(values[mode]).map((token) => `${mode}.${token}`),
  )
  if (missing.length > 0) {
    throw new Error(`Theme is missing ${String(missing.length)} token(s): ${missing.join(', ')}`)
  }
}

/**
 * Lists the pairs a theme promises, each with the ratio it has to clear.
 *
 * Text on a surface is `AAA` whatever a recipe asked for; a fill and the label on it take the
 * level the recipe asked for; an edge takes the 3:1 WCAG 1.4.11 puts on a boundary.
 *
 * @param {ContrastLevel} level - The level the recipe asked of its fills.
 * @returns {[Pair, number][]} Each pair with its floor.
 */
function promised(level: ContrastLevel): [Pair, number][] {
  const fills = new Set(FILL_PAIRS.map(([on, over]) => `${on} ${over}`))
  const surfaces = TEXT_PAIRS.filter(([on, over]) => !fills.has(`${on} ${over}`))

  return [
    ...surfaces.map((pair): [Pair, number] => [pair, RATIOS.AAA]),
    ...FILL_PAIRS.map((pair): [Pair, number] => [pair, RATIOS[level]]),
    ...OUTLINE_PAIRS.map((pair): [Pair, number] => [pair, RATIOS.UI]),
  ]
}

/**
 * Throws unless every pair the theme promises clears its floor, in both modes.
 *
 * The builder solves for these, so a solved palette passes by construction. It is a theme
 * stating a colour of its own that this catches: a brand hue pinned by hand takes the label on
 * it with it, and the build refuses rather than shipping a button nobody can read.
 *
 * @param {ThemeValues} values - The theme, both modes.
 * @param {ContrastLevel} level - The level the recipe asked of its fills.
 * @throws {Error} When a pair falls short. The message names each one as
 *     `mode.over on under`, with the ratio measured and the ratio required.
 */
export function assertReadable(values: ThemeValues, level: ContrastLevel): void {
  const short = MODES.flatMap((mode) =>
    promised(level)
      .map(([[on, over], floor]): [string, number, number] => [
        `${mode}.${over} on ${on}`,
        contrast(values[mode][over], values[mode][on]),
        floor,
      ])
      .filter(([, ratio, floor]) => ratio < floor)
      .map(([where, ratio, floor]) => `${where} is ${ratio.toFixed(2)}:1, needs ${floor}:1`),
  )

  if (short.length > 0) {
    throw new Error(`Theme fails ${String(short.length)} guarantee(s): ${short.join('; ')}`)
  }
}
