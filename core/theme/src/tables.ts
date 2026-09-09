/**
 * @fileoverview Merges what a theme states over every table the contract exports, entry by
 * entry, and applies the three factors a person reaches for rather than a table: the type
 * size, the depth of every shadow and the speed of every animation. A theme naming one step
 * of one table keeps every other step of it, so stating a shadow does not cost the rest.
 */

import { ANIMATION, PRESS_SCALE } from '#motion.ts'
import {
  type EffectRecipe,
  type FontRecipe,
  type MotionRecipe,
  type Recipe,
  type SizeRecipe,
} from '#recipe.ts'
import {
  BLUR,
  DEFAULT_DENSITY,
  DENSITY,
  type Density,
  DISABLED_OPACITY,
  DROP_SHADOW,
  DURATION,
  EASE,
  FOCUS_WIDTH,
  FONT_WEIGHT,
  GLOW,
  INSET_SHADOW,
  LEADING,
  PERSPECTIVE,
  SHADOW,
  SHADOW_RIM,
  type ShadowLayer,
  TEXT,
  TEXT_SHADOW,
  type TextStep,
  TRACKING,
} from '#scales.ts'

/**
 * Sets how many pixels one rem is, for a type size a theme wrote in pixels.
 */
const ROOT_FONT_SIZE = 16

/**
 * Reads a length as a number and its unit.
 */
const LENGTH = /^(?<size>\d*\.?\d+)(?<unit>px|rem)$/u

/**
 * Names a table of shadow steps.
 */
type Layers = Readonly<Record<string, readonly ShadowLayer[]>>

/**
 * Carries every table the emitter writes values from, merged over the contract's.
 */
export interface Tables {
  /**
   * Maps each animation the contract names to the shorthand it runs with.
   */
  animation: Readonly<Record<string, string>>

  /**
   * Maps each blur step to its pixels.
   */
  blur: Readonly<Record<string, number>>

  /**
   * Names the density a page takes where nothing sets one.
   */
  defaultDensity: string

  /**
   * Maps each density to its one length and its focus offset.
   */
  density: Readonly<Record<string, Density>>

  /**
   * Sets how far a disabled control fades.
   */
  disabled: number

  /**
   * Maps each drop shadow step to its layers.
   */
  dropShadow: Layers

  /**
   * Maps each duration step to its milliseconds.
   */
  duration: Readonly<Record<string, number>>

  /**
   * Maps each easing to the curve it follows.
   */
  ease: Readonly<Record<string, string>>

  /**
   * Sets the focus ring's width, in pixels.
   */
  focusWidth: number

  /**
   * Maps each named weight to its number.
   */
  fontWeight: Readonly<Record<string, number>>

  /**
   * Maps each glow step to its layers.
   */
  glow: Layers

  /**
   * Maps each inset shadow step to its layers.
   */
  insetShadow: Layers

  /**
   * Maps each line height to its ratio.
   */
  leading: Readonly<Record<string, number>>

  /**
   * Maps each perspective step to its pixels.
   */
  perspective: Readonly<Record<string, number>>

  /**
   * Sets how far a pressed control shrinks.
   */
  press: number

  /**
   * Maps each box shadow step to its layers.
   */
  shadow: Layers

  /**
   * Maps each box shadow step to how strong the rim around it is. A step mapped to 0 draws
   * no rim.
   */
  shadowRim: Readonly<Record<string, number>>

  /**
   * Sets the one length every gap, padding and gutter derives from.
   */
  spacing: string

  /**
   * Maps each type step to its size and line height, in rem.
   */
  text: Readonly<Record<string, TextStep>>

  /**
   * Maps each text shadow step to its layers.
   */
  textShadow: Layers

  /**
   * Maps each letter spacing to its em.
   */
  tracking: Readonly<Record<string, number>>
}

/**
 * Holds every table at the contract's own value, which is what a theme merges over.
 */
