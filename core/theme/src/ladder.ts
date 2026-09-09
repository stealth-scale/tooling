/**
 * @fileoverview Sets how light each role is in each mode. This is the whole difference
 * between the two modes: the hues are the same and the ladder is inverted. Keeping it as
 * data rather than a ternary per token is what makes a theme readable, and what makes "the
 * dark card is too light" a one-number fix.
 */

import { type ThemeMode } from '#tokens.ts'

/**
 * Sets the ratio a colour has to clear against what it sits on, per level.
 *
 * `AA` and `AAA` are WCAG 1.4.3 and 1.4.6 for text. `UI` is WCAG 1.4.11, the floor for a
 * boundary a person needs to find a control, such as a field's outline or the focus ring.
 */
export const RATIOS = { AA: 4.5, AAA: 7, UI: 3 } as const

/**
 * Names the two floors a recipe can ask for. Text on a surface is held to `AAA` regardless.
 */
export type ContrastLevel = 'AA' | 'AAA'

/**
 * Names the four outcomes a theme colours: something went wrong, something worked, something
 * needs care, and something is worth knowing.
 */
export type Outcome = 'destructive' | 'info' | 'success' | 'warning'

/**
 * Sets how light each role is, as a percentage, for one mode.
 */
export interface Ladder {
  /**
   * Sets the accent surface.
   */
  accentLift: number

  /**
   * Sets the text on the accent surface.
   */
  accentText: number

  /**
   * Sets the hairline between surfaces.
   */
  borderLift: number

  /**
   * Sets how far a card is lifted off the page, in points of lightness. It is a lift rather
   * than a lightness so that a theme moving its page carries every surface with it; a theme
   * that wants its cards flush with the page states 0.
   */
  cardLift: number

  /**
   * Sets a chart series colour.
   */
  chart: number

  /**
   * Sets the alpha a translucent surface carries.
   */
  glassAlpha: number

  /**
   * Sets the alpha the hairline around a translucent surface carries.
   */
  glassBorderAlpha: number

  /**
   * Sets how light a glow is thrown.
   */
  glow: number

  /**
   * Sets the alpha of a glow at its largest step. Every step takes a share of it.
   */
  glowAlpha: number

  /**
   * Sets where the three gradient stops sit. All three share it, so the band reads as one
   * gradient rather than as a fade.
   */
  gradient: number

  /**
   * Sets where the highlight behind a search match starts.
   */
  highlight: number

  /**
   * Sets where the hairline around a field starts. The solver moves it from here until it
   * clears 3:1 against the card.
   */
  input: number

  /**
   * Sets the muted surface, close to the page by definition.
   */
  mutedLift: number

  /**
   * Sets the text on the muted surface.
   */
  mutedText: number

  /**
   * Sets the scrim under a dialog.
   */
  overlay: number

  /**
   * Sets the opacity of the scrim.
   */
  overlayAlpha: number

  /**
   * Sets the page itself.
   */
  page: number

  /**
   * Sets how far a popover is lifted off the page, in points of lightness. In dark it sits
   * above a card, because a menu opened over one at the same lightness had only its hairline
   * to show it was in front; in light both reach white and the shadow does that work.
   */
  popoverLift: number

  /**
   * Sets where the fill behind selected text starts.
   */
  selection: number

  /**
   * Sets the shadow ink.
   */
  shadow: number

  /**
   * Sets the opacity of the shadow ink at the largest step. Every step takes a share of it.
   */
  shadowAlpha: number

  /**
   * Sets the opacity of the light along a raised surface's top edge. It is 0 in light, where
   * a shadow does the work.
   */
  shadowHighlightAlpha: number

  /**
   * Sets the opacity of the rim around a floating surface at the heaviest step, which every
   * step that takes a rim takes a share of.
   *
   * It is higher in dark than in light. The rim is drawn in the page's own ink, so it is dark
   * on paper, where the shadow under it already reads, and light on a near-black page, where
   * the shadow does not and the rim is the whole of what separates the two planes.
   */
  shadowRimAlpha: number

  /**
   * Sets how far the sidebar's accent sits from the page.
   */
  sidebarAccentLift: number

  /**
   * Sets how far the sidebar's hairline sits from the page.
   */
  sidebarBorderLift: number

  /**
   * Sets how far the sidebar's own plane sits from the page. A sidebar that inherits the
   * page's lightness disappears into it, which is why it is a plane of its own at all.
   */
  sidebarLift: number

  /**
   * Sets the text on the sidebar.
   */
  sidebarText: number

  /**
   * Sets an outcome's soft surface: the tinted fill a badge, a callout or a table cell takes
   * where the solid one would shout. It is a lift off the page like any other surface, so a
   * theme that moves its paper carries the soft fills with it.
   */
  softLift: number

  /**
   * Sets where the text on a soft surface starts. The walk to a readable pair goes from here.
   */
  softText: number

  /**
   * Sets the text on the page.
   */
  text: number
}

/**
 * Sets where the fills start and what they carry, per contrast level.
 *
 * These are separate from the surfaces because the level changes them and nothing else: a
 * primary that has to clear 7:1 with white is a deep blue, one that has to clear 4.5:1 is a
 * saturated mid-blue, and in dark the AAA one gives up on white text and goes pastel with
 * near-black. The solver walks from these, so the numbers are where the walk begins rather
 * than where it ends.
 */
