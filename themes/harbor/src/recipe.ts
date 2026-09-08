/**
 * @fileoverview States what makes Harbor differ from the base theme, and nothing else. Every
 * value it does not name is the base's, so a change to the base reaches this theme without an
 * edit here.
 */

import { extendRecipe, type Recipe } from '@stealthscale/core-theme'
import { recipe as base } from '@stealthscale/theme-base'

/**
 * States a deep teal product, drawn for a hand rather than a pointer.
 *
 * The primary is the brand's own hex. The solver keeps its hue and its saturation and sets
 * its lightness per mode, which is what lets the same teal carry a readable label on paper
 * and on a near-black page.
 */
export const recipe: Recipe = extendRecipe(base, {
  color: {
    // Every fill clears the enhanced level rather than the base's AA, which pins the light
    // primary deeper and gives the dark one a near-black label.
    contrast: 'AAA',

    // A deeper night than the base's, with cards lifted further out of it, because a screen
    // read at arm's length needs its planes further apart.
    dark: { cardLift: 6, page: 11, popoverLift: 9 },

    // Paper rather than white, and a card lifted a point further than the base lifts one.
    light: { cardLift: 4, page: 96, popoverLift: 4 },

    // The greys are tinted towards the sea rather than towards the sky, which is what stops
    // this reading as the base theme with a teal button in it.
    neutral: { chroma: 0.012, hue: 200 },

    // The brand's teal, as the brand writes it.
    primary: '#0f766e',

    // The surfaces carry more than twice the base's tint, so the page itself is visibly
    // marine rather than a grey a reader would have to be told about.
    surface: { chroma: 0.016, hue: 195 },
  },

  // A wide grotesque with squared bowls and a single-storey g. It sets this theme apart from
  // the base's Inter at a glance, and its width holds up at arm's length and behind safety
  // glass. Its monospace sibling carries the same skeleton into code.
  font: {
    mono: {
      family: 'Spline Sans Mono Variable',
      source: '@fontsource-variable/spline-sans-mono/wght.css',
    },
    sans: {
      family: 'Space Grotesk Variable',
      source: '@fontsource-variable/space-grotesk/wght.css',
    },
  },

  size: {
    // A product used on a tablet, so every control clears the enhanced target by default. A
    // page still sets `data-density` to pack a table more tightly.
    density: { default: 'touch' },

    // A softer corner than the base's, which reads as calm rather than precise.
    radius: '1rem',
  },
})
