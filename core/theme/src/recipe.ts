/**
 * @fileoverview States what makes one theme different from another. A theme writes a
 * recipe, hues and a shape, and the builder turns it into every token. Writing the values by
 * hand is still allowed, since `ThemeValues` is the contract rather than the recipe, but a
 * recipe keeps the relationships between tokens intact when a hue moves.
 */

import {
  exactOptional,
  maxValue,
  minValue,
  number,
  picklist,
  pipe,
  type SchemaOf,
  strictObject,
  strictTuple,
  string,
} from '@stealthscale/core-schema'

import { type ContrastLevel, ladderFor, type Outcome } from '#ladder.ts'
import { type ThemeMode } from '#tokens.ts'

/**
 * Names the four outcome hues, 0 to 360.
 */
export type StatusHues = Record<Outcome, number>

/**
 * Names the two font families a theme picks, as CSS lists.
 */
export interface FontFamilies {
  /**
   * Sets the monospace family.
   */
  mono: string

  /**
   * Sets the text family.
   */
  sans: string
}

/**
 * States what makes one theme different from another.
 */
export interface PaletteRecipe {
  /**
   * Sets the hue of the accent surface, 0 to 360. It is often a neighbour of the primary.
   */
  accent: number

  /**
   * Sets the five series hues, in the order a chart assigns them.
   */
  chart: readonly [number, number, number, number, number]

  /**
   * Sets how saturated the primary is. 0.17 reads as deliberate; past 0.22 it shouts.
   * Default: 0.17.
   */
  chroma?: number

  /**
   * Sets what a fill has to clear against the label on it: the primary, the four statuses
   * and the sidebar's primary. Text on a surface is AAA whatever this says. `AAA` keeps the
   * light primary near 45 and makes the dark one a pastel with near-black text; `AA` lets a
   * saturated primary carry white text in both modes. Default: `AAA`.
   */
  contrast?: ContrastLevel

  /**
   * Sets the font families. Default: Inter and JetBrains Mono, with system fallbacks.
   */
  fonts?: FontFamilies

  /**
   * Sets the lightness of the dark page, 0 to 100. Default: the dark ladder's page.
   */
  ink?: number

  /**
   * Sets the hue the greys are tinted with.
   */
  neutral: number

  /**
   * Sets how much the greys are tinted. 0 is a true grey and 0.02 a coloured one. Default:
   * 0.008.
   */
  neutralChroma?: number

  /**
   * Sets the lightness of the light page, 0 to 100. Lower reads as paper and higher as glass.
   * Default: the light ladder's page.
   */
  paper?: number

  /**
   * Sets the hue of the primary action, 0 to 360.
   */
  primary: number

  /**
   * Sets the corner radius, which is most of what makes a theme feel soft or precise. Every
   * radius step is a multiple of it. Default: `0.5rem`.
   */
  radius?: string

  /**
   * Sets the hues for the outcomes. Red, green, amber and blue stand in for any left out,
   * which is what makes a warning the same colour in every product; a brand whose palette
   * carries its own says so here, and the chart tones follow.
   */
  status?: Partial<StatusHues>

  /**
   * Sets how much the surfaces are tinted: the page, cards and popovers. It is separate from
   * `neutralChroma` because a surface needs far more tint than a border to read as coloured
   * at all. At 99 lightness, 0.008 is white in every theme, and four themes that share a
   * white page look like one theme. Default: 2.5 times `neutralChroma`.
   */
  surfaceChroma?: number

  /**
   * Sets the hue of the surfaces, when it is not the greys'. A cream page under sage
   * hairlines is two hues, and one `neutral` cannot be both. Default: `neutral`.
   */
  surfaceHue?: number
}

/**
 * Accepts a hue as the colour wheel names it, 0 to 360.
 */
const HUE = pipe(number(), minValue(0), maxValue(360))

/**
 * Accepts a lightness as a percentage, 0 to 100.
 */
const LIGHTNESS = pipe(number(), minValue(0), maxValue(100))

/**
 * Accepts a chroma, which has no ceiling: what a display can show is settled by the gamut
 * mapping rather than by a number here.
 */
const CHROMA = pipe(number(), minValue(0))

