/**
 * @fileoverview States what a theme is, in the units a person has. A recipe has five groups.
 * Each opens with what a designer states, a colour as a colour, a family with the file that
 * loads it, a corner, a spacing, a type size, and carries underneath every table the contract
 * exports, merged per entry, for the theme that needs one entry of one table. One colour is a
 * theme; everything else is a choice, and `extendRecipe` lays one theme's choices over
 * another's.
 */

import {
  array,
  check,
  exactOptional,
  maxValue,
  minValue,
  number,
  picklist,
  pipe,
  record,
  regex,
  safeParse,
  type SchemaOf,
  strictObject,
  strictTuple,
  string,
  union,
} from '@stealthscale/core-schema'

import { type ContrastLevel, type Ladder, type Outcome } from '#ladder.ts'
import { ANIMATION } from '#motion.ts'
import { DENSITY, type Density, FONT_WEIGHT, type ShadowLayer, type TextStep } from '#scales.ts'
import { REQUIRED_TOKENS, type ThemeMode, type TokenName } from '#tokens.ts'
import { isColor, type Tone } from '#tone.ts'

/**
 * Names the tokens a theme states itself, per mode, on top of what its recipe solves.
 *
 * A recipe answers for the relationships between tokens. It cannot answer for a colour
 * somebody else owns: a company whose blue is a fixed hex has one value the palette may not
 * move. Stating it here leaves every other token derived, so the label on that fill, the ring
 * around it and the ink beside it still follow, and the stated value is measured like a solved
 * one.
 */
export type StatedValues = Partial<Record<ThemeMode, Readonly<Partial<Record<TokenName, string>>>>>

/**
 * States where a fill and its label start, for one mode, where a theme disagrees with the
 * contract's ladder.
 */
export interface FillsRecipe {
  /**
   * Sets where the primary fill starts.
   */
  key?: number

  /**
   * Sets the text on the primary fill.
   */
  keyText?: number

  /**
   * Sets where an outcome's fill starts.
   */
  status?: Partial<Record<Outcome, number>>

  /**
   * Sets the text on an outcome's fill.
   */
  statusText?: Partial<Record<Outcome, number>>
}

/**
 * States the colours a theme has, and opens the ladders underneath.
 */
export interface ColorRecipe {
  /**
   * Sets the accent surface, which a hover and a selected row take. Default: the primary's
   * hue twenty-six degrees along the wheel.
   */
  accent?: Tone

  /**
   * Sets the five series a chart assigns, in order. Default: the primary and four hues
   * seventy-two degrees apart.
   */
  chart?: readonly [Tone, Tone, Tone, Tone, Tone]

  /**
   * Sets what a fill has to clear against the label on it. Text on a surface is AAA whatever
   * this says. Default: `AAA`.
   */
  contrast?: ContrastLevel

  /**
   * Sets any step of the dark ladder, such as the page's lightness or the scrim's opacity.
   * Default: the contract's dark ladder.
   */
  dark?: Partial<Ladder>

  /**
   * Sets where a fill and its label start, per mode. Default: the contract's fills at the
   * level asked for.
   */
  fills?: Partial<Record<ThemeMode, FillsRecipe>>

  /**
   * Sets any step of the light ladder. Default: the contract's light ladder.
   */
  light?: Partial<Ladder>

  /**
   * Sets the hue the greys are tinted with. Default: the primary's hue at hairline chroma.
   */
  neutral?: Tone

  /**
   * Sets the primary action. This is the one member a theme cannot leave out.
   */
  primary: Tone

  /**
   * States a token literally, over what the recipe solved. `StatedValues` says when.
   */
  stated?: StatedValues

  /**
   * Sets an outcome's hue. A status tone sets its hue only; the fill keeps the contract's
   * chroma so an outcome reads the same in every product. Default: the contract's four.
   */
  status?: Partial<Record<Outcome, Tone>>

  /**
   * Sets the hue and tint of the page, cards and popovers. Default: the neutral's hue at two
   * and a half times its chroma.
   */
  surface?: Tone
}

/**
 * Names a font family, and where its files load from.
 */
