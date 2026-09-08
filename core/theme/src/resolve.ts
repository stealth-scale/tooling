/**
 * @fileoverview Reads a recipe into what the builder solves from: every tone with the chroma
 * its role takes, the ladders and the fills merged over the contract's, and the font stacks
 * with the files that load them. The derivations that a theme used to write out by hand live
 * here, so one colour is a theme and everything else is a choice.
 */

import {
  type ContrastLevel,
  DARK,
  DARK_FILLS,
  type Fills,
  type Ladder,
  LIGHT,
  LIGHT_FILLS,
  type Outcome,
} from '#ladder.ts'
import {
  type ColorRecipe,
  DEFAULT_FAMILIES,
  type Family,
  type FillsRecipe,
  type FontRecipe,
  type Recipe,
  type StatedValues,
  STATUS_HUES,
} from '#recipe.ts'
import { type Tables, tablesOf } from '#tables.ts'
import { type ThemeMode } from '#tokens.ts'
import { type Tone, type Toned, toneOf } from '#tone.ts'

/**
 * Sets how far along the wheel the accent sits from the primary where a theme names none. A
 * neighbour rather than the primary itself: an accent that matches exactly reads as a second
 * button rather than as the same button under a pointer.
 */
const ACCENT_APART = 26

/**
 * Sets how far apart the five chart series sit where a theme names none: evenly, so a reader
 * tells any two apart by hue rather than by position.
 */
const SERIES_APART = 72

/**
 * Sets the chroma the primary takes where its tone names none. 0.17 reads as deliberate; past
 * 0.22 it shouts.
 */
const PRIMARY_CHROMA = 0.17

/**
 * Sets the chroma the greys take where the tone names none: a grey a reader would call grey,
 * with just enough hue that it belongs to the page rather than to the browser.
 */
const NEUTRAL_CHROMA = 0.008

/**
 * Sets how much more the accent surface is tinted than the greys.
 */
const ACCENT_TINT = 4

/**
 * Sets how much more the surfaces are tinted than the greys, because a surface needs far more
 * tint than a border to read as coloured at all.
 */
const SURFACE_TINT = 2.5

/**
 * Lists the four outcomes, in the order they are resolved.
 */
const OUTCOMES: readonly Outcome[] = ['destructive', 'info', 'success', 'warning']

/**
 * Carries the colours the builder solves from, every tone read and every ladder merged.
 */
export interface ResolvedColor {
  /**
   * Carries the accent surface's hue and tint.
   */
  accent: Toned

  /**
   * Lists the five series hues, in the order a chart assigns them.
   */
  chart: readonly number[]

  /**
   * Names the level every fill has to clear against the label on it.
   */
  contrast: ContrastLevel

  /**
   * Carries where the fills start, per mode, at the level asked for.
   */
  fills: Readonly<Record<ThemeMode, Fills>>

  /**
   * Carries how light each role sits, per mode.
   */
  ladder: Readonly<Record<ThemeMode, Ladder>>

  /**
   * Carries the greys' hue and tint.
   */
  neutral: Toned

  /**
   * Carries the primary's hue and chroma.
   */
  primary: Toned

  /**
   * Carries the tokens the theme states literally, which land over what it solved.
   */
  stated: StatedValues

  /**
   * Maps each outcome to the hue it is drawn in.
   */
  status: Readonly<Record<Outcome, number>>

  /**
   * Carries the surfaces' hue and tint.
   */
  surface: Toned
}

/**
 * Carries the font stacks a theme draws with, and the files that load them.
 */
export interface ResolvedFont {
  /**
   * Carries the stack a heading is drawn in, as CSS lists it.
   */
  display: string

  /**
   * Carries the stack code is drawn in.
   */
  mono: string

  /**
   * Carries the stack text is drawn in.
   */
  sans: string

  /**
   * Lists every stylesheet that loads a file, each once.
   */
  sources: readonly string[]
}

/**
 * Carries a recipe resolved: what the builder solves from and what the emitter writes.
 */
export interface Resolved {
  /**
   * Carries the colours, every tone read.
   */
  color: ResolvedColor

  /**
   * Carries the font stacks and their files.
   */
  font: ResolvedFont

  /**
   * Carries the corner every radius step is a multiple of.
   */
  radius: string

  /**
   * Lists how each written colour was read, one line each, so a build says what became of a
   * hex somebody pasted.
   */
  report: readonly string[]

  /**
   * Carries every table, merged over the contract's.
   */
  tables: Tables
}

/**
 * Wraps a hue round the wheel.
 *
 * @param {number} hue - Any number of degrees.
 * @returns {number} The same hue, 0 up to 360.
 */
function onWheel(hue: number): number {
  return ((hue % 360) + 360) % 360
}

/**
 * Reads a tone, and writes down what became of a colour a theme wrote out.
 *
 * @param {string} role - The role the tone fills, which the report names.
 * @param {Tone} tone - The tone as the recipe wrote it.
 * @param {number} chroma - The chroma the role takes where the tone names none.
 * @param {string[]} report - Where the reading of a written colour is appended.
 * @returns {Toned} The hue and the chroma the solver keeps.
 */
