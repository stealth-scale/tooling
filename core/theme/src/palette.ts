/**
 * @fileoverview Turns a recipe into every token, in both modes. Both modes come out of the
 * same hues, so a theme cannot drift between them: change the primary hue and every surface,
 * ring and sidebar accent that derives from it moves with it.
 */

import { completeTokens } from '#assert.ts'
import { fillsFor, ladderFor, type Outcome, RATIOS } from '#ladder.ts'
import {
  chromaOf,
  DEFAULT_FONTS,
  levelOf,
  pageLightness,
  type PaletteRecipe,
  statusHues,
  surfaceHue,
  surfaceTint,
  tintOf,
} from '#recipe.ts'
import { oklch, solveContrast } from '#solve.ts'
import { type ThemeMode, type ThemeValues, type TokenName } from '#tokens.ts'

/**
 * Sets the hue each syntax role carries, 0 to 360.
 *
 * These are fixed rather than derived from the recipe, for the same reason the chart tones
 * are: they are learned relationships. A reader who has seen one editor expects strings
 * green and comments grey, and a theme that reassigns them by brand hue makes every snippet
 * in the product harder to read than one on a stranger's blog. A diff's green and a string's
 * green have to be told apart, because a diff fence shows both the moment an inserted line
 * contains a string literal.
 */
const CODE_HUES = {
  comment: 250,
  deleted: 25,
  function: 265,
  inserted: 140,
  keyword: 305,
  number: 45,
  string: 165,
  type: 200,
} as const

/**
 * Writes the page's colour, which every ink is solved against.
 *
 * @param {PaletteRecipe} recipe - The theme's recipe.
 * @param {ThemeMode} which - The mode.
 * @returns {string} The page as `oklch()`.
 */
function pageOf(recipe: PaletteRecipe, which: ThemeMode): string {
  return oklch(pageLightness(recipe, which), surfaceTint(recipe), surfaceHue(recipe))
}

/**
 * Writes the card's colour, which a field's outline is solved against.
 *
 * @param {PaletteRecipe} recipe - The theme's recipe.
 * @param {ThemeMode} which - The mode.
 * @returns {string} The card as `oklch()`.
 */
function cardOf(recipe: PaletteRecipe, which: ThemeMode): string {
  const step = pageLightness(recipe, which) + (which === 'dark' ? 4 : 3)
  return oklch(step, surfaceTint(recipe) * 0.8, surfaceHue(recipe))
}

/**
 * Solves a tone as text on the page.
 *
 * It is AAA whatever level the fills were asked for, because this is text. The walk starts at
 * a mid-tone and moves away from the page, so in light it ends as a deep colour and in dark
 * as a bright one, each the first lightness that clears.
 *
 * @param {PaletteRecipe} recipe - The theme's recipe.
 * @param {ThemeMode} which - The mode.
 * @param {number} hue - The tone's hue.
 * @param {number} chroma - The tone's chroma.
 * @returns {string} The tone as `oklch()`.
 */
function inkOn(recipe: PaletteRecipe, which: ThemeMode, hue: number, chroma: number): string {
  const start = which === 'dark' ? 75 : 45
  return solveContrast({ chroma, hue, lightness: start }, pageOf(recipe, which))
}

/**
 * Solves the text that sits on a fill, moving the text rather than the fill.
 *
 * @param {PaletteRecipe} recipe - The theme's recipe.
 * @param {ThemeMode} which - The mode.
 * @param {string} fill - The colour the text sits on.
 * @returns {string} The text colour as `oklch()`, at AAA against the fill.
 */
function textOn(recipe: PaletteRecipe, which: ThemeMode, fill: string): string {
  const { text } = ladderFor(which)
  return solveContrast({ chroma: tintOf(recipe) * 2, hue: recipe.neutral, lightness: text }, fill)
}

/**
 * Builds the page, card and popover surfaces, and the text on each.
 *
 * A raised surface moves away from the page, and which way that is depends on the mode:
 * lighter than an off-white page, lighter again than a near-black one. In dark a popover
 * sits one rung above a card rather than on the same one, because a menu opened over a card
 * at the same lightness had only its hairline to show it was in front. In light both are
 * white and the shadow does that work.
 *
 * @param {PaletteRecipe} recipe - The theme's recipe.
 * @param {ThemeMode} which - The mode.
 * @returns {Record<string, string>} The surface tokens.
 */