export interface Family {
  /**
   * Sets the generic families behind it, as CSS lists them. Default: the role's own, such as
   * `ui-sans-serif, system-ui, sans-serif`.
   */
  fallback?: string

  /**
   * Names the family as the font declares it: `Inter Variable`.
   */
  family: string

  /**
   * Names the stylesheets that load the files, as a bundler resolves them from the theme's
   * own package: `@fontsource-variable/inter/wght.css`. Default: none, for a family the
   * system already has.
   */
  source?: readonly string[] | string
}

/**
 * States the families a theme picks, and opens the weights underneath.
 */
export interface FontRecipe {
  /**
   * Sets the face a heading is drawn in. Default: the text family.
   */
  display?: Family

  /**
   * Sets the code family. Default: the system's monospace.
   */
  mono?: Family

  /**
   * Sets the text family. Default: the system's sans.
   */
  sans?: Family

  /**
   * Sets a named weight, for a family whose semibold sits at 620 rather than 600.
   */
  weight?: Partial<Record<string, number>>
}

/**
 * States the type size, and opens the steps underneath.
 */
export interface TextRecipe {
  /**
   * Sets the size of body text as a length, `15px` or `0.9375rem`, and the whole scale
   * follows. Default: `1rem`.
   */
  base?: string

  /**
   * Replaces one step where a theme disagrees with the shape rather than the size.
   */
  steps?: Partial<Record<string, TextStep>>
}

/**
 * States which density a page takes, and opens the densities underneath.
 */
export interface DensityRecipe {
  /**
   * Names the density a page takes where nothing sets one. Default: `comfortable`.
   */
  default?: string

  /**
   * Restates a density's one length and its focus offset.
   */
  steps?: Partial<Record<string, Density>>
}

/**
 * States the focus ring.
 */
export interface FocusRecipe {
  /**
   * Sets the ring's width in every density, in pixels. Default: 2.
   */
  width?: number
}

/**
 * States the sizes a theme has.
 */
export interface SizeRecipe {
  /**
   * Sets which density a page takes, and any density's numbers.
   */
  density?: DensityRecipe

  /**
   * Sets the focus ring.
   */
  focus?: FocusRecipe

  /**
   * Replaces a line height, as a ratio.
   */
  leading?: Partial<Record<string, number>>

  /**
   * Sets the corner every radius step is a multiple of. Default: `0.5rem`.
   */
  radius?: string

  /**
   * Sets the one length every gap, padding and gutter derives from. Default: `0.25rem`.
   */
  spacing?: string

  /**
   * Sets the type size, and any step of the scale.
   */
  text?: TextRecipe

  /**
   * Replaces a letter spacing, in em.
   */
  tracking?: Partial<Record<string, number>>
}

/**
 * Names a table of shadow steps a theme may replace one step of.
 */
export type LayersRecipe = Partial<Record<string, readonly ShadowLayer[]>>

/**
 * States how deep a theme is, and opens the shadow tables underneath.
 */
export interface EffectRecipe {
  /**
   * Replaces a blur step, in pixels.
   */
  blur?: Partial<Record<string, number>>

  /**
   * Scales the share of ink every shadow layer takes: `0.5` for a flat product, `1.6` for a
   * deep one. Default: 1.
   */
  depth?: number

  /**
   * Replaces one drop shadow's layers.
   */
  dropShadow?: LayersRecipe

  /**
   * Replaces one glow's layers.
   */
  glow?: LayersRecipe

  /**
   * Replaces one inset shadow's layers.
   */
  insetShadow?: LayersRecipe

  /**
   * Replaces a perspective step, in pixels.
   */
  perspective?: Partial<Record<string, number>>

  /**
   * Replaces one box shadow's layers.
   */
  shadow?: LayersRecipe

  /**
   * Replaces one text shadow's layers.
   */
  textShadow?: LayersRecipe
}

/**
 * States how fast a theme moves, and opens the timing underneath. The names and the keyframes
 * are the contract's.
 */
export interface MotionRecipe {
  /**
   * Replaces the shorthand an animation the contract names runs with.
   */
  animation?: Partial<Record<string, string>>

