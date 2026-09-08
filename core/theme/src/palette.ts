/**
 * @fileoverview Turns a resolved recipe into every token, in both modes. Both modes come out
 * of the same tones, so a theme cannot drift between them: change the primary and every
 * surface, ring and sidebar accent that derives from it moves with it. The resolver has
 * already read every tone and merged every ladder, so nothing here reads a default.
 */

import { completeTokens } from '#assert.ts'
import { type Outcome, RATIOS } from '#ladder.ts'
import { type Resolved } from '#resolve.ts'
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
 * @param {Resolved} theme - The resolved recipe.
 * @param {ThemeMode} which - The mode.
 * @returns {string} The page as `oklch()`.
 */
function pageOf(theme: Resolved, which: ThemeMode): string {
  const { ladder, surface } = theme.color
  return oklch(ladder[which].page, surface.chroma, surface.hue)
}

/**
 * Sits a surface a number of points from the page, and no further than white or black.
 *
 * Every surface is placed against the page rather than at a lightness of its own, so a theme
 * that moves its page carries its cards, its panels, its edges and its sidebar with it. The
 * lift is signed, because a card rises towards white on paper while a muted panel recedes
 * from it, and in dark both go the other way.
 *
 * @param {Resolved} theme - The resolved recipe.
 * @param {ThemeMode} which - The mode.
 * @param {number} lift - How far from the page the surface sits, in points of lightness.
 * @returns {number} The surface's lightness, 0 to 100.
 */
function raised(theme: Resolved, which: ThemeMode, lift: number): number {
  return Math.min(100, Math.max(0, theme.color.ladder[which].page + lift))
}

/**
 * Reads the card's lightness: the page, lifted by however far this theme lifts a card.
 *
 * @param {Resolved} theme - The resolved recipe.
 * @param {ThemeMode} which - The mode.
 * @returns {number} The card's lightness, 0 to 100.
 */
function cardLightness(theme: Resolved, which: ThemeMode): number {
  return raised(theme, which, theme.color.ladder[which].cardLift)
}

/**
 * Writes the card's colour, which a field's outline is solved against and the glass is built
 * on.
 *
 * @param {Resolved} theme - The resolved recipe.
 * @param {ThemeMode} which - The mode.
 * @returns {string} The card as `oklch()`.
 */
function cardOf(theme: Resolved, which: ThemeMode): string {
  const { surface } = theme.color
  return oklch(cardLightness(theme, which), surface.chroma * 0.8, surface.hue)
}

/**
 * Solves a tone as text on the page.
 *
 * It is AAA whatever level the fills were asked for, because this is text. The walk starts at
 * a mid-tone and moves away from the page, so in light it ends as a deep colour and in dark
 * as a bright one, each the first lightness that clears.
 *
 * @param {Resolved} theme - The resolved recipe.
 * @param {ThemeMode} which - The mode.
 * @param {number} hue - The tone's hue.
 * @param {number} chroma - The tone's chroma.
 * @returns {string} The tone as `oklch()`.
 */
function inkOn(theme: Resolved, which: ThemeMode, hue: number, chroma: number): string {
  const start = which === 'dark' ? 75 : 45
  return solveContrast({ chroma, hue, lightness: start }, pageOf(theme, which))
}

/**
 * Solves the text that sits on a fill, moving the text rather than the fill.
 *
 * @param {Resolved} theme - The resolved recipe.
 * @param {ThemeMode} which - The mode.
 * @param {string} fill - The colour the text sits on.
 * @returns {string} The text colour as `oklch()`, at AAA against the fill.
 */
function textOn(theme: Resolved, which: ThemeMode, fill: string): string {
  const { ladder, neutral } = theme.color
  return solveContrast(
    { chroma: neutral.chroma * 2, hue: neutral.hue, lightness: ladder[which].text },
    fill,
  )
}

/**
 * Builds the page, card and popover surfaces, and the text on each.
 *
 * Every raised surface is the page lifted by however far this theme lifts it, so a theme that
 * moves its page carries its cards and its popovers with it and a theme that wants them flush
 * states a lift of nothing. In dark a popover sits above a card, because a menu opened over
 * one at the same lightness had only its hairline to show it was in front; in light both
 * reach white and the shadow does that work.
 *
 * @param {Resolved} theme - The resolved recipe.
 * @param {ThemeMode} which - The mode.
 * @returns {Record<string, string>} The surface tokens.
 */
