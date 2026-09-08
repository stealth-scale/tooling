/**
 * @fileoverview Sets every step of every scale the system names, the same in every theme.
 * A step is derived from a token where one exists, so eight radii follow one `--radius` and
 * every shadow follows one ink, and it is fixed where nothing computes it, such as the type
 * scale. The emitter registers all of them and nulls each namespace first, so a utility
 * nothing here defines renders nothing rather than rendering Tailwind's default. The
 * densities hang off an attribute on the document rather than off a theme.
 */

/**
 * Carries one step of the type scale: the size, and the line height that goes with it.
 */
export interface TextStep {
  /**
   * Sets the line height in rem. The stylesheet writes it as a ratio of the size, which is
   * how Tailwind writes its own.
   */
  lineHeight: number

  /**
   * Sets the size in rem.
   */
  size: number
}

/**
 * Carries one layer of a shadow: its geometry, and how much of the ink it takes.
 */
export interface ShadowLayer {
  /**
   * Sets the share of the theme's shadow colour this layer takes, 0 to 100.
   */
  fraction: number

  /**
   * Sets the offsets, blur and spread, as CSS writes them.
   */
  geometry: string
}

/**
 * Sets the type scale, at Tailwind's steps and ratios.
 *
 * The scale is a reading decision and the same in every theme. A product that changes it has
 * a different rhythm rather than a different brand, so a theme picks families and nothing
 * else about type.
 */
export const TEXT: Readonly<Record<string, TextStep>> = {
  '2xl': { lineHeight: 2, size: 1.5 },
  '3xl': { lineHeight: 2.25, size: 1.875 },
  '4xl': { lineHeight: 2.5, size: 2.25 },
  '5xl': { lineHeight: 3, size: 3 },
  '6xl': { lineHeight: 3.75, size: 3.75 },
  '7xl': { lineHeight: 4.5, size: 4.5 },
  '8xl': { lineHeight: 6, size: 6 },
  '9xl': { lineHeight: 8, size: 8 },
  base: { lineHeight: 1.5, size: 1 },
  lg: { lineHeight: 1.75, size: 1.125 },
  sm: { lineHeight: 1.25, size: 0.875 },
  xl: { lineHeight: 1.75, size: 1.25 },
  xs: { lineHeight: 1, size: 0.75 },
}

/**
 * Sets each radius as a multiple of the theme's one `--radius`, at Tailwind's ratios, so a
 * theme cannot round a card and leave its buttons square.
 */
export const RADIUS: Readonly<Record<string, number>> = {
  '2xl': 2,
  '3xl': 3,
  '4xl': 4,
  lg: 1,
  md: 0.75,
  sm: 0.5,
  xl: 1.5,
  xs: 0.25,
}

/**
 * Sets each box shadow, at Tailwind's geometry, with every layer drawn from the theme's
 * shadow colour rather than from black.
 */
export const SHADOW: Readonly<Record<string, readonly ShadowLayer[]>> = {
  '2xl': [{ fraction: 100, geometry: '0 25px 50px -12px' }],
  '2xs': [{ fraction: 20, geometry: '0 1px' }],
  lg: [
    { fraction: 40, geometry: '0 10px 15px -3px' },
    { fraction: 40, geometry: '0 4px 6px -4px' },
  ],
  md: [
    { fraction: 40, geometry: '0 4px 6px -1px' },
    { fraction: 40, geometry: '0 2px 4px -2px' },
  ],
  sm: [
    { fraction: 40, geometry: '0 1px 3px 0' },
    { fraction: 40, geometry: '0 1px 2px -1px' },
  ],
  xl: [
    { fraction: 40, geometry: '0 20px 25px -5px' },
    { fraction: 40, geometry: '0 8px 10px -6px' },
  ],
  xs: [{ fraction: 20, geometry: '0 1px 2px 0' }],
}

/**
 * Sets each inset shadow, drawn from the theme's shadow colour. Each step is one layer, in
 * the shape the other shadow tables share.
 */
export const INSET_SHADOW: Readonly<Record<string, readonly ShadowLayer[]>> = {
  '2xs': [{ fraction: 20, geometry: 'inset 0 1px' }],
  sm: [{ fraction: 20, geometry: 'inset 0 2px 4px' }],
  xs: [{ fraction: 20, geometry: 'inset 0 1px 1px' }],
}