  /**
   * Replaces a duration step, in milliseconds.
   */
  duration?: Partial<Record<string, number>>

  /**
   * Replaces an easing.
   */
  ease?: Partial<Record<string, string>>

  /**
   * Sets how far a pressed control shrinks, 0 to 1. Default: 0.98.
   */
  press?: number

  /**
   * Scales every duration: `0.8` for a snappier product, `1.5` for a calmer one. Default: 1.
   */
  speed?: number
}

/**
 * States what a theme is: the colours it has, and the fonts, sizes, depth and speed it
 * chooses. Only `color.primary` is required.
 */
export interface Recipe {
  /**
   * States the colours.
   */
  color: ColorRecipe

  /**
   * States the depth, and any shadow.
   */
  effect?: EffectRecipe

  /**
   * States the families.
   */
  font?: FontRecipe

  /**
   * States the speed, and any timing.
   */
  motion?: MotionRecipe

  /**
   * States the sizes.
   */
  size?: SizeRecipe
}

/**
 * States what one theme changes about another, group by group. Every member is optional,
 * since a theme extending another states only what differs.
 */
export interface RecipeOverrides {
  /**
   * Changes the colours.
   */
  color?: Partial<ColorRecipe>

  /**
   * Changes the depth, or a shadow.
   */
  effect?: EffectRecipe

  /**
   * Changes the families.
   */
  font?: FontRecipe

  /**
   * Changes the speed, or a timing.
   */
  motion?: MotionRecipe

  /**
   * Changes the sizes.
   */
  size?: SizeRecipe
}

/**
 * Names the four outcome hues, 0 to 360.
 */
export type StatusHues = Record<Outcome, number>

/**
 * Sets the hues for outcomes unless a recipe names its own: red, green, amber and blue.
 */
export const STATUS_HUES: StatusHues = { destructive: 27, info: 235, success: 150, warning: 85 }

/**
 * Sets the stacks a theme gets when it names no family: the system's own faces, so a theme
 * that names nothing loads nothing rather than naming a font nothing loads.
 */
export const DEFAULT_FAMILIES = {
  mono: 'ui-monospace, monospace',
  sans: 'ui-sans-serif, system-ui, sans-serif',
} as const

/**
 * Accepts a hue as the colour wheel names it, 0 to 360.
 */
const HUE = pipe(number(), minValue(0), maxValue(360))

/**
 * Accepts a chroma, which has no ceiling: what a display can show is settled by the gamut
 * mapping rather than by a number here.
 */
const CHROMA = pipe(number(), minValue(0))

/**
 * Accepts a number that cannot be negative: a lightness, an alpha, a length in rem, a ratio.
 */
const NONNEGATIVE = pipe(number(), minValue(0))

/**
 * Accepts a factor a theme scales a table by.
 */
const FACTOR = pipe(number(), minValue(0))

/**
 * Accepts a length as a theme writes one, in pixels or rem.
 */
const LENGTH = pipe(string(), regex(/^\d*\.?\d+(?:px|rem)$/u))

/**
 * Accepts a tone in any of its three forms. A string is held to the notations this package
 * reads, so `#ggg` is refused where it is written rather than solved as nothing.
 */
const TONE: SchemaOf<Tone> = union([
  pipe(string(), check(isColor)),
  HUE,
  strictObject({ chroma: exactOptional(CHROMA), hue: HUE }),
])

/**
 * Accepts one step of a ladder, left out where the contract's stands.
 */
const STEP = exactOptional(NONNEGATIVE)

/**
 * Accepts how far a surface sits from the page, in points of lightness. It is signed, because
 * a card rises towards white on paper and a muted panel recedes from it.
 */
const LIFT = exactOptional(number())

/**
 * Accepts any step of a ladder, each optional, and refuses a step the ladder does not have.
 */
