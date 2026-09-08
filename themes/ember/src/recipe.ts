/**
 * @fileoverview States what makes Ember differ from the base theme, and nothing else. Every
 * value it does not name is the base's, so a change to the base reaches this theme without an
 * edit here.
 */

import { extendRecipe, type Recipe } from '@stealthscale/core-theme'
import { recipe as base } from '@stealthscale/theme-base'

/**
 * States a warm, dense, quick product: an operations console rather than a marketing page.
 *
 * It changes something in four of the five groups, which is what a theme with a house style
 * of its own does: the colour, the family it reads in, how flat it draws and how fast it
 * moves.
 */
export const recipe: Recipe = extendRecipe(base, {
  color: {
    // A warm charcoal rather than a neutral black, a point above the base's ink.
    dark: { cardLift: 5, page: 14, popoverLift: 8 },

    // Cream. A console is stared at all day, and paper is easier to sit in front of than
    // white. The cards sit only two points above it, which keeps a dense screen calm.
    light: { cardLift: 2, page: 96, popoverLift: 3 },

    // Warm greys, so a rule between two rows belongs to the same page as the cream.
    neutral: { chroma: 0.014, hue: 70 },

    // The brand's orange. Its hue and saturation are read off the hex, and the solver settles
    // the lightness so a label still reads on the fill in both modes.
    primary: '#d9480f',

    // The surfaces carry a clear amber cast, which is the whole difference between this and a
    // grey console with an orange button.
    surface: { chroma: 0.02, hue: 75 },
  },

  effect: {
    // Half the base's ink in every shadow. A console shows many surfaces at once, and a deep
    // shadow under each reads as clutter rather than as depth.
    depth: 0.5,
  },

  font: {
    // A grotesque cut with ink traps, which gives a heading the bite this theme's orange
    // already has.
    display: {
      family: 'Bricolage Grotesque Variable',
      source: '@fontsource-variable/bricolage-grotesque/wght.css',
    },

    // A programming face with a wide, even colour, so a compact table of code stays even.
    mono: {
      family: 'Fira Code Variable',
      source: '@fontsource-variable/fira-code/wght.css',
    },

    // A geometric face built on circles, with a small x-height and wide-open counters. Against
    // the base's Inter it reads rounder and lighter at the same size, which is the difference
    // a person sees before they read a word.
    sans: {
      family: 'Jost Variable',
      source: '@fontsource-variable/jost/wght.css',
    },
  },

  motion: {
    // A fifth quicker than the base. Somebody working through a queue sees the same animation
    // hundreds of times a day, and the house rhythm is what makes that bearable.
    speed: 0.8,
  },

  size: {
    // Packed by default, since a console is read at a desk and its rows are what matters.
    density: { default: 'compact' },
  },
})
