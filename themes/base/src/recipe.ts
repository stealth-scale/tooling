/**
 * @fileoverview States what makes the base theme itself. Everything else about it, every token
 * in both modes and every scale a utility resolves, is derived from these few values, so a
 * number moved here moves the whole theme and keeps the contrast guarantees intact.
 *
 * Every member that changes what a reader sees is written out, including the ones that would
 * take the same value by default, because this is the theme another theme is written by: a
 * reader sees the surface in one file and edits a number rather than discovering that a field
 * exists. The members that open a table underneath, such as `color.light` or `effect.shadow`,
 * are documented on `Recipe` and left out here, since the contract's own tables are what this
 * theme wants. A theme of its own writes only what makes it different, over `recipe`.
 */

import { type Recipe } from '@stealthscale/core-theme'

/**
 * States the neutral theme: a blue primary on cool, almost-white greys.
 *
 * It is the reference the others are read against, so its surfaces carry the least tint of any
 * theme. A product with no brand of its own gets this one.
 */
export const recipe: Recipe = {
  color: {
    // The accent surface, which a hover and a selected row take. A neighbour of the primary
    // rather than the primary itself: an accent that matches exactly reads as a second button
    // rather than as the same button under a pointer. It carries four times the greys' tint,
    // because a surface needs far more of it than a border to read as coloured at all.
    accent: { chroma: 0.032, hue: 232 },

    // The five series hues, in the order a chart assigns them. They are spread around the
    // wheel rather than stepped along it, because a reader tells two series apart by hue and a
    // ramp of one hue reads as a quantity.
    chart: [258, 190, 300, 45, 12],

    // What a fill has to clear against the label on it. AAA would pin the light primary near
    // 45 and make the dark one a pastel with near-black text. Text on a surface stays AAA
    // whatever this says.
    contrast: 'AA',

    // The lightness of the dark page, which is the dark ladder's own. Lower than this and the
    // surfaces above it run out of room to separate.
    dark: { page: 13 },

    // The lightness of the light page, which is the light ladder's own. Pinned at 99 this
    // theme was white on white, and nothing a reader could see told a card from the page.
    light: { page: 97 },

    // The greys. Cool, so they sit under a blue primary without reading as a second colour,
    // and tinted just enough at 0.008 that a border belongs to the page rather than to the
    // browser.
    neutral: { chroma: 0.008, hue: 262 },

    // The primary action, livelier than the 0.17 a tone takes by default: a saturated primary
    // carries white text in both modes, rather than a deep blue in light and a pastel with
    // near-black text in dark.
    primary: { chroma: 0.19, hue: 258 },

    // The outcome hues, which are the contract's own: red, green, amber and blue. They are
    // written out rather than inherited so that changing one is an edit here and not a
    // discovery that the field exists. A warning that changes colour with the brand is a
    // warning nobody learns to read, so a brand replaces these only when its palette carries
    // its own.
    status: { destructive: 27, info: 235, success: 150, warning: 85 },

    // The page, the cards and the popovers, tinted less than the borders rather than more.
    // This is the neutral theme: its surfaces are as close to grey as the system goes, and
    // every other theme is read against them.
    surface: { chroma: 0.006, hue: 262 },
  },

  // How much of the theme's shadow ink each layer takes. 1 is the contract's own weight; a
  // flatter product states less and a product built on floating cards states more.
  effect: { depth: 1 },

  // The two families, and the packages that carry their files. A theme naming its own replaces
  // both, because a text family without a monospace to match is half a decision, and it
  // depends on whatever packages its own sources come from.
  font: {
    mono: {
      family: 'JetBrains Mono Variable',
      source: '@fontsource-variable/jetbrains-mono/wght.css',
    },
    sans: { family: 'Inter Variable', source: '@fontsource-variable/inter/wght.css' },
  },

  motion: {
    // How far a pressed control shrinks. Far enough to answer the press, near enough that the
    // label does not visibly reflow.
    press: 0.98,

    // How fast every animation runs against the contract's own timing. Below 1 is snappier and
    // above it is calmer; the whole vocabulary moves together, so nothing falls out of step.
    speed: 1,
  },

  size: {
    // The density a page takes where nothing sets one, out of the three the contract names.
    density: { default: 'comfortable' },

    // How wide the focus ring is, in every density. Two pixels is the perimeter the enhanced
    // focus appearance criterion asks for.
    focus: { width: 2 },

    // 10px rather than 8. A control at `rounded-lg` reads as soft, and a card at
    // `rounded-2xl` reads as softer still, which is what makes the card look like it contains
    // the control.
    radius: '0.625rem',

    // The one length every gap, padding and gutter derives from, which is Tailwind's own.
    spacing: '0.25rem',

    // The size of body text, which the whole type scale follows. A product that reads denser
    // states `15px` here and every step moves with it.
    text: { base: '1rem' },
  },
}