/**
 * Sets each drop shadow, for the filter, drawn from the theme's shadow colour.
 */
export const DROP_SHADOW: Readonly<Record<string, readonly ShadowLayer[]>> = {
  '2xl': [{ fraction: 60, geometry: '0 25px 25px' }],
  lg: [
    { fraction: 60, geometry: '0 10px 8px' },
    { fraction: 40, geometry: '0 4px 3px' },
  ],
  md: [
    { fraction: 40, geometry: '0 4px 3px' },
    { fraction: 60, geometry: '0 2px 2px' },
  ],
  sm: [{ fraction: 20, geometry: '0 1px 1px' }],
  xl: [
    { fraction: 60, geometry: '0 20px 13px' },
    { fraction: 40, geometry: '0 8px 5px' },
  ],
  xs: [{ fraction: 20, geometry: '0 1px 1px' }],
}

/**
 * Sets each text shadow, drawn from the theme's shadow colour.
 */
export const TEXT_SHADOW: Readonly<Record<string, readonly ShadowLayer[]>> = {
  '2xs': [{ fraction: 60, geometry: '0px 1px 0px' }],
  lg: [
    { fraction: 40, geometry: '0px 1px 2px' },
    { fraction: 40, geometry: '0px 3px 2px' },
    { fraction: 40, geometry: '0px 4px 8px' },
  ],
  md: [
    { fraction: 40, geometry: '0px 1px 1px' },
    { fraction: 40, geometry: '0px 1px 2px' },
    { fraction: 40, geometry: '0px 2px 4px' },
  ],
  sm: [
    { fraction: 30, geometry: '0px 1px 0px' },
    { fraction: 30, geometry: '0px 1px 1px' },
    { fraction: 30, geometry: '0px 2px 2px' },
  ],
  xs: [{ fraction: 80, geometry: '0px 1px 1px' }],
}

/**
 * Sets each glow, which is a shadow thrown in the theme's glow colour rather than its ink.
 *
 * A glow reads as light coming off a surface, so it has no offset and a wide blur, and it
 * joins the `--shadow-*` namespace under a `glow-` prefix so `shadow-glow-md` is a utility
 * like any other.
 */
export const GLOW: Readonly<Record<string, readonly ShadowLayer[]>> = {
  lg: [
    { fraction: 100, geometry: '0 0 48px -4px' },
    { fraction: 60, geometry: '0 0 16px -2px' },
  ],
  md: [
    { fraction: 90, geometry: '0 0 24px -2px' },
    { fraction: 50, geometry: '0 0 8px -1px' },
  ],
  sm: [{ fraction: 80, geometry: '0 0 12px -2px' }],
}

/**
 * Sets each perspective, at Tailwind's steps, for the 3D transforms a card effect uses.
 */
export const PERSPECTIVE: Readonly<Record<string, number>> = {
  distant: 1200,
  dramatic: 100,
  midrange: 800,
  near: 300,
  normal: 500,
}

/**
 * Sets each blur, in pixels, at Tailwind's steps.
 */
export const BLUR: Readonly<Record<string, number>> = {
  '2xl': 40,
  '3xl': 64,
  lg: 16,
  md: 12,
  sm: 8,
  xl: 24,
  xs: 4,
}

/**
 * Sets each letter spacing, in em.
 */
export const TRACKING: Readonly<Record<string, number>> = {
  normal: 0,
  tight: -0.025,
  tighter: -0.05,
  wide: 0.025,
  wider: 0.05,
  widest: 0.1,
}

/**
 * Sets each line height, as a ratio, for text that does not take the scale's own.
 */
export const LEADING: Readonly<Record<string, number>> = {
  loose: 2,
  none: 1,
  normal: 1.5,
  relaxed: 1.625,
  snug: 1.375,
  tight: 1.25,
}

/**
 * Sets each font weight.
 */
export const FONT_WEIGHT: Readonly<Record<string, number>> = {
  black: 900,
  bold: 700,
  extrabold: 800,
  extralight: 200,
  light: 300,
  medium: 500,
  normal: 400,
  semibold: 600,
  thin: 100,
}

