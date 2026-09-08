/**
 * @fileoverview Names the token groups a page shows by name, so a page places
 * `<Swatches of="surface" />` and imports nothing from the contract itself.
 */

import {
  CHART_TOKENS,
  CODE_TOKENS,
  type ColorToken,
  EFFECT_TOKENS,
  EMPHASIS_TOKENS,
  GRADIENT_TOKENS,
  OUTLINE_TOKENS,
  SHADOW_TOKENS,
  SIDEBAR_TOKENS,
  STATUS_TOKENS,
  SURFACE_TOKENS,
} from '@stealthscale/core-theme'

/**
 * Maps each group a page may name to the tokens the contract puts in it.
 */
const GROUPS = {
  chart: CHART_TOKENS,
  code: CODE_TOKENS,
  effect: EFFECT_TOKENS,
  emphasis: EMPHASIS_TOKENS,
  gradient: GRADIENT_TOKENS,
  outline: OUTLINE_TOKENS,
  shadow: SHADOW_TOKENS,
  sidebar: SIDEBAR_TOKENS,
  status: STATUS_TOKENS,
  surface: SURFACE_TOKENS,
} as const

/**
 * Names one group of colour tokens, as the contract groups them.
 */
export type TokenGroup = keyof typeof GROUPS

/**
 * Lists the tokens of one group, in the order the contract emits them.
 *
 * @param {TokenGroup} group - The group's name.
 * @returns {readonly ColorToken[]} Its tokens.
 */
export function tokensOf(group: TokenGroup): readonly ColorToken[] {
  return GROUPS[group]
}