export const DEFAULT_TABLES: Tables = {
  animation: ANIMATION,
  blur: BLUR,
  defaultDensity: DEFAULT_DENSITY,
  density: DENSITY,
  disabled: DISABLED_OPACITY,
  dropShadow: DROP_SHADOW,
  duration: DURATION,
  ease: EASE,
  focusWidth: FOCUS_WIDTH,
  fontWeight: FONT_WEIGHT,
  glow: GLOW,
  insetShadow: INSET_SHADOW,
  leading: LEADING,
  perspective: PERSPECTIVE,
  press: PRESS_SCALE,
  shadow: SHADOW,
  shadowRim: SHADOW_RIM,
  spacing: '0.25rem',
  text: TEXT,
  textShadow: TEXT_SHADOW,
  tracking: TRACKING,
}

/**
 * Lays a theme's entries over a table, entry by entry.
 *
 * A member written as `undefined` leaves the contract's value in place, so a theme that
 * spreads an object with a hole in it does not knock a step out of the table.
 *
 * @template Value - What one entry of the table holds.
 * @param {Readonly<Record<string, Value>>} base - The contract's table.
 * @param {Readonly<Record<string, undefined | Value>>} [stated] - The entries the theme
 *     states. Default: nothing, giving the contract's table.
 * @returns {Record<string, Value>} The merged table.
 */
function over<Value>(
  base: Readonly<Record<string, Value>>,
  stated: Readonly<Record<string, undefined | Value>> = {},
): Record<string, Value> {
  const merged: Record<string, Value> = { ...base }
  for (const [step, value] of Object.entries(stated)) {
    if (value !== undefined) merged[step] = value
  }
  return merged
}

/**
 * Reads a type size as the factor the whole scale is multiplied by.
 *
 * @param {string} [base] - The size of body text as a length. Default: `1rem`.
 * @returns {number} How much larger every step is than the contract's own, so `15px` gives
 *     0.9375 and a length in no unit this reads gives 1.
 */
function textFactor(base = '1rem'): number {
  const written = LENGTH.exec(base)
  if (written?.groups === undefined) return 1

  const size = Number(written.groups['size'])
  return written.groups['unit'] === 'px' ? size / ROOT_FONT_SIZE : size
}

/**
 * Scales every step of the type scale by one factor, rounded to what a stylesheet reads.
 *
 * @param {Readonly<Record<string, TextStep>>} text - The scale.
 * @param {number} factor - The factor the body size sets.
 * @returns {Record<string, TextStep>} The scale, every size and line height multiplied.
 */
function scaledText(
  text: Readonly<Record<string, TextStep>>,
  factor: number,
): Record<string, TextStep> {
  return Object.fromEntries(
    Object.entries(text).map(([step, { lineHeight, size }]): [string, TextStep] => [
      step,
      {
        lineHeight: Number((lineHeight * factor).toFixed(4)),
        size: Number((size * factor).toFixed(4)),
      },
    ]),
  )
}

/**
 * Scales the share of ink every layer of every step takes, and never past all of it.
 *
 * @param {Readonly<Record<string, readonly ShadowLayer[]>>} table - A table of shadow steps.
 * @param {number} depth - The factor the theme sets.
 * @returns {Layers} The table, every share multiplied.
 */
function deepened(table: Readonly<Record<string, readonly ShadowLayer[]>>, depth: number): Layers {
  return Object.fromEntries(
    Object.entries(table).map(([step, layers]): [string, readonly ShadowLayer[]] => [
      step,
      layers.map((layer) => ({
        ...layer,
        fraction: Math.min(100, Math.round(layer.fraction * depth)),
      })),
    ]),
  )
}

/**
 * Scales every share of a numeric table, and never past all of it.
 *
 * A theme setting a deeper `depth` asks for more separation between planes, and the rim is
 * part of that separation, so it moves with the ink rather than staying put.
 *
 * @param {Readonly<Record<string, number>>} table - Each step mapped to its share.
 * @param {number} depth - The factor the theme sets.
 * @returns {Record<string, number>} The table, every share multiplied.
 */
function scaled(table: Readonly<Record<string, number>>, depth: number): Record<string, number> {
  return Object.fromEntries(
    Object.entries(table).map(([step, share]): [string, number] => [
      step,
      Math.min(100, Math.round(share * depth)),
    ]),
  )
}