/**
 * Sets each easing. The three are Tailwind's; `spring` overshoots and settles, for a control
 * that answers a press.
 */
export const EASE: Readonly<Record<string, string>> = {
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
}

/**
 * Sets each duration, in milliseconds. A ripple, a hover and a page all compose from these,
 * and a theme that wants a snappier or calmer product overrides the three rather than a
 * hundred transitions.
 */
export const DURATION: Readonly<Record<string, number>> = {
  fast: 100,
  normal: 200,
  slow: 350,
}

/**
 * Names the size steps a control comes in, smallest first, which is the order the stylesheet
 * writes them in.
 */
export const CONTROL_SIZES = ['xs', 'sm', 'md', 'lg'] as const

/**
 * Names one size step of a control.
 */
export type ControlSize = (typeof CONTROL_SIZES)[number]

/**
 * Sets each control step as a distance from the density's own height, in rem: four pixels
 * per step, two steps below the default and one above. A density is one length, and every
 * step follows it, the way every radius follows the one `--radius`.
 */
export const CONTROL_STEPS: Readonly<Record<ControlSize, number>> = {
  lg: 0.25,
  md: 0,
  sm: -0.25,
  xs: -0.5,
}

/**
 * Sets the focus ring's width in every density, in pixels. Two pixels is the perimeter the
 * enhanced focus appearance criterion asks for, and a ring that grew with the control would
 * be thinnest where controls sit closest together.
 */
export const FOCUS_WIDTH = 2

/**
 * Sets the two target sizes WCAG names, in pixels: the minimum every control clears in every
 * density, and the enhanced size a touch density clears at its default step and above.
 */
export const TARGET_SIZES = { enhanced: 44, minimum: 24 } as const

/**
 * Carries one density: the one length every control height follows, and where its focus
 * ring sits.
 */
export interface Density {
  /**
   * Sets the height of the default control, in rem. Every step derives from it.
   */
  control: number

  /**
   * Sets how far the focus ring sits outside the control, in pixels. Zero draws it flush,
   * for a density that packs controls edge to edge and has no room outside one.
   */
  focusOffset: number
}

/**
 * Names the density a page takes where nothing sets one.
 */
export const DEFAULT_DENSITY = 'comfortable'

/**
 * Sets each density: how closely controls are packed, and where the ring that marks one as
 * focused sits.
 *
 * Density is the one scale a product changes without becoming a different system: a tablet
 * build and a dense desktop table keep the same rhythm at a different size. It hangs off an
 * attribute rather than a build, so a region sets `data-density` to be denser or looser than
 * the page around it. `compact` puts the default control at 32 pixels, so its smallest still
 * clears the minimum target; `comfortable` puts it at 40, which a thumb finds without aiming;
 * `touch` puts it at 44, the enhanced target every mobile guideline sets as its floor.
 */
export const DENSITY: Readonly<Record<string, Density>> = {
  comfortable: { control: 2.5, focusOffset: 2 },
  compact: { control: 2, focusOffset: 0 },
  touch: { control: 2.75, focusOffset: 2 },
}

/**
 * Derives every control height of a density from its one length.
 *
 * @param {Density} density - The density to derive from, as `DENSITY` names it. Only its
 *     `control` length is read; the ring's offset belongs to the stylesheet.
 * @returns {Readonly<Record<ControlSize, number>>} Each step's height, in rem, every one of
 *     them a whole pixel.
 */
export function controlHeights({ control }: Density): Readonly<Record<ControlSize, number>> {
  return {
    lg: control + CONTROL_STEPS.lg,
    md: control + CONTROL_STEPS.md,
    sm: control + CONTROL_STEPS.sm,
    xs: control + CONTROL_STEPS.xs,
  }
}

/**
 * Names the namespaces the emitter nulls before it registers its own steps, so no default
 * of Tailwind's survives into a theme. Breakpoints and containers are not here: those are a
 * layout decision, the same for every theme, and the design system's base sets them.
 */
export const OWNED_NAMESPACES: readonly string[] = [
  'color',
  'font',
  'text',
  'font-weight',
  'tracking',
  'leading',
  'radius',
  'shadow',
  'inset-shadow',
  'drop-shadow',
  'text-shadow',
  'blur',
  'ease',
  'perspective',
  'height',
  'size',
]