function surfaces(theme: Resolved, which: ThemeMode): Record<string, string> {
  const { ladder, surface } = theme.color
  const rung = ladder[which]
  const lift = raised(theme, which, rung.popoverLift)

  return {
    background: oklch(rung.page, surface.chroma, surface.hue),
    card: cardOf(theme, which),
    'card-foreground': oklch(rung.text, surface.chroma, surface.hue),
    foreground: oklch(rung.text, surface.chroma, surface.hue),
    popover: oklch(lift, surface.chroma * 0.8, surface.hue),
    'popover-foreground': oklch(rung.text, surface.chroma, surface.hue),
  }
}

/**
 * Builds the emphasis levels, from the primary down to muted. `secondary` is `muted` under
 * the name shadcn's components ask for, so a component written against either reads the same
 * surface.
 *
 * On the muted surface the label moves rather than the fill: a muted surface is defined by
 * being close to the page, so darkening it would defeat the token.
 *
 * @param {Resolved} theme - The resolved recipe.
 * @param {ThemeMode} which - The mode.
 * @returns {Record<string, string>} The emphasis tokens.
 */
function emphasis(theme: Resolved, which: ThemeMode): Record<string, string> {
  const { accent, contrast, fills, ladder, neutral, primary } = theme.color
  const rung = ladder[which]
  const fill = fills[which]
  const surface = oklch(raised(theme, which, rung.accentLift), accent.chroma, accent.hue)

  return {
    accent: surface,
    'accent-foreground': solveContrast(
      { chroma: neutral.chroma * 2, hue: accent.hue, lightness: rung.accentText },
      surface,
    ),
    muted: oklch(raised(theme, which, rung.mutedLift), neutral.chroma * 2, neutral.hue),
    'muted-foreground': solveContrast(
      { chroma: neutral.chroma * 2, hue: neutral.hue, lightness: rung.mutedText },
      oklch(raised(theme, which, rung.mutedLift), neutral.chroma * 2, neutral.hue),
    ),
    primary: solveContrast(
      { chroma: primary.chroma, hue: primary.hue, lightness: fill.key },
      oklch(fill.keyText, neutral.chroma, primary.hue),
      RATIOS[contrast],
    ),
    'primary-foreground': oklch(fill.keyText, neutral.chroma, primary.hue),
    'primary-ink': inkOn(theme, which, primary.hue, primary.chroma),
    secondary: oklch(raised(theme, which, rung.mutedLift), neutral.chroma * 2, neutral.hue),
    'secondary-foreground': oklch(rung.accentText, neutral.chroma * 2, neutral.hue),
  }
}

/**
 * Builds one outcome: its fill, the text on it, and the outcome as ink on the page.
 *
 * An outcome carries the contract's own chroma rather than the theme's, so a warning reads
 * as a warning in every product whatever brand it sits under.
 *
 * @param {Resolved} theme - The resolved recipe.
 * @param {ThemeMode} which - The mode.
 * @param {Outcome} name - The outcome, which its three tokens are named after.
 * @returns {Record<string, string>} The fill, the text on it and the ink on the page.
 */
