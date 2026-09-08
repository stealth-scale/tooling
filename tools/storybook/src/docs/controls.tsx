/**
 * @fileoverview Draws a control at every size the system names, at whatever density the
 * document is on, and measures each against the target size WCAG asks for. Every specimen
 * takes its height from the theme's own `--height-*`, so moving the Density toolbar moves what
 * is drawn rather than what is described.
 */

import { type CSSProperties, type JSX } from 'react'

import { CONTROL_SIZES, controlHeights, type Density, TARGET_SIZES } from '@stealthscale/core-theme'

import { BADGE, CAPTION, CORNER, GRID, HAIRLINE, MONO } from './styles.ts'
import { type CurrentTheme, Themed } from './theme.tsx'

/**
 * Sets how many pixels one rem is, which is what a target size is measured in.
 */
const ROOT_FONT_SIZE = 16

/**
 * Draws a control: the theme's own corner, its secondary surface, and the height the density
 * sets.
 */
const CONTROL: CSSProperties = {
  alignItems: 'center',
  background: 'var(--secondary)',
  border: HAIRLINE,
  borderRadius: CORNER,
  color: 'var(--secondary-foreground)',
  display: 'inline-flex',
  fontSize: '0.8125rem',
  justifyContent: 'center',
  paddingInline: '0.875rem',
}

/**
 * Names what a control's height clears.
 */
type Reached = 'enhanced' | 'minimum' | 'under'

/**
 * Names the target size a height reaches.
 *
 * @param {number} pixels - The control's height.
 * @returns {Reached} `enhanced` at 44px, `minimum` at 24px, and `under` below that.
 */
export function target(pixels: number): Reached {
  if (pixels >= TARGET_SIZES.enhanced) return 'enhanced'
  if (pixels >= TARGET_SIZES.minimum) return 'minimum'
  return 'under'
}

/**
 * Reads the density the document is on, falling back to the one the theme opens with.
 *
 * @param {CurrentTheme} theme - The theme the document is drawn in.
 * @returns {Density | undefined} The density, or nothing where the theme has none by that
 *     name and none by its own default either.
 */
function densityOf(theme: CurrentTheme): Density | undefined {
  const { density, tables } = theme
  return tables.density[density] ?? tables.density[tables.defaultDensity]
}

/**
 * Draws every control size at the density the document is on, with what each one measures.
 *
 * A control's height is the one length the density sets, and every step derives from it four
 * pixels apart. The specimen reads `--height-*` rather than a number, so what is drawn is what
 * a component would draw; the caption reads the theme's own table, so the two disagreeing is
 * a defect the page shows.
 *
 * @returns {JSX.Element} One specimen per size, each with its height and the target it clears.
 */
export function Controls(): JSX.Element {
  return (
    <Themed>
      {(theme: CurrentTheme) => {
        const density = densityOf(theme)
        const heights = density === undefined ? undefined : controlHeights(density)

        return (
          <div style={{ display: 'grid', gap: '0.75rem', margin: '1.5rem 0' }}>
            <p style={{ ...CAPTION, fontSize: '0.8125rem' }}>
              Drawn at <strong data-slot="density">{theme.density}</strong>. Move the{' '}
              <strong>Density</strong> toolbar and every control here changes height.
            </p>
            <div
              style={{
                ...GRID,
                alignItems: 'end',
                gap: '1rem',
                gridTemplateColumns: 'repeat(auto-fill, minmax(9rem, 1fr))',
              }}
            >
              {CONTROL_SIZES.map((step) => {
                const pixels = Math.round((heights?.[step] ?? 0) * ROOT_FONT_SIZE)
                const reached = target(pixels)

                return (
                  <div
                    data-reached={reached}
                    data-slot="control"
                    key={step}
                    style={{ display: 'grid', gap: '0.5rem', justifyItems: 'start' }}
                  >
                    <span style={{ ...CONTROL, blockSize: `var(--height-${step})` }}>Save</span>
                    <code style={CAPTION}>size=&quot;{step}&quot;</code>
                    <span style={{ ...BADGE, ...MONO, fontSize: '0.75rem' }}>
                      {String(pixels)}px {reached}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      }}
    </Themed>
  )
}

/**
 * Draws the focus ring at the density the document is on.
 *
 * The ring's width is one number in every density, because a ring that grew with the control
 * would be thinnest where controls sit closest together. Its offset is the density's, since an
 * offset ring needs room outside the control to draw in and a packed layout has none.
 *
 * @returns {JSX.Element} One focused specimen, with the width and the offset it drew at.
 */
export function Focus(): JSX.Element {
  return (
    <Themed>
      {(theme: CurrentTheme) => (
        <div style={{ display: 'grid', gap: '0.75rem', justifyItems: 'start', margin: '1.5rem 0' }}>
          <span
            data-slot="focused"
            style={{
              ...CONTROL,
              blockSize: 'var(--height-md)',
              outline: 'var(--focus-width) solid var(--ring)',
              outlineOffset: 'var(--focus-offset)',
            }}
          >
            Focused
          </span>
          <span style={{ ...BADGE, ...MONO, fontSize: '0.75rem' }}>
            {String(theme.tables.focusWidth)}px ring, {String(densityOf(theme)?.focusOffset ?? 0)}px
            offset at {theme.density}
          </span>
        </div>
      )}
    </Themed>
  )
}