function surfaces(recipe: PaletteRecipe, which: ThemeMode): Record<string, string> {
  const neutral = surfaceHue(recipe)
  const tint = surfaceTint(recipe)
  const ladder = ladderFor(which)
  const page = pageLightness(recipe, which)
  const lift = which === 'dark' ? page + 7 : page + 3
  return {
    background: oklch(page, tint, neutral),
    card: cardOf(recipe, which),
    'card-foreground': oklch(ladder.text, tint, neutral),
    foreground: oklch(ladder.text, tint, neutral),
    popover: oklch(lift, tint * 0.8, neutral),
    'popover-foreground': oklch(ladder.text, tint, neutral),
  }
}

/**
 * Builds the four emphasis levels, from the primary down to muted.
 *
 * On the muted surface the label moves rather than the fill: a muted surface is defined by
 * being close to the page, so darkening it would defeat the token.
 *
 * @param {PaletteRecipe} recipe - The theme's recipe.
 * @param {ThemeMode} which - The mode.
 * @returns {Record<string, string>} The emphasis tokens.
 */
function emphasis(recipe: PaletteRecipe, which: ThemeMode): Record<string, string> {
  const { accent, neutral, primary } = recipe
  const chroma = chromaOf(recipe)
  const tint = tintOf(recipe)
  const ladder = ladderFor(which)
  const fills = fillsFor(which, levelOf(recipe))
  return {
    accent: oklch(ladder.accent, tint * 4, accent),
    'accent-foreground': solveContrast(
      { chroma: tint * 2, hue: accent, lightness: ladder.accentText },
      oklch(ladder.accent, tint * 4, accent),
    ),
    muted: oklch(ladder.muted, tint * 2, neutral),
    'muted-foreground': solveContrast(
      { chroma: tint * 2, hue: neutral, lightness: ladder.mutedText },
      oklch(ladder.muted, tint * 2, neutral),
    ),
    primary: solveContrast(
      { chroma, hue: primary, lightness: fills.key },
      oklch(fills.keyText, tint, primary),
      RATIOS[levelOf(recipe)],
    ),
    'primary-foreground': oklch(fills.keyText, tint, primary),
    'primary-ink': inkOn(recipe, which, primary, chroma),
    secondary: oklch(ladder.muted, tint * 2, neutral),
    'secondary-foreground': oklch(ladder.accentText, tint * 2, neutral),
  }
}

/**
 * Builds one outcome: its fill, the text on it, and the outcome as ink on the page.
 *
 * @param {PaletteRecipe} recipe - The theme's recipe.
 * @param {ThemeMode} which - The mode.
 * @param {Outcome} name - The outcome, which its three tokens are named after.
 * @param {number} hue - Where on the wheel the outcome sits, in degrees.
 * @returns {Record<string, string>} The fill, the text on it and the ink on the page.
 */
function outcome(
  recipe: PaletteRecipe,
  which: ThemeMode,
  name: Outcome,
  hue: number,
): Record<string, string> {
  const fills = fillsFor(which, levelOf(recipe))
  const label = oklch(fills.statusText[name], 0.02, hue)
  const fill = solveContrast(
    { chroma: name === 'destructive' ? 0.2 : 0.15, hue, lightness: fills.status[name] },
    label,
    RATIOS[levelOf(recipe)],
  )
  const ink = inkOn(recipe, which, hue, name === 'destructive' ? 0.18 : 0.14)
  return Object.fromEntries([
    [name, fill],
    [`${name}-foreground`, label],
    [`${name}-ink`, ink],
  ])
}

/**
 * Builds the four outcomes and the three edges.
 *
 * The field outline and the focus ring are solved to 3:1, the input against the card it sits
 * on and the ring against the page, because WCAG 1.4.11 holds a control's boundary to that
 * floor. The border stays a hairline: it separates surfaces and identifies nothing.
 *
 * @param {PaletteRecipe} recipe - The theme's recipe.
 * @param {ThemeMode} which - The mode.
 * @returns {Record<string, string>} The status and outline tokens.
 */