/**
 * Builds the schema a recipe read from a file is held to.
 *
 * A recipe is written by hand in a package the toolchain loads, so every way of getting it
 * wrong is a refusal with a code rather than a palette that comes out looking odd: a hue past
 * the wheel, a lightness past 100, a chart with four series instead of five, and a key that
 * is not a member at all, which is how a typo in an optional name would otherwise do nothing
 * in silence.
 *
 * @returns {SchemaOf<PaletteRecipe>} The schema. It refuses a missing member and an unknown
 *     key alike with the code `strict_object` on that key's path, a number outside its range
 *     with `min_value` or `max_value`, and a sixth chart series with `strict_tuple`.
 */
export function recipeSchema(): SchemaOf<PaletteRecipe> {
  return strictObject({
    accent: HUE,
    chart: strictTuple([HUE, HUE, HUE, HUE, HUE]),
    chroma: exactOptional(CHROMA),
    contrast: exactOptional(picklist(['AA', 'AAA'])),
    fonts: exactOptional(strictObject({ mono: string(), sans: string() })),
    ink: exactOptional(LIGHTNESS),
    neutral: HUE,
    neutralChroma: exactOptional(CHROMA),
    paper: exactOptional(LIGHTNESS),
    primary: HUE,
    radius: exactOptional(string()),
    status: exactOptional(
      strictObject({
        destructive: exactOptional(HUE),
        info: exactOptional(HUE),
        success: exactOptional(HUE),
        warning: exactOptional(HUE),
      }),
    ),
    surfaceChroma: exactOptional(CHROMA),
    surfaceHue: exactOptional(HUE),
  })
}

/**
 * Sets the hues for outcomes unless a recipe names its own: red, green, amber and blue.
 */
export const STATUS_HUES: StatusHues = { destructive: 27, info: 235, success: 150, warning: 85 }

/**
 * Sets the families a recipe gets when it names none.
 */
export const DEFAULT_FONTS: FontFamilies = {
  mono: "'JetBrains Mono Variable', ui-monospace, monospace",
  sans: "'Inter Variable', ui-sans-serif, system-ui, sans-serif",
}

/**
 * Reads the outcome hues a recipe uses: its own where it named them, the fixed ones elsewhere.
 *
 * @param {PaletteRecipe} recipe - The theme's recipe.
 * @returns {StatusHues} All four hues.
 */
export function statusHues(recipe: PaletteRecipe): StatusHues {
  return { ...STATUS_HUES, ...recipe.status }
}

/**
 * Reads the level a recipe asked for.
 *
 * @param {PaletteRecipe} recipe - The theme's recipe.
 * @returns {ContrastLevel} The level, AAA when the recipe said nothing.
 */
export function levelOf(recipe: PaletteRecipe): ContrastLevel {
  return recipe.contrast ?? 'AAA'
}

/**
 * Reads how saturated the primary is.
 *
 * @param {PaletteRecipe} recipe - The theme's recipe.
 * @returns {number} The primary's saturation.
 */
export function chromaOf(recipe: PaletteRecipe): number {
  return recipe.chroma ?? 0.17
}

/**
 * Reads how much the greys are tinted.
 *
 * @param {PaletteRecipe} recipe - The theme's recipe.
 * @returns {number} The neutral chroma.
 */
export function tintOf(recipe: PaletteRecipe): number {
  return recipe.neutralChroma ?? 0.008
}

/**
 * Reads how much the surfaces are tinted.
 *
 * @param {PaletteRecipe} recipe - The theme's recipe.
 * @returns {number} The surface chroma.
 */
export function surfaceTint(recipe: PaletteRecipe): number {
  return recipe.surfaceChroma ?? tintOf(recipe) * 2.5
}

/**
 * Reads the hue the surfaces carry.
 *
 * @param {PaletteRecipe} recipe - The theme's recipe.
 * @returns {number} The hue the page, cards and popovers carry.
 */
export function surfaceHue(recipe: PaletteRecipe): number {
  return recipe.surfaceHue ?? recipe.neutral
}

/**
 * Reads the page's lightness for a mode.
 *
 * @param {PaletteRecipe} recipe - The theme's recipe.
 * @param {ThemeMode} which - The mode.
 * @returns {number} The lightness, 0 to 100.
 */
export function pageLightness(recipe: PaletteRecipe, which: ThemeMode): number {
  return (which === 'dark' ? recipe.ink : recipe.paper) ?? ladderFor(which).page
}
