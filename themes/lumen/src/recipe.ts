/**
 * @fileoverview States what makes Lumen differ from the base theme, and nothing else. Every
 * value it does not name is the base's, so a change to the base reaches this theme without an
 * edit here.
 */

import { extendRecipe, type Recipe } from '@stealthscale/core-theme'
import { recipe as base } from '@stealthscale/theme-base'

/**
 * States an editorial product: a violet brand, a face of its own for headings, larger body
 * text and a heavier hand with elevation.
 *
 * Its primary is stated twice, and the two mean different things. `color.primary` is the
 * brand as a tone, which the solver moves in lightness so every derived token follows it.
 * `color.stated` pins the fill itself, because this brand's violet is a value the company
 * owns and the palette may not move. Everything derived from it, the label on it, the ring
 * around it and the ink beside it, is still solved, and the stated value is measured like a
 * solved one.
 */
export const recipe: Recipe = extendRecipe(base, {
  color: {
    // Near-black with a violet cast, and cards barely off it: an editorial dark page is one
    // plane with the shadow doing the separating.
    dark: { cardLift: 3, page: 9, popoverLift: 6 },

    // Nearly white, because body text reads best on it, with the cards lifted the base's
    // distance so a pull quote still sits on something.
    light: { cardLift: 3, page: 98, popoverLift: 3 },

    // The greys keep a trace of the violet rather than a trace of the blue.
    neutral: { chroma: 0.01, hue: 295 },

    primary: '#7c3aed',
    stated: { dark: { primary: '#7c3aed' }, light: { primary: '#7c3aed' } },

    // A cooler, lighter cast on the surfaces than either of the others.
    surface: { chroma: 0.01, hue: 300 },
  },

  effect: {
    // Half again as much ink in every shadow. Editorial layouts float cards over long
    // measures of text, and the depth is what separates the two.
    depth: 1.5,
  },

  font: {
    // A high-contrast serif with tapered, slightly wonky stems. It carries a headline where a
    // reading face would go quiet.
    display: {
      fallback: 'Georgia, serif',
      family: 'Fraunces Variable',
      source: '@fontsource-variable/fraunces/wght.css',
    },

    // A narrow, upright monospace, so a code block sits inside a measure of text rather than
    // pushing it wider.
    mono: {
      family: 'Source Code Pro Variable',
      source: '@fontsource-variable/source-code-pro/wght.css',
    },

    // A serif for the body too, cut for screens with sturdy slabs and a large x-height. This
    // is the change a reader sees first: every other theme sets body text in a sans.
    sans: {
      fallback: 'Georgia, serif',
      family: 'Literata Variable',
      source: '@fontsource-variable/literata/wght.css',
    },
  },

  size: {
    // Larger body text, since a page of it is read rather than scanned. The whole type
    // scale follows the one number.
    text: { base: '17px' },
  },
})