function statusAndOutline(recipe: PaletteRecipe, which: ThemeMode): Record<string, string> {
  const { neutral, primary } = recipe
  const tint = tintOf(recipe)
  const ladder = ladderFor(which)
  const fills = fillsFor(which, levelOf(recipe))
  const hues = statusHues(recipe)
  return {
    border: oklch(ladder.border, tint * 2, neutral),
    ...outcome(recipe, which, 'destructive', hues.destructive),
    ...outcome(recipe, which, 'info', hues.info),
    input: solveContrast(
      { chroma: tint * 2, hue: neutral, lightness: ladder.input },
      cardOf(recipe, which),
      RATIOS.UI,
    ),
    ring: solveContrast(
      { chroma: chromaOf(recipe), hue: primary, lightness: fills.key },
      pageOf(recipe, which),
      RATIOS.UI,
    ),
    ...outcome(recipe, which, 'success', hues.success),
    ...outcome(recipe, which, 'warning', hues.warning),
  }
}

/**
 * Builds the syntax colours, solved against the surface a code block actually sits on.
 *
 * Every one of these is text on `muted` and never on the page, so that is what the contrast
 * is solved for. Solving against `background` is how a palette passes its own audit and
 * still fails in the only place it is used. A comment is solved to the same ratio as
 * everything else and made recessive by chroma and by the italic the component draws it in,
 * rather than by being harder to read.
 *
 * @param {PaletteRecipe} recipe - The theme's recipe.
 * @param {ThemeMode} which - The mode.
 * @returns {Record<string, string>} The eight syntax tokens.
 */
function syntax(recipe: PaletteRecipe, which: ThemeMode): Record<string, string> {
  const ladder = ladderFor(which)
  const tint = tintOf(recipe)
  const surface = oklch(ladder.muted, tint * 2, recipe.neutral)
  const start = which === 'light' ? 45 : 78

  /**
   * Solves one role against the muted surface.
   *
   * @param {number} hue - The role's hue.
   * @param {number} [chroma] - The role's chroma. Default: 0.15.
   * @returns {string} The colour as `oklch()`.
   */
  const solved = (hue: number, chroma = 0.15): string =>
    solveContrast({ chroma, hue, lightness: start }, surface)

  return {
    'code-comment': solved(CODE_HUES.comment, tint * 2),
    'code-deleted': solved(CODE_HUES.deleted, 0.17),
    'code-function': solved(CODE_HUES.function),
    'code-inserted': solved(CODE_HUES.inserted, 0.13),
    'code-keyword': solved(CODE_HUES.keyword),
    'code-number': solved(CODE_HUES.number, 0.14),
    'code-string': solved(CODE_HUES.string, 0.13),
    'code-type': solved(CODE_HUES.type),
  }
}

/**
 * Builds the five series colours and the sidebar's own plane.
 *
 * The chart tones are the outcome hues at the series' lightness. The status fills themselves
 * will not do, because those are built to carry white text and as an arc they read muddy.
 *
 * @param {PaletteRecipe} recipe - The theme's recipe.
 * @param {ThemeMode} which - The mode.
 * @returns {Record<string, string>} The chart and sidebar tokens.
 */
function chartAndSidebar(recipe: PaletteRecipe, which: ThemeMode): Record<string, string> {
  const { chart, neutral, primary } = recipe
  const chroma = chromaOf(recipe)
  const tint = tintOf(recipe)
  const ladder = ladderFor(which)
  const fills = fillsFor(which, levelOf(recipe))
  const hues = statusHues(recipe)
  const series = Object.fromEntries(
    chart.map((hue, index) => [`chart-${String(index + 1)}`, oklch(ladder.chart, 0.15, hue)]),
  )
  return {
    ...series,
    'chart-caution': oklch(ladder.chart + 12, 0.14, hues.warning),
    'chart-negative': oklch(ladder.chart + 4, 0.17, hues.destructive),
    'chart-positive': oklch(ladder.chart + 6, 0.13, hues.success),
    sidebar: oklch(ladder.sidebar, tint, neutral),
    'sidebar-accent': oklch(ladder.sidebarAccent, tint * 3, neutral),
    'sidebar-accent-foreground': oklch(ladder.accentText, tint * 2, neutral),
    'sidebar-border': oklch(ladder.sidebarBorder, tint * 2, neutral),
    'sidebar-foreground': oklch(ladder.sidebarText, tint * 2, neutral),
    'sidebar-primary': solveContrast(
      { chroma, hue: primary, lightness: fills.key },
      oklch(fills.keyText, tint, primary),
      RATIOS[levelOf(recipe)],
    ),
    'sidebar-primary-foreground': oklch(fills.keyText, tint, primary),
    'sidebar-ring': oklch(fills.key, chroma, primary),
  }
}