export interface Fills {
  /**
   * Sets where the primary fill starts.
   */
  key: number

  /**
   * Sets the text on the primary fill.
   */
  keyText: number

  /**
   * Sets where each outcome's fill starts.
   */
  status: Readonly<Record<Outcome, number>>

  /**
   * Sets the text on each outcome's fill.
   */
  statusText: Readonly<Record<Outcome, number>>
}

/**
 * Sets the light ladder.
 *
 * The page is paper, three points below a white card, so the light ladder has the steps the
 * dark one has: a card rises off the page rather than sitting on a page that is already
 * white. Muted, accent, the edges and the sidebar all move down with it and keep their
 * distance from the page.
 */
export const LIGHT: Ladder = {
  accentLift: -4,
  accentText: 25,
  borderLift: -8,
  cardLift: 3,
  chart: 58,
  glassAlpha: 0.72,
  glassBorderAlpha: 0.45,
  glow: 62,
  glowAlpha: 0.45,
  gradient: 60,
  highlight: 90,
  input: 80,
  mutedLift: -3,
  mutedText: 41,
  overlay: 15,
  overlayAlpha: 0.5,
  page: 97,
  popoverLift: 3,
  selection: 86,
  shadow: 12,
  shadowAlpha: 0.25,
  shadowHighlightAlpha: 0,
  shadowRimAlpha: 0.1,
  sidebarAccentLift: -6,
  sidebarBorderLift: -10,
  sidebarLift: -1,
  sidebarText: 25,
  softLift: -5,
  softText: 30,
  text: 20,
}

/**
 * Sets the dark ladder.
 */
export const DARK: Ladder = {
  accentLift: 15,
  accentText: 95,
  borderLift: 14,
  cardLift: 4,
  chart: 68,
  glassAlpha: 0.6,
  glassBorderAlpha: 0.28,
  glow: 72,
  glowAlpha: 0.6,
  gradient: 68,
  highlight: 40,
  input: 40,
  mutedLift: 10,
  mutedText: 76,
  overlay: 3,
  overlayAlpha: 0.7,
  page: 13,
  popoverLift: 7,
  selection: 36,
  shadow: 4,
  shadowAlpha: 0.9,
  shadowHighlightAlpha: 0.2,
  shadowRimAlpha: 0.32,
  sidebarAccentLift: 9,
  sidebarBorderLift: 13,
  sidebarLift: 2,
  sidebarText: 92,
  softLift: 12,
  softText: 88,
  text: 96,
}

/**
 * Sets the light fills per level.
 *
 * The walk only darkens. At AA a start of 52 ends where 4.5:1 with white is first met, a
 * saturated mid-blue. At AAA a fill that carries white text has to be dark enough to clear
 * 7:1, which puts the primary near 45, and destructive, success and info follow it down.
 * Warning goes the other way at both levels: an amber dark enough for white text is a brown,
 * so it stays light and takes near-black text instead.
 */
export const LIGHT_FILLS: Record<ContrastLevel, Fills> = {
  AA: {
    key: 52,
    keyText: 99,
    status: { destructive: 56, info: 54, success: 52, warning: 84 },
    statusText: { destructive: 99, info: 99, success: 99, warning: 18 },
  },
  AAA: {
    key: 45,
    keyText: 99,
    status: { destructive: 46, info: 45, success: 45, warning: 84 },
    statusText: { destructive: 99, info: 99, success: 99, warning: 18 },
  },
}

/**
 * Sets the dark fills per level.
 *
 * At AA the fill carries white text on a saturated colour, as in light, and the walk from 60
 * lands near 52 for a blue. At AAA the fills are bright with near-black labels, the inverse
 * of light, which keeps both sides at the same ratio. Warning keeps its light amber and its
 * near-black label at both levels.
 */
export const DARK_FILLS: Record<ContrastLevel, Fills> = {
  AA: {
    key: 60,
    keyText: 98,
    status: { destructive: 60, info: 60, success: 56, warning: 82 },
    statusText: { destructive: 98, info: 98, success: 98, warning: 18 },
  },
  AAA: {
    key: 70,
    keyText: 16,
    status: { destructive: 72, info: 72, success: 72, warning: 82 },
    statusText: { destructive: 16, info: 16, success: 16, warning: 18 },
  },
}

/**
 * Picks the ladder a mode reads from.
 *
 * @param {ThemeMode} which - The mode.
 * @returns {Ladder} The ladder for that mode.
 */
export function ladderFor(which: ThemeMode): Ladder {
  return which === 'dark' ? DARK : LIGHT
}

/**
 * Picks the fills a mode starts from, at the level the recipe asked for.
 *
 * @param {ThemeMode} which - The mode.
 * @param {ContrastLevel} level - The floor the fills have to clear.
 * @returns {Fills} The fills for that mode and level.
 */
export function fillsFor(which: ThemeMode, level: ContrastLevel): Fills {
  return (which === 'dark' ? DARK_FILLS : LIGHT_FILLS)[level]
}
