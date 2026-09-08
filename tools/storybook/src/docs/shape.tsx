/**
 * @fileoverview Draws the corners and the elevation the current theme resolves. Both derive
 * from one value of the theme's: every radius step is a multiple of its `--radius`, and every
 * shadow takes a share of its own ink, so a theme cannot round its cards and leave its buttons
 * square, and a theme that states a depth moves every step at once. The steps are drawn
 * smallest first, whatever order the table is written in.
 */

import { type JSX } from 'react'

import { boxShadowOf, bySize, glowOf, RADIUS, radiusOf } from '@stealthscale/core-theme'

import { CAPTION, CORNER, GRID, HAIRLINE } from './styles.ts'
import { type CurrentTheme, Themed } from './theme.tsx'

/**
 * Draws every radius step, each a multiple of the theme's one `--radius`.
 *
 * @returns {JSX.Element} The theme's radius, then one box per step, smallest first.
 */
export function Radii(): JSX.Element {
  const steps = Object.entries(RADIUS).toSorted(([, a], [, b]) => a - b)

  return (
    <Themed>
      {({ tokens }: CurrentTheme) => (
        <>
          <p style={{ ...CAPTION, fontSize: '0.8125rem' }}>
            This theme’s <code>--radius</code> is{' '}
            <strong data-slot="radius">{tokens.radius}</strong>.
          </p>
          <div style={{ ...GRID, gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))' }}>
            {steps.map(([step, factor]) => (
              <div data-slot="corner" key={step} style={{ display: 'grid', gap: '0.5rem' }}>
                <div
                  style={{
                    background: tokens.secondary,
                    blockSize: '4rem',
                    border: HAIRLINE,
                    borderRadius: radiusOf(factor),
                  }}
                />
                <div style={CAPTION}>
                  rounded-{step}
                  <br />
                  <span style={{ opacity: 0.7 }}>{radiusOf(factor)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Themed>
  )
}

/**
 * Draws every shadow step on a card, and every glow, each mixed from the theme's own ink.
 *
 * @returns {JSX.Element} One card per shadow step, then one per glow step.
 */
export function Shadows(): JSX.Element {
  return (
    <Themed>
      {({ tables, tokens }: CurrentTheme) => {
        const shadows = bySize(tables.shadow).map(([step, layers]) => [
          `shadow-${step}`,
          boxShadowOf(layers, tables.shadowRim[step]),
        ])
        const glows = bySize(tables.glow).map(([step, layers]) => [
          `shadow-glow-${step}`,
          glowOf(layers),
        ])

        return (
          <div
            style={{
              ...GRID,
              gap: '1.5rem',
              gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))',
            }}
          >
            {[...shadows, ...glows].map(([name, shadow]) => (
              <div data-slot="elevation" key={name} style={{ display: 'grid', gap: '0.5rem' }}>
                <div
                  style={{
                    background: tokens.card,
                    blockSize: '4rem',
                    borderRadius: CORNER,
                    boxShadow: shadow,
                  }}
                />
                <div style={CAPTION}>{name}</div>
              </div>
            ))}
          </div>
        )
      }}
    </Themed>
  )
}