/**
 * Builds the effects a page draws over itself, and the two colours every shadow mixes from.
 *
 * The scrim is the theme's ink at an opacity the mode allows, so a dialog on a dark page
 * still has a scrim. Selected and highlighted text is still text, so each carries a
 * foreground solved to AAA against its fill. The shadow ink carries the opacity of the
 * largest step, and every step takes a share of it in the stylesheet; the highlight along a
 * raised edge is transparent in light, where the shadow does that work.
 *
 * @param {PaletteRecipe} recipe - The theme's recipe.
 * @param {ThemeMode} which - The mode.
 * @returns {Record<string, string>} The effect and shadow tokens.
 */
function effects(recipe: PaletteRecipe, which: ThemeMode): Record<string, string> {
  const { neutral, primary } = recipe
  const ladder = ladderFor(which)
  const hues = statusHues(recipe)
  const selection = oklch(ladder.selection, chromaOf(recipe) * 0.5, primary)
  const highlight = oklch(ladder.highlight, 0.12, hues.warning)
  const card = which === 'dark' ? ladder.page + 4 : ladder.page + 3
  return {
    glass: oklch(card, surfaceTint(recipe) * 0.8, surfaceHue(recipe), ladder.glassAlpha),
    'glass-border': oklch(ladder.text, tintOf(recipe), neutral, ladder.glassBorderAlpha),
    highlight,
    'highlight-foreground': textOn(recipe, which, highlight),
    overlay: oklch(ladder.overlay, tintOf(recipe) * 2, neutral, ladder.overlayAlpha),
    selection,
    'selection-foreground': textOn(recipe, which, selection),
    shadow: oklch(ladder.shadow, 0.08, neutral, ladder.shadowAlpha),
    'shadow-highlight':
      which === 'dark' ? oklch(98, 0.005, neutral, ladder.shadowHighlightAlpha) : 'transparent',
  }
}

/**
 * Builds the three gradient stops and the colour a glow is thrown in.
 *
 * The stops share one lightness and differ only in hue, walking the short way round from the
 * primary to the accent, so the band reads as a gradient rather than as a fade. The glow is
 * the primary at the mode's glow lightness, carrying the alpha its largest step takes.
 *
 * @param {PaletteRecipe} recipe - The theme's recipe.
 * @param {ThemeMode} which - The mode.
 * @returns {Record<string, string>} The gradient and glow tokens.
 */
function gradient(recipe: PaletteRecipe, which: ThemeMode): Record<string, string> {
  const { accent, primary } = recipe
  const chroma = chromaOf(recipe)
  const ladder = ladderFor(which)
  const apart = ((accent - primary + 540) % 360) - 180
  return {
    glow: oklch(ladder.glow, chroma, primary, ladder.glowAlpha),
    'gradient-1': oklch(ladder.gradient, chroma, primary),
    'gradient-2': oklch(ladder.gradient, chroma, primary + apart / 2),
    'gradient-3': oklch(ladder.gradient, chroma, accent),
  }
}

/**
 * Builds the two families and the one radius.
 *
 * @param {PaletteRecipe} recipe - The theme's recipe.
 * @returns {Record<string, string>} The scalar tokens.
 */
function scalars(recipe: PaletteRecipe): Record<string, string> {
  const fonts = recipe.fonts ?? DEFAULT_FONTS
  return { 'font-mono': fonts.mono, 'font-sans': fonts.sans, radius: recipe.radius ?? '0.5rem' }
}

/**
 * Builds every token for one mode.
 *
 * @param {PaletteRecipe} recipe - The theme's recipe.
 * @param {ThemeMode} which - The mode.
 * @returns {Record<TokenName, string>} Every token the contract names.
 */
function tokensFor(recipe: PaletteRecipe, which: ThemeMode): Record<TokenName, string> {
  return completeTokens({
    ...surfaces(recipe, which),
    ...emphasis(recipe, which),
    ...statusAndOutline(recipe, which),
    ...chartAndSidebar(recipe, which),
    ...syntax(recipe, which),
    ...effects(recipe, which),
    ...gradient(recipe, which),
    ...scalars(recipe),
  })
}

/**
 * Turns a recipe into a complete theme.
 *
 * @param {PaletteRecipe} recipe - The theme's recipe.
 * @returns {ThemeValues} Every token, in both modes.
 */
export function buildPalette(recipe: PaletteRecipe): ThemeValues {
  return { dark: tokensFor(recipe, 'dark'), light: tokensFor(recipe, 'light') }
}
