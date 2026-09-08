/**
 * @fileoverview Checks that a theme defines every token. The type system already requires
 * them, so this catches what types cannot: a value read from JSON, generated output, or a
 * token added to the contract after a theme was written.
 */

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