function outcome(theme: Resolved, which: ThemeMode, name: Outcome): Record<string, string> {
  const { contrast, fills, neutral, status } = theme.color
  const hue = status[name]
  const fill = fills[which]
  const label = oklch(fill.statusText[name], neutral.chroma * 2.5, hue)
  const solved = solveContrast(
    { chroma: name === 'destructive' ? 0.2 : 0.15, hue, lightness: fill.status[name] },
    label,
    RATIOS[contrast],
  )
  const ink = inkOn(theme, which, hue, name === 'destructive' ? 0.18 : 0.14)

  return Object.fromEntries([
    [name, solved],
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
 * @param {Resolved} theme - The resolved recipe.
 * @param {ThemeMode} which - The mode.
 * @returns {Record<string, string>} The status and outline tokens.
 */
function statusAndOutline(theme: Resolved, which: ThemeMode): Record<string, string> {
  const { fills, ladder, neutral, primary } = theme.color
  const rung = ladder[which]

  return {
    border: oklch(raised(theme, which, rung.borderLift), neutral.chroma * 2, neutral.hue),
    ...outcome(theme, which, 'destructive'),
    ...outcome(theme, which, 'info'),
    input: solveContrast(
      { chroma: neutral.chroma * 2, hue: neutral.hue, lightness: rung.input },
      cardOf(theme, which),
      RATIOS.UI,
    ),
    ring: solveContrast(
      { chroma: primary.chroma, hue: primary.hue, lightness: fills[which].key },
      pageOf(theme, which),
      RATIOS.UI,
    ),
    ...outcome(theme, which, 'success'),
    ...outcome(theme, which, 'warning'),
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
 * @param {Resolved} theme - The resolved recipe.
 * @param {ThemeMode} which - The mode.
 * @returns {Record<string, string>} The eight syntax tokens.
 */
function syntax(theme: Resolved, which: ThemeMode): Record<string, string> {
  const { ladder, neutral } = theme.color
  const surface = oklch(
    raised(theme, which, ladder[which].mutedLift),
    neutral.chroma * 2,
    neutral.hue,
  )
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
    'code-comment': solved(CODE_HUES.comment, neutral.chroma * 2),
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
 * The sidebar's ring is solved to 3:1 against the sidebar, as the page's ring is against the
 * page, because a focus ring on the sidebar has to be found there.
 *
 * @param {Resolved} theme - The resolved recipe.
 * @param {ThemeMode} which - The mode.
 * @returns {Record<string, string>} The chart and sidebar tokens.
 */
function chartAndSidebar(theme: Resolved, which: ThemeMode): Record<string, string> {
  const { chart, contrast, fills, ladder, neutral, primary, status } = theme.color
  const rung = ladder[which]
  const fill = fills[which]
  const series = Object.fromEntries(
    chart.map((hue, index) => [`chart-${String(index + 1)}`, oklch(rung.chart, 0.15, hue)]),
  )

  return {
    ...series,
    'chart-caution': oklch(rung.chart + 12, 0.14, status.warning),
    'chart-negative': oklch(rung.chart + 4, 0.17, status.destructive),
    'chart-positive': oklch(rung.chart + 6, 0.13, status.success),
    sidebar: oklch(raised(theme, which, rung.sidebarLift), neutral.chroma, neutral.hue),
    'sidebar-accent': oklch(
      raised(theme, which, rung.sidebarAccentLift),
      neutral.chroma * 3,
      neutral.hue,
    ),
    'sidebar-accent-foreground': oklch(rung.accentText, neutral.chroma * 2, neutral.hue),
    'sidebar-border': oklch(
      raised(theme, which, rung.sidebarBorderLift),
      neutral.chroma * 2,
      neutral.hue,
    ),
    'sidebar-foreground': oklch(rung.sidebarText, neutral.chroma * 2, neutral.hue),
    'sidebar-primary': solveContrast(
      { chroma: primary.chroma, hue: primary.hue, lightness: fill.key },
      oklch(fill.keyText, neutral.chroma, primary.hue),
      RATIOS[contrast],
    ),
    'sidebar-primary-foreground': oklch(fill.keyText, neutral.chroma, primary.hue),
    'sidebar-ring': solveContrast(
      { chroma: primary.chroma, hue: primary.hue, lightness: fill.key },
      oklch(raised(theme, which, rung.sidebarLift), neutral.chroma, neutral.hue),
      RATIOS.UI,
    ),
  }
}

/**
 * Builds the effects a page draws over itself, and the two colours every shadow mixes from.
 *
 * The scrim is the theme's ink at an opacity the mode allows, so a dialog on a dark page
 * still has a scrim. Selected and highlighted text is still text, so each carries a
 * foreground solved to AAA against its fill. The shadow ink carries the opacity of the
 * largest step, and every step takes a share of it in the stylesheet; the highlight along a
 * raised edge is transparent in light, where the shadow does that work. The glass is the card
 * at the alpha the mode allows, so it lifts off whatever page the recipe named.
 *
 * @param {Resolved} theme - The resolved recipe.
 * @param {ThemeMode} which - The mode.
 * @returns {Record<string, string>} The effect and shadow tokens.
 */
function effects(theme: Resolved, which: ThemeMode): Record<string, string> {
  const { ladder, neutral, primary, status, surface } = theme.color
  const rung = ladder[which]
  const selection = oklch(rung.selection, primary.chroma * 0.5, primary.hue)
  const highlight = oklch(rung.highlight, 0.12, status.warning)

  return {
    glass: oklch(cardLightness(theme, which), surface.chroma * 0.8, surface.hue, rung.glassAlpha),
    'glass-border': oklch(rung.text, neutral.chroma, neutral.hue, rung.glassBorderAlpha),
    highlight,
    'highlight-foreground': textOn(theme, which, highlight),
    overlay: oklch(rung.overlay, neutral.chroma * 2, neutral.hue, rung.overlayAlpha),
    selection,
    'selection-foreground': textOn(theme, which, selection),
    shadow: oklch(rung.shadow, 0.08, neutral.hue, rung.shadowAlpha),
    'shadow-highlight':
      which === 'dark' ? oklch(98, 0.005, neutral.hue, rung.shadowHighlightAlpha) : 'transparent',
  }
}

/**
 * Builds the three gradient stops and the colour a glow is thrown in.
 *
 * The stops share one lightness and differ only in hue, walking the short way round from the
 * primary to the accent, so the band reads as a gradient rather than as a fade. The glow is
 * the primary at the mode's glow lightness, carrying the alpha its largest step takes.
 *
 * @param {Resolved} theme - The resolved recipe.
 * @param {ThemeMode} which - The mode.
 * @returns {Record<string, string>} The gradient and glow tokens.
 */
function gradient(theme: Resolved, which: ThemeMode): Record<string, string> {
  const { accent, ladder, primary } = theme.color
  const rung = ladder[which]
  const apart = ((accent.hue - primary.hue + 540) % 360) - 180

  return {
    glow: oklch(rung.glow, primary.chroma, primary.hue, rung.glowAlpha),
    'gradient-1': oklch(rung.gradient, primary.chroma, primary.hue),
    'gradient-2': oklch(rung.gradient, primary.chroma, primary.hue + apart / 2),
    'gradient-3': oklch(rung.gradient, primary.chroma, accent.hue),
  }
}

/**
 * Builds the three families and the one radius.
 *
 * @param {Resolved} theme - The resolved recipe.
 * @returns {Record<string, string>} The scalar tokens.
 */
function scalars(theme: Resolved): Record<string, string> {
  return {
    'font-display': theme.font.display,
    'font-mono': theme.font.mono,
    'font-sans': theme.font.sans,
    radius: theme.radius,
  }
}

/**
 * Builds every token for one mode.
 *
 * @param {Resolved} theme - The resolved recipe.
 * @param {ThemeMode} which - The mode.
 * @returns {Record<TokenName, string>} Every token the contract names.
 */
function tokensFor(theme: Resolved, which: ThemeMode): Record<TokenName, string> {
  return completeTokens({
    ...surfaces(theme, which),
    ...emphasis(theme, which),
    ...statusAndOutline(theme, which),
    ...chartAndSidebar(theme, which),
    ...syntax(theme, which),
    ...effects(theme, which),
    ...gradient(theme, which),
    ...scalars(theme),
    ...theme.color.stated[which],
  })
}

/**
 * Turns a resolved recipe into a complete theme.
 *
 * A token the theme stated itself lands over the solved one, so the label on that fill, the
 * ring around it and the ink beside it still follow the recipe. The stated value is measured
 * like a solved one, by `assertReadable`.
 *
 * @param {Resolved} theme - The resolved recipe.
 * @returns {ThemeValues} Every token, in both modes.
 */
export function buildPalette(theme: Resolved): ThemeValues {
  return { dark: tokensFor(theme, 'dark'), light: tokensFor(theme, 'light') }
}