/**
 * Carries the tables the effect group settles.
 */
type ShadowTables = Pick<
  Tables,
  | 'blur'
  | 'disabled'
  | 'dropShadow'
  | 'glow'
  | 'insetShadow'
  | 'perspective'
  | 'shadow'
  | 'shadowRim'
  | 'textShadow'
>

/**
 * Merges the effect group over the contract's tables and applies the depth.
 *
 * @param {EffectRecipe} effect - The effect group as written.
 * @returns {ShadowTables} The shadows, the blurs and the perspectives.
 */
function effectTables(effect: EffectRecipe): ShadowTables {
  const depth = effect.depth ?? 1

  return {
    blur: over(DEFAULT_TABLES.blur, effect.blur),
    disabled: effect.disabled ?? DEFAULT_TABLES.disabled,
    dropShadow: deepened(over(DEFAULT_TABLES.dropShadow, effect.dropShadow), depth),
    glow: deepened(over(DEFAULT_TABLES.glow, effect.glow), depth),
    insetShadow: deepened(over(DEFAULT_TABLES.insetShadow, effect.insetShadow), depth),
    perspective: over(DEFAULT_TABLES.perspective, effect.perspective),
    shadow: deepened(over(DEFAULT_TABLES.shadow, effect.shadow), depth),
    shadowRim: scaled(DEFAULT_TABLES.shadowRim, depth),
    textShadow: deepened(over(DEFAULT_TABLES.textShadow, effect.textShadow), depth),
  }
}

/**
 * Carries the tables the motion group settles.
 */
type MotionTables = Pick<Tables, 'animation' | 'duration' | 'ease' | 'press'>

/**
 * Merges the motion group over the contract's tables and applies the speed.
 *
 * @param {MotionRecipe} motion - The motion group as written.
 * @returns {MotionTables} The timing every animation is built from.
 */
function motionTables(motion: MotionRecipe): MotionTables {
  const speed = motion.speed ?? 1
  const durations = over(DEFAULT_TABLES.duration, motion.duration)

  return {
    animation: over(DEFAULT_TABLES.animation, motion.animation),
    duration: Object.fromEntries(
      Object.entries(durations).map(([step, ms]): [string, number] => [
        step,
        Math.round(ms * speed),
      ]),
    ),
    ease: over(DEFAULT_TABLES.ease, motion.ease),
    press: motion.press ?? DEFAULT_TABLES.press,
  }
}

/**
 * Carries the tables the size group settles.
 */
type SizeTables = Pick<
  Tables,
  'defaultDensity' | 'density' | 'focusWidth' | 'leading' | 'spacing' | 'text' | 'tracking'
>

/**
 * Merges the size group over the contract's tables and applies the type size.
 *
 * @param {SizeRecipe} size - The size group as written.
 * @returns {SizeTables} The lengths, the densities and the scales.
 */
function sizeTables(size: SizeRecipe): SizeTables {
  const { density = {}, focus = {}, text = {} } = size

  return {
    defaultDensity: density.default ?? DEFAULT_TABLES.defaultDensity,
    density: over(DEFAULT_TABLES.density, density.steps),
    focusWidth: focus.width ?? DEFAULT_TABLES.focusWidth,
    leading: over(DEFAULT_TABLES.leading, size.leading),
    spacing: size.spacing ?? DEFAULT_TABLES.spacing,
    text: scaledText(over(DEFAULT_TABLES.text, text.steps), textFactor(text.base)),
    tracking: over(DEFAULT_TABLES.tracking, size.tracking),
  }
}

/**
 * Merges every table a recipe may state over the contract's.
 *
 * @param {Recipe} recipe - The recipe, held to its schema already.
 * @param {FontRecipe} font - The font group, which carries the weights.
 * @returns {Tables} Every table the emitter writes values from.
 */
export function tablesOf(recipe: Recipe, font: FontRecipe): Tables {
  return {
    ...effectTables(recipe.effect ?? {}),
    ...motionTables(recipe.motion ?? {}),
    ...sizeTables(recipe.size ?? {}),
    fontWeight: over(DEFAULT_TABLES.fontWeight, font.weight),
  }
}