const LADDER: SchemaOf<Partial<Ladder>> = strictObject({
  accentLift: LIFT,
  accentText: STEP,
  borderLift: LIFT,
  cardLift: LIFT,
  chart: STEP,
  glassAlpha: STEP,
  glassBorderAlpha: STEP,
  glow: STEP,
  glowAlpha: STEP,
  gradient: STEP,
  highlight: STEP,
  input: STEP,
  mutedLift: LIFT,
  mutedText: STEP,
  overlay: STEP,
  overlayAlpha: STEP,
  page: STEP,
  popoverLift: LIFT,
  selection: STEP,
  shadow: STEP,
  shadowAlpha: STEP,
  shadowHighlightAlpha: STEP,
  sidebarAccentLift: LIFT,
  sidebarBorderLift: LIFT,
  sidebarLift: LIFT,
  sidebarText: STEP,
  text: STEP,
})

/**
 * Accepts a value per outcome, each optional.
 */
const PER_OUTCOME = strictObject({
  destructive: STEP,
  info: STEP,
  success: STEP,
  warning: STEP,
})

/**
 * Accepts where the fills of one mode start.
 */
const FILLS: SchemaOf<FillsRecipe> = strictObject({
  key: STEP,
  keyText: STEP,
  status: exactOptional(PER_OUTCOME),
  statusText: exactOptional(PER_OUTCOME),
})

/**
 * Accepts the tokens a theme states, held to the contract's names so a typo is refused rather
 * than read as nothing.
 */
const STATED: SchemaOf<StatedValues> = strictObject({
  dark: exactOptional(record(picklist([...REQUIRED_TOKENS]), string())),
  light: exactOptional(record(picklist([...REQUIRED_TOKENS]), string())),
})

/**
 * Accepts the colour group.
 */
const COLOR: SchemaOf<ColorRecipe> = strictObject({
  accent: exactOptional(TONE),
  chart: exactOptional(strictTuple([TONE, TONE, TONE, TONE, TONE])),
  contrast: exactOptional(picklist(['AA', 'AAA'])),
  dark: exactOptional(LADDER),
  fills: exactOptional(strictObject({ dark: exactOptional(FILLS), light: exactOptional(FILLS) })),
  light: exactOptional(LADDER),
  neutral: exactOptional(TONE),
  primary: TONE,
  stated: exactOptional(STATED),
  status: exactOptional(
    strictObject({
      destructive: exactOptional(TONE),
      info: exactOptional(TONE),
      success: exactOptional(TONE),
      warning: exactOptional(TONE),
    }),
  ),
  surface: exactOptional(TONE),
})

/**
 * Accepts a family and where it loads from.
 */
const FAMILY: SchemaOf<Family> = strictObject({
  fallback: exactOptional(string()),
  family: string(),
  source: exactOptional(union([string(), array(string())])),
})

/**
 * Accepts the font group, with each weight held to the nine names the contract has.
 */
const FONT: SchemaOf<FontRecipe> = strictObject({
  display: exactOptional(FAMILY),
  mono: exactOptional(FAMILY),
  sans: exactOptional(FAMILY),
  weight: exactOptional(record(picklist(Object.keys(FONT_WEIGHT)), NONNEGATIVE)),
})

/**
 * Accepts one density: its one length in rem, and where its ring sits in pixels.
 */
const DENSITY_STEP: SchemaOf<Density> = strictObject({
  control: NONNEGATIVE,
  focusOffset: NONNEGATIVE,
})

/**
 * Accepts the size group, with each density held to the names the contract has.
 */
const SIZE: SchemaOf<SizeRecipe> = strictObject({
  density: exactOptional(
    strictObject({
      default: exactOptional(picklist(Object.keys(DENSITY))),
      steps: exactOptional(record(picklist(Object.keys(DENSITY)), DENSITY_STEP)),
    }),
  ),
  focus: exactOptional(strictObject({ width: exactOptional(NONNEGATIVE) })),
  leading: exactOptional(record(string(), NONNEGATIVE)),
  radius: exactOptional(LENGTH),
  spacing: exactOptional(LENGTH),
  text: exactOptional(
    strictObject({
      base: exactOptional(LENGTH),
      steps: exactOptional(
        record(string(), strictObject({ lineHeight: NONNEGATIVE, size: NONNEGATIVE })),
      ),
    }),
  ),
  tracking: exactOptional(record(string(), number())),
})

