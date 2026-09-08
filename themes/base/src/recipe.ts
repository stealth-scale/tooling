/**
 * @fileoverview States what makes the base theme itself. Everything else about it, every
 * token in both modes, is solved from these few numbers, so a hue moved here moves the whole
 * palette and keeps the contrast guarantees intact.
 */

import { type PaletteRecipe } from '@stealthscale/core-theme'

/**
 * States the neutral theme: a blue primary on cool, almost-white greys.
 *
 * It is the reference the others are read against, so its surfaces carry the least tint of
 * any theme. A product with no brand of its own gets this one.
 */
export const recipe: PaletteRecipe = {
  accent: 232,
  chart: [258, 190, 300, 45, 12],

  // Livelier than the contract's 0.17, and AA on the fills: a saturated primary carries white
  // text in both modes, rather than a deep blue in light and a pastel with black text in
  // dark. Text on a surface stays AAA whatever this says.
  chroma: 0.19,
  contrast: 'AA',

  ink: 13,
  neutral: 262,
  neutralChroma: 0.008,

  // No `paper`, so the page takes the ladder's own shade of grey under white cards. Pinned at
  // 99 this theme was white on white, and nothing a reader could see told it apart from the
  // next one.
  primary: 258,

  // 10px rather than 8. A control at `rounded-lg` reads as soft, and a card at `rounded-2xl`
  // reads as softer still, which is what makes the card look like it contains the control.
  radius: '0.625rem',

  surfaceChroma: 0.006,
}
