/**
 * @fileoverview Draws a group of colour tokens as the current theme resolves them: a swatch
 * per token, and the chart series as the bars they colour.
 */

import { type JSX } from 'react'

import { CHART_TOKENS, type ColorToken } from '@stealthscale/core-theme'

import { type TokenGroup, tokensOf } from './groups.ts'
import { CAPTION, CORNER, GRID, HAIRLINE, MONO } from './styles.ts'
import { type CurrentTheme, Themed } from './theme.tsx'

/**
 * Describes one swatch.
 */
interface SwatchProps {
  /**
   * Names the token.
   */
  token: ColorToken

  /**
   * Carries the value the theme resolves it to.
   */
  value: string
}

/**
 * Draws one swatch: the colour, its name, and the value the theme resolved it to.
 *
 * @param {SwatchProps} props - The token and its value. `SwatchProps` documents every member.
 * @returns {JSX.Element} The colour, its name and its value, side by side.
 */
function Swatch({ token, value }: SwatchProps): JSX.Element {
  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: '0.75rem', minWidth: '16rem' }}>
      <div
        data-slot="swatch"
        style={{
          background: value,
          blockSize: '2.5rem',
          border: HAIRLINE,
          borderRadius: CORNER,
          flex: '0 0 auto',
          inlineSize: '2.5rem',
        }}
      />
      <div style={{ display: 'grid', gap: '0.125rem', minWidth: 0 }}>
        <code style={{ ...MONO, fontSize: '0.8125rem' }}>{token}</code>
        <span style={{ ...CAPTION, overflowWrap: 'anywhere' }}>{value}</span>
      </div>
    </div>
  )
}

/**
 * Describes which group of tokens to draw.
 */
export interface SwatchesProps {
  /**
   * Names the group, as the contract groups its tokens.
   */
  of: TokenGroup
}

/**
 * Draws every token of a group, as the current theme resolves it.
 *
 * @param {SwatchesProps} props - The group. `SwatchesProps` documents every member.
 * @returns {JSX.Element} One swatch per token, in the order the contract emits them.
 */
export function Swatches({ of }: SwatchesProps): JSX.Element {
  return (
    <Themed>
      {({ tokens }: CurrentTheme) => (
        <div style={{ ...GRID, gridTemplateColumns: 'repeat(auto-fill, minmax(16rem, 1fr))' }}>
          {tokensOf(of).map((token) => (
            <Swatch key={token} token={token} value={tokens[token]} />
          ))}
        </div>
      )}
    </Themed>
  )
}

/**
 * Draws the chart tokens as the bars they colour, side by side, so they can be told apart.
 *
 * Every bar is the same size. The page exists to compare five hues, and two colours are only
 * comparable at equal area: a bar drawn shorter than its neighbour reads as a lighter colour
 * whatever the token says.
 *
 * @returns {JSX.Element} One bar per token, all of one size, in the order a chart assigns them.
 */
export function Series(): JSX.Element {
  return (
    <Themed>
      {({ tokens }: CurrentTheme) => (
        <div
          style={{
            ...GRID,
            gap: '0.5rem',
            gridTemplateColumns: `repeat(${String(CHART_TOKENS.length)}, 1fr)`,
          }}
        >
          {CHART_TOKENS.map((token) => (
            <div key={token} style={{ display: 'grid', gap: '0.5rem' }}>
              <div
                data-slot="bar"
                style={{
                  background: tokens[token],
                  blockSize: '4rem',
                  borderRadius: CORNER,
                }}
              />
              <code style={{ ...MONO, overflowWrap: 'anywhere' }}>
                {token.replace('chart-', '')}
              </code>
              <span style={{ ...CAPTION, overflowWrap: 'anywhere' }}>{tokens[token]}</span>
            </div>
          ))}
        </div>
      )}
    </Themed>
  )
}
