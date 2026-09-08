/**
 * @fileoverview Draws a colour on the colour it is meant to be read on, with the ratio the two
 * measure against each other in the current theme and the floor it clears. Measured from the
 * solved values rather than read from a table, so it is true for the theme and the mode on
 * the toolbar right now.
 */

import { type JSX } from 'react'

import { type ColorToken, contrast, RATIOS } from '@stealthscale/core-theme'

import { BADGE, CAPTION, CORNER, GRID, HAIRLINE, MONO } from './styles.ts'
import { type CurrentTheme, Themed } from './theme.tsx'

/**
 * Names which success criterion a pair is read under, because the two set different floors
 * for the same conformance level.
 */
export type Criterion = 'edge' | 'text'

/**
 * Names the conformance level a ratio reaches, or that it reaches neither.
 */
export type Reached = 'AA' | 'AAA' | 'fails'

/**
 * Names the highest conformance level a ratio reaches under the criterion that applies to it.
 *
 * Text is read under 1.4.3, which sets AA at 4.5:1 and AAA at 7:1. A boundary is read under
 * 1.4.11, which sets one floor at 3:1 and is itself a Level AA criterion with no enhanced
 * variant: an edge reaches AA at 3:1 and cannot reach AAA at all. A single ladder would
 * report an edge that clears its own floor as reaching nothing.
 *
 * @param {number} ratio - The contrast ratio, 1 to 21.
 * @param {Criterion} [criterion] - The criterion the pair is read under. Default: `text`.
 * @returns {Reached} The level reached, and `fails` below the criterion's own floor.
 */
export function reached(ratio: number, criterion: Criterion = 'text'): Reached {
  if (criterion === 'edge') return ratio >= RATIOS.UI ? 'AA' : 'fails'
  if (ratio >= RATIOS.AAA) return 'AAA'
  if (ratio >= RATIOS.AA) return 'AA'
  return 'fails'
}

/**
 * Describes one ratio to print.
 */
interface RatioProps {
  /**
   * Sets the ratio this pair has to clear, which decides whether the badge reads as a
   * failure. A fill and its label are held to `AA`, an ink to `AAA`.
   */
  floor: number

  /**
   * Carries the colour the words sit on.
   */
  on: string

  /**
   * Carries the colour the words are drawn in.
   */
  over: string
}

/**
 * Prints the ratio one colour measures against another, and the level it reaches.
 *
 * It prints in a badge because a measurement sits on whatever colour the specimen is drawn
 * in, and a fill solved to carry its own label carries nothing else: the page's ink on
 * `primary` is what the theme guarantees against, and it is not readable there. The badge
 * puts the page back under the words.
 *
 * @param {RatioProps} props - The two colours. `RatioProps` documents every member.
 * @returns {JSX.Element} The ratio to two decimals, then the level, in a badge.
 */
function Ratio({ floor, on, over }: Readonly<RatioProps>): JSX.Element {
  const ratio = contrast(over, on)
  const level = reached(ratio)
  const ok = ratio >= floor
  const tone = ok ? 'var(--success-ink)' : 'var(--destructive-ink)'

  return (
    <span
      data-ok={ok ? '' : undefined}
      data-reached={level}
      style={{ ...BADGE, ...MONO, color: tone, justifySelf: 'start' }}
    >
      {ratio.toFixed(2)}:1 {level}
    </span>
  )
}

/**
 * Describes the pairs to draw.
 */
export interface PairsProps {
  /**
   * Lists each pair as the fill, then the text meant to sit on it.
   */
  pairs: readonly (readonly [ColorToken, ColorToken])[]
}

/**
 * Draws each pair as text on its fill, which is how the pair is meant to be used, with the
 * ratio the two measure in the current theme.
 *
 * @param {PairsProps} props - The pairs. `PairsProps` documents every member.
 * @returns {JSX.Element} One card per pair.
 */
export function Pairs({ pairs }: Readonly<PairsProps>): JSX.Element {
  return (
    <Themed>
      {({ tokens }: CurrentTheme) => (
        <div
          style={{
            ...GRID,
            gap: '0.75rem',
            gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))',
          }}
        >
          {pairs.map(([fill, text]) => (
            <div
              data-slot="pair"
              key={`${fill}/${text}`}
              style={{
                background: tokens[fill],
                border: HAIRLINE,
                borderRadius: CORNER,
                color: tokens[text],
                display: 'grid',
                fontSize: '0.875rem',
                gap: '0.375rem',
                padding: '1rem',
              }}
            >
              <span style={{ fontWeight: 600 }}>{fill}</span>
              <code style={{ ...MONO, fontSize: '0.75rem' }}>{text}</code>
              <Ratio floor={RATIOS.AA} on={tokens[fill]} over={tokens[text]} />
            </div>
          ))}
        </div>
      )}
    </Themed>
  )
}

/**
 * Describes the inks to draw.
 */
export interface InksProps {
  /**
   * Names the surface the inks are drawn on. Default: the page.
   */
  on?: ColorToken | undefined

  /**
   * Lists the tokens to draw as text.
   */
  tokens: readonly ColorToken[]
}

/**
 * Draws each ink as a line of text on the surface it is read on, with its ratio.
 *
 * An ink is a tone as text: a soft badge's words, an alert's words, a number that went the
 * wrong way. Every theme holds it to AAA against the page whatever its fills clear.
 *
 * @param {InksProps} props - The inks and their surface. `InksProps` documents every member.
 * @returns {JSX.Element} One line per ink.
 */
export function Inks({ on = 'background', tokens: named }: Readonly<InksProps>): JSX.Element {
  return (
    <Themed>
      {({ tokens }: CurrentTheme) => (
        <div
          style={{
            ...GRID,
            background: tokens[on],
            border: HAIRLINE,
            borderRadius: CORNER,
            gap: '0.75rem',
            padding: '1rem',
          }}
        >
          {named.map((token) => (
            <div
              data-slot="ink"
              key={token}
              style={{ alignItems: 'baseline', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}
            >
              <span style={{ color: tokens[token], flex: '1 1 14rem', fontSize: '0.875rem' }}>
                Three parcels were refused at the border on Tuesday.
              </span>
              <code style={{ ...MONO, fontSize: '0.8125rem' }}>{token}</code>
              <span style={CAPTION}>{tokens[token]}</span>
              <Ratio floor={RATIOS.AAA} on={tokens[on]} over={tokens[token]} />
            </div>
          ))}
        </div>
      )}
    </Themed>
  )
}
