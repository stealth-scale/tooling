/**
 * @fileoverview Lists the pairs every palette is held to: the words that have to be readable
 * on a surface, the labels that have to be readable on a fill, and the edges a person has to
 * find. The palette specification checks a built theme against these, and a Storybook
 * measures a registered theme against the same lists, so the two cannot disagree about what a
 * theme guarantees.
 */

import { CODE_TOKENS, type TokenName } from '#tokens.ts'

/**
 * Names one colour that has to be read on another: the surface first, then what sits on it.
 */
export type Pair = readonly [on: TokenName, over: TokenName]

/**
 * Lists every text pair, which every theme holds to AAA in both modes: the words on each
 * surface, each ink on the page, each label on its fill, and the syntax colours on `muted`,
 * which is the one surface a code block sits on.
 */
export const TEXT_PAIRS: readonly Pair[] = [
  ...CODE_TOKENS.map((token): Pair => ['muted', token]),
  ['background', 'foreground'],
  ['background', 'muted-foreground'],
  ['background', 'primary-ink'],
  ['background', 'destructive-ink'],
  ['background', 'success-ink'],
  ['background', 'warning-ink'],
  ['background', 'info-ink'],
  ['card', 'card-foreground'],
  ['popover', 'popover-foreground'],
  ['primary', 'primary-foreground'],
  ['secondary', 'secondary-foreground'],
  ['muted', 'muted-foreground'],
  ['accent', 'accent-foreground'],
  ['destructive', 'destructive-foreground'],
  ['success', 'success-foreground'],
  ['warning', 'warning-foreground'],
  ['info', 'info-foreground'],
  ['sidebar', 'sidebar-foreground'],
  ['sidebar-primary', 'sidebar-primary-foreground'],
  ['sidebar-accent', 'sidebar-accent-foreground'],
  ['selection', 'selection-foreground'],
  ['highlight', 'highlight-foreground'],
]

/**
 * Lists the fills a recipe's contrast level applies to: a solid fill and the label on it.
 * Everything else in `TEXT_PAIRS` stays at AAA whatever the recipe asks.
 */
export const FILL_PAIRS: readonly Pair[] = [
  ['primary', 'primary-foreground'],
  ['destructive', 'destructive-foreground'],
  ['success', 'success-foreground'],
  ['warning', 'warning-foreground'],
  ['info', 'info-foreground'],
  ['sidebar-primary', 'sidebar-primary-foreground'],
]

/**
 * Lists the edges a person has to find, each against the surface it is drawn on: a field's
 * outline on a card, and each focus ring on the plane it marks. Every theme holds them to the
 * 3:1 WCAG 1.4.11 asks of a boundary.
 */
export const OUTLINE_PAIRS: readonly Pair[] = [
  ['card', 'input'],
  ['background', 'ring'],
  ['sidebar', 'sidebar-ring'],
]