function read(role: string, tone: Tone, chroma: number, report: string[]): Toned {
  const toned = toneOf(tone, chroma)
  if (typeof tone === 'string') {
    report.push(
      `${role} ${tone} is read as hue ${toned.hue.toFixed(0)} at chroma ${toned.chroma.toFixed(3)}, and the solver sets its lightness per mode`,
    )
  }
  return toned
}

/**
 * Merges the fills a theme states over the contract's, for one mode.
 *
 * @param {Fills} base - The contract's fills at the level asked for.
 * @param {FillsRecipe} [stated] - The lightnesses the theme states. Default: nothing.
 * @returns {Fills} The lightnesses the builder walks from.
 */
function fillsOf(base: Fills, stated: FillsRecipe = {}): Fills {
  return {
    key: stated.key ?? base.key,
    keyText: stated.keyText ?? base.keyText,
    status: { ...base.status, ...stated.status },
    statusText: { ...base.statusText, ...stated.statusText },
  }
}

/**
 * Reads the hue each outcome is drawn in.
 *
 * An outcome states a hue and nothing else, because its fill carries the contract's own
 * chroma: a warning that changes saturation with the brand is a warning nobody learns to
 * read.
 *
 * @param {ColorRecipe} color - The colour group as written.
 * @param {string[]} report - Where the reading of a written colour is appended.
 * @returns {Record<Outcome, number>} All four hues.
 */
function statusOf(color: ColorRecipe, report: string[]): Record<Outcome, number> {
  const hues = { ...STATUS_HUES }
  for (const outcome of OUTCOMES) {
    const tone = color.status?.[outcome]
    if (tone !== undefined) hues[outcome] = read(outcome, tone, 0, report).hue
  }
  return hues
}

/**
 * Resolves the colour group: every tone read, every derivation applied, every ladder merged.
 *
 * @param {ColorRecipe} color - The colour group as written.
 * @param {string[]} report - Where the reading of a written colour is appended.
 * @returns {ResolvedColor} The colours the builder solves from.
 */
function colorOf(color: ColorRecipe, report: string[]): ResolvedColor {
  const primary = read('primary', color.primary, PRIMARY_CHROMA, report)
  const neutral = read('neutral', color.neutral ?? primary.hue, NEUTRAL_CHROMA, report)
  const accent = read(
    'accent',
    color.accent ?? onWheel(primary.hue - ACCENT_APART),
    neutral.chroma * ACCENT_TINT,
    report,
  )
  const surface = read(
    'surface',
    color.surface ?? neutral.hue,
    neutral.chroma * SURFACE_TINT,
    report,
  )
  const series =
    color.chart ?? [0, 1, 2, 3, 4].map((step) => onWheel(primary.hue + step * SERIES_APART))
  const contrast = color.contrast ?? 'AAA'

  return {
    accent,
    chart: series.map((tone, index) => read(`chart ${String(index + 1)}`, tone, 0, report).hue),
    contrast,
    fills: {
      dark: fillsOf(DARK_FILLS[contrast], color.fills?.dark),
      light: fillsOf(LIGHT_FILLS[contrast], color.fills?.light),
    },
    ladder: { dark: { ...DARK, ...color.dark }, light: { ...LIGHT, ...color.light } },
    neutral,
    primary,
    stated: color.stated ?? {},
    status: statusOf(color, report),
    surface,
  }
}

/**
 * Writes a family as the stack CSS reads: the family quoted, then what it falls back to.
 *
 * @param {Family | undefined} family - The family, or nothing where the theme names none.
 * @param {string} fallback - The generic families the role falls back to.
 * @returns {string} The families, in the order a browser tries them.
 */
function stackOf(family: Family | undefined, fallback: string): string {
  if (family === undefined) return fallback
  return `'${family.family}', ${family.fallback ?? fallback}`
}

/**
 * Lists the stylesheets one family loads from.
 *
 * @param {Family | undefined} family - The family, or nothing.
 * @returns {readonly string[]} Its sources, and none where it names none.
 */
function sourcesOf(family: Family | undefined): readonly string[] {
  if (family?.source === undefined) return []
  return typeof family.source === 'string' ? [family.source] : family.source
}

/**
 * Resolves the font group into the three stacks and the files that load them.
 *
 * @param {FontRecipe} font - The font group as written.
 * @returns {ResolvedFont} The stacks a theme draws with.
 */
function fontOf(font: FontRecipe): ResolvedFont {
  const sans = stackOf(font.sans, DEFAULT_FAMILIES.sans)

  return {
    display: font.display === undefined ? sans : stackOf(font.display, DEFAULT_FAMILIES.sans),
    mono: stackOf(font.mono, DEFAULT_FAMILIES.mono),
    sans,
    sources: [
      ...new Set([font.sans, font.mono, font.display].flatMap((family) => sourcesOf(family))),
    ],
  }
}

/**
 * Resolves a recipe into what the builder solves from and what the emitter writes.
 *
 * @param {Recipe} recipe - The recipe, held to its schema already.
 * @returns {Resolved} The colours with every tone read, the font stacks, the corner, every
 *     table merged, and the report of how each written colour was read.
 */
export function resolveRecipe(recipe: Recipe): Resolved {
  const report: string[] = []
  const font = recipe.font ?? {}

  return {
    color: colorOf(recipe.color, report),
    font: fontOf(font),
    radius: recipe.size?.radius ?? '0.5rem',
    report,
    tables: tablesOf(recipe, font),
  }
}