/**
 * Accepts a table of shadow steps, each a list of layers taking a share of the ink.
 */
const LAYERS: SchemaOf<LayersRecipe> = record(
  string(),
  array(strictObject({ fraction: pipe(number(), minValue(0), maxValue(100)), geometry: string() })),
)

/**
 * Accepts the effect group.
 */
const EFFECT: SchemaOf<EffectRecipe> = strictObject({
  blur: exactOptional(record(string(), NONNEGATIVE)),
  depth: exactOptional(FACTOR),
  dropShadow: exactOptional(LAYERS),
  glow: exactOptional(LAYERS),
  insetShadow: exactOptional(LAYERS),
  perspective: exactOptional(record(string(), NONNEGATIVE)),
  shadow: exactOptional(LAYERS),
  textShadow: exactOptional(LAYERS),
})

/**
 * Accepts the motion group, with each animation held to the names the contract has.
 */
const MOTION: SchemaOf<MotionRecipe> = strictObject({
  animation: exactOptional(record(picklist(Object.keys(ANIMATION)), string())),
  duration: exactOptional(record(string(), NONNEGATIVE)),
  ease: exactOptional(record(string(), string())),
  press: exactOptional(pipe(number(), minValue(0), maxValue(1))),
  speed: exactOptional(FACTOR),
})

/**
 * Builds the schema a recipe read from a file is held to.
 *
 * A recipe is written by hand in a package the toolchain loads, so every way of getting it
 * wrong is a refusal with a code rather than a palette that comes out looking odd: a hue past
 * the wheel, a string that names no colour, a chart with four series, a density or an
 * animation the contract does not name, and a key that is not a member at all, which is how a
 * typo in an optional name would otherwise do nothing in silence.
 *
 * @returns {SchemaOf<Recipe>} The schema. It refuses a missing member and an unknown key alike
 *     with the code `strict_object` on that key's path, a number outside its range with
 *     `min_value` or `max_value`, a string that names no colour with `check`, and a name
 *     outside a closed set with `picklist`.
 */
export function recipeSchema(): SchemaOf<Recipe> {
  return strictObject({
    color: COLOR,
    effect: exactOptional(EFFECT),
    font: exactOptional(FONT),
    motion: exactOptional(MOTION),
    size: exactOptional(SIZE),
  })
}

/**
 * Returns `true` for a value the merge descends into: an object that is no list.
 *
 * @param {unknown} value - Any value.
 * @returns {boolean} `true` for a plain object.
 */
function isPlain(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Lays one value over another, entry by entry where both are objects.
 *
 * A list replaces a list whole, because a shadow's layers or a chart's five series are one
 * composition, and merging two of them by index produces a third nobody wrote.
 *
 * @param {unknown} base - The value underneath.
 * @param {unknown} over - The value on top.
 * @returns {unknown} The merged value.
 */
function merged(base: unknown, over: unknown): unknown {
  if (!isPlain(base) || !isPlain(over)) return over

  const result: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(over)) {
    result[key] = key in base ? merged(base[key], value) : value
  }
  return result
}

/**
 * Lays one theme's choices over another's, group by group and entry by entry.
 *
 * This is how a theme extends another: it imports the base's recipe and states what differs.
 * A theme naming `effect.shadow.md` keeps the base's `sm` and `lg`; one naming
 * `color.light.cardLift` keeps the other twenty-six steps. The result is held to the schema, so a
 * theme that extends its way to something no palette builds from fails here, naming the field.
 *
 * @param {Recipe} base - The recipe underneath, such as the base theme's.
 * @param {Readonly<RecipeOverrides>} overrides - The groups this theme changes.
 * @returns {Recipe} The merged recipe.
 * @throws {Error} When the merge fails the schema, naming every field at fault.
 */
export function extendRecipe(base: Recipe, overrides: Readonly<RecipeOverrides>): Recipe {
  const read = safeParse(recipeSchema(), merged(base, overrides))
  if (read.ok) return read.value

  const reasons = read.failure.map((issue) => `${issue.path}: ${issue.reason}`)
  throw new Error(`Extending the recipe gives no recipe: ${reasons.join('; ')}`)
}
