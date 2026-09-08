/**
 * @fileoverview States what makes the base theme itself. Everything else about it, every token
 * in both modes, is solved from these few numbers, so a hue moved here moves the whole palette
 * and keeps the contrast guarantees intact.
 *
 * Every member a recipe accepts is written out, including the ones that would take the same
 * value by default, because this is the theme another theme is written by. A reader sees the
 * whole surface in one file and changes a number rather than discovering that a field exists.
 * A theme of its own writes only what makes it different: `PaletteRecipe` documents each
 * default, and leaving a member out is how a theme says it wants that default to move if the
 * contract ever moves it.
 */

import { type PaletteRecipe } from '@stealthscale/core-theme'

/**
 * States the neutral theme: a blue primary on cool, almost-white greys.
 *
 * It is the reference the others are read against, so its surfaces carry the least tint of any
 * theme. A product with no brand of its own gets this one.
 */
export const recipe: PaletteRecipe = {
  // The hue of the accent surface, which a hover and a selected row take. A neighbour of the
  // primary rather than the primary itself: an accent that matches exactly reads as a second
  // button rather than as the same button under a pointer.
  accent: 232,

  // The five series hues, in the order a chart assigns them. They are spread around the wheel
  // rather than stepped along it, because a reader tells two series apart by hue and a ramp of
  // one hue reads as a quantity.
  chart: [258, 190, 300, 45, 12],

  // Livelier than the contract's 0.17, and AA on the fills: a saturated primary carries white
  // text in both modes, rather than a deep blue in light and a pastel with black text in dark.
  // Text on a surface stays AAA whatever this says.
  chroma: 0.19,

  // What a fill has to clear against the label on it. AAA would pin the light primary near 45
  // and make the dark one a pastel with near-black text.
  contrast: 'AA',

  // The families. These are the contract's own defaults, written out because a theme picking
  // its own replaces both: a text family without a monospace to match is half a decision.
  fonts: {
    mono: "'JetBrains Mono Variable', ui-monospace, monospace",
    sans: "'Inter Variable', ui-sans-serif, system-ui, sans-serif",
  },

  // The lightness of the dark page, which is the dark ladder's own. Lower than this and the
  // surfaces above it run out of room to separate.
  ink: 13,

  // The hue the greys are tinted with. Cool, so the neutrals sit under a blue primary without
  // reading as a second colour.
  neutral: 262,

  // How much the greys are tinted. At 0.008 a border is a grey a reader would call grey, with
  // just enough hue that it belongs to the page rather than to the browser.
  neutralChroma: 0.008,

  // The lightness of the light page, which is the light ladder's own. Pinned at 99 this theme
  // was white on white, and nothing a reader could see told a card from the page under it.
  paper: 97,

  // The hue of the primary action.
  primary: 258,

  // 10px rather than 8. A control at `rounded-lg` reads as soft, and a card at `rounded-2xl`
  // reads as softer still, which is what makes the card look like it contains the control.
  radius: '0.625rem',

  // The outcome hues, which are the contract's own: red, green, amber and blue. A theme states
  // them rather than inheriting them so that changing one is an edit here and not a discovery
  // that the field exists. A warning that changes colour with the brand is a warning nobody
  // learns to read, so a brand replaces these only when its own palette carries them.
  status: { destructive: 27, info: 235, success: 150, warning: 85 },

  // How much the surfaces are tinted, which is less than the borders rather than the 2.5 times
  // more the default gives. This theme is the neutral one: its page, cards and popovers are as
  // close to grey as the system goes, and every other theme is read against them.
  surfaceChroma: 0.006,

  // The hue of the surfaces, which is the greys' here. A theme wanting a cream page under sage
  // hairlines sets this away from `neutral`, which is the one case the two differ.
  surfaceHue: 262,
}
