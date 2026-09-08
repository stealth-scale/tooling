/**
 * @fileoverview Names every token a theme defines. These are the values that differ between
 * one product and the next, and the ones a builder has to compute or check: a colour solved
 * for contrast, a shadow mixed from the theme's own ink. Every scale derives from them or is
 * fixed, and the design system's base stylesheet authors what neither a token nor a scale
 * can express, such as keyframes and densities.
 */

/**
 * Names the surfaces and the text that sits on each. A component asks for the pair,
 * `bg-card text-card-foreground`, and never mixes a fill from one pair with a label from
 * another, which is what keeps contrast the theme's decision.
 */
export const SURFACE_TOKENS = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
] as const

/**
 * Names the four emphasis levels every control is built from.
 *
 * `primary-ink` is the primary as text on the page, such as a link or the label of a soft
 * badge, solved to AAA against `background`. It is a separate token because the fill is
 * solved against its own label: a primary that carries white text at AA is too light to be
 * read as text on white.
 */
export const EMPHASIS_TOKENS = [
  'primary',
  'primary-foreground',
  'primary-ink',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
] as const

/**
 * Names the outcomes. `destructive` is shadcn's; `success`, `warning` and `info` exist
 * because a system that can only say "something went wrong" makes every other outcome look
 * like an error, and one that cannot say "something to know" dresses it as a warning.
 *
 * Each has an `-ink`: the outcome as text on the page, for a soft badge, an alert's words or
 * a delta that went the wrong way. It is solved to AAA against `background` in each mode,
 * which lets warning be a light amber fill with a dark label in light and still be readable
 * amber text in dark, with no component choosing per mode.
 */
export const STATUS_TOKENS = [
  'destructive',
  'destructive-foreground',
  'destructive-ink',
  'success',
  'success-foreground',
  'success-ink',
  'warning',
  'warning-foreground',
  'warning-ink',
  'info',
  'info-foreground',
  'info-ink',
] as const

/**
 * Names the edges. A border separates two surfaces, an input outlines a field and a ring marks
 * focus. The input and the ring are solved to 3:1 against the surface they sit on, which WCAG
 * 1.4.11 asks of any boundary a person needs to find a control; the border is decorative and
 * stays a hairline.
 */
export const OUTLINE_TOKENS = ['border', 'input', 'ring'] as const

/**
 * Names five series colours, in the order a chart assigns them, and three tones for a value
 * that carries a judgement.
 *
 * The series colours are not the emphasis colours: a series is data rather than a call to
 * action, and the two carry different weight on a screen. The tones are not the status
 * colours either, because `warning` is a surface built to hold white text, which as an arc
 * in a chart reads as brown.
 */
export const CHART_TOKENS = [
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'chart-positive',
  'chart-caution',
  'chart-negative',
] as const

/**
 * Names the syntax colour for the eight roles a tokeniser reports.
 *
 * These are the only colours in the system that have to be legible on `muted` rather than on
 * the page, because a code block sits on that surface, so a token solved against
 * `background` fails in the one place it is used. Eight roles rather than one per token
 * class: a tokeniser reports twenty and a reader distinguishes about six, and a colour per
 * class is a legend rather than a theme.
 */
export const CODE_TOKENS = [
  'code-comment',
  'code-keyword',
  'code-string',
  'code-number',
  'code-function',
  'code-type',
  'code-inserted',
  'code-deleted',
] as const

/**
 * Names the sidebar's own surface. A sidebar is usually a different plane from the page it
 * sits beside, and inheriting the page's surface is what makes it disappear.
 */
export const SIDEBAR_TOKENS = [
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
] as const

/**
 * Names the effects a page draws over itself.
 *
 * `overlay` is the scrim under a dialog, and it is a token because a black scrim at half
 * opacity disappears on a dark page. `selection` is what the browser paints behind selected
 * text, and `highlight` is a search match or a `<mark>`; both carry a foreground solved to
 * AAA, because selected and highlighted text is still text. `glass` and `glass-border` carry
 * the alpha their mode needs, because a translucent card that reads right on paper reads as
 * a smear on a near-black page.
 */
export const EFFECT_TOKENS = [
  'overlay',
  'selection',
  'selection-foreground',
  'highlight',
  'highlight-foreground',
  'glass',
  'glass-border',
] as const

/**
 * Names the three stops of the theme's own gradient, and the colour a glow is thrown in.
 *
 * The stops are tokens rather than a composition of `primary` and `accent`, because those two
 * sit at whatever lightness their contrast demanded. A band from a 45 per cent primary to a
 * 93 per cent accent is not a gradient, it is a fade to white. The three here sit at one
 * lightness and differ only in hue, which is what reads as a gradient.
 */
export const GRADIENT_TOKENS = ['gradient-1', 'gradient-2', 'gradient-3', 'glow'] as const

/**
 * Names the two colours every shadow is mixed from.
 *
 * `shadow` is the ink, with the opacity the mode allows, and every box, inset, drop and text
 * shadow takes a share of it. `shadow-highlight` is the light along the top edge of a raised
 * surface in dark mode, where a shadow is ink on ink and what reads as an edge is light
 * catching the top; in light it is transparent.
 */
export const SHADOW_TOKENS = ['shadow', 'shadow-highlight'] as const

/**
 * Names every colour a theme defines, in the order they are emitted.
 */
export const COLOR_TOKENS = [
  ...SURFACE_TOKENS,
  ...EMPHASIS_TOKENS,
  ...STATUS_TOKENS,
  ...OUTLINE_TOKENS,
  ...CHART_TOKENS,
  ...CODE_TOKENS,
  ...SIDEBAR_TOKENS,
  ...EFFECT_TOKENS,
  ...GRADIENT_TOKENS,
  ...SHADOW_TOKENS,
] as const

/**
 * Names a colour token.
 */
export type ColorToken = (typeof COLOR_TOKENS)[number]

/**
 * Names the one length a theme decides. Every radius step is a multiple of it.
 */
export const RADIUS_TOKENS = ['radius'] as const

/**
 * Names a geometry token.
 */
export type GeometryToken = (typeof RADIUS_TOKENS)[number]

/**
 * Names the two families a theme picks. The scale, the weights, tracking and leading are
 * the same in every theme: a scale is a reading decision, and a product that changes it has
 * a different rhythm rather than a different brand.
 */
export const FONT_TOKENS = ['font-sans', 'font-mono'] as const

/**
 * Names a typography token.
 */
export type TypographyToken = (typeof FONT_TOKENS)[number]

/**
 * Names any token a theme defines.
 */
export type TokenName = ColorToken | GeometryToken | TypographyToken

/**
 * Names the two modes every theme ships. There is no third, and no "auto" here.
 */
export type ThemeMode = 'dark' | 'light'

/**
 * Carries a complete theme: both modes, every token. A missing one is a type error at the
 * theme rather than a blank on one screen in dark mode.
 */
export type ThemeValues = Record<ThemeMode, Record<TokenName, string>>

/**
 * Lists both modes, in the order they are checked.
 */
export const MODES: readonly ThemeMode[] = ['dark', 'light']

/**
 * Lists every token, in the order they are emitted.
 */
export const REQUIRED_TOKENS: readonly TokenName[] = [
  ...COLOR_TOKENS,
  ...RADIUS_TOKENS,
  ...FONT_TOKENS,
]

/**
 * Lists the scalar tokens, which is everything a colour is not.
 */
export const SCALAR_TOKENS: readonly TokenName[] = [...RADIUS_TOKENS, ...FONT_TOKENS]
