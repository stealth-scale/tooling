/**
 * @fileoverview Measures every pair the contract guarantees against the theme the document is
 * drawn in, so the palette's claims are checkable on the page: switch the theme or the mode
 * and every ratio is recomputed from the solved colours.
 */

import { type CSSProperties, type JSX } from 'react'

import {
  contrast,
  FILL_PAIRS,
  OUTLINE_PAIRS,
  type Pair,
  RATIOS,
  TEXT_PAIRS,
  type TokenName,
} from '@stealthscale/core-theme'

import { reached } from './pairs.tsx'
import { CAPTION, CORNER, HAIRLINE, MONO } from './styles.ts'
import { type CurrentTheme, Themed } from './theme.tsx'

/**
 * Sets one cell of the table.
 */
const CELL: CSSProperties = {
  borderBottom: HAIRLINE,
  fontSize: '0.8125rem',
  padding: '0.5rem 0.75rem',
  textAlign: 'start',
  verticalAlign: 'middle',
}

/**
 * Sets a heading cell.
 */
const HEAD: CSSProperties = { ...CELL, color: 'var(--muted-foreground)', fontWeight: 500 }

/**
 * Describes one group of guarantees: the pairs, and the floor every theme holds them to.
 */
interface Group {
  /**
   * Sets the ratio every pair has to clear.
   */
  floor: number

  /**
   * Lists the pairs.
   */
  pairs: readonly Pair[]

  /**
   * Says what the group is, as the table's own heading.
   */
  title: string
}

/**
 * Lists the pairs the fills' level does not apply to: text on a surface, which every theme
 * holds to AAA whatever its recipe asks.
 */
const SURFACE_PAIRS = TEXT_PAIRS.filter(
  ([on, over]) => !FILL_PAIRS.some(([fill, label]) => fill === on && label === over),
)

/**
 * Lists the three groups, in the order the table prints them.
 */
const GROUPS: readonly Group[] = [
  { floor: RATIOS.AAA, pairs: SURFACE_PAIRS, title: 'Text on a surface, AAA in every theme' },
  {
    floor: RATIOS.AA,
    pairs: FILL_PAIRS,
    title: "A label on a fill, the level the theme's recipe asked for and AA at the least",
  },
  { floor: RATIOS.UI, pairs: OUTLINE_PAIRS, title: 'An edge on its surface, 3:1 for a boundary' },
]

/**
 * Describes one row.
 */
interface RowProps {
  /**
   * Sets the ratio the pair has to clear.
   */
  floor: number

  /**
   * Carries the pair.
   */
  pair: Pair

  /**
   * Carries every token of the theme.
   */
  tokens: Readonly<Record<TokenName, string>>
}

/**
 * Measures one pair.
 *
 * @param {RowProps} props - The pair, its floor and the theme. `RowProps` documents every
 *     member.
 * @returns {JSX.Element} The row: the pair, a sample, the ratio, the floor, and the result.
 */
function Row({ floor, pair: [on, over], tokens }: Readonly<RowProps>): JSX.Element {
  const ratio = contrast(tokens[over], tokens[on])
  const ok = ratio >= floor

  return (
    <tr data-ok={ok ? '' : undefined} data-slot="guarantee">
      <td style={{ ...CELL, ...MONO, fontSize: '0.75rem' }}>
        {over}
        <br />
        <span style={CAPTION}>on {on}</span>
      </td>
      <td style={CELL}>
        <span
          style={{
            background: tokens[on],
            border: HAIRLINE,
            borderRadius: CORNER,
            color: tokens[over],
            display: 'inline-block',
            padding: '0.375rem 0.75rem',
          }}
        >
          Sample text
        </span>
      </td>
      <td style={{ ...CELL, ...MONO }}>{ratio.toFixed(2)}:1</td>
      <td style={{ ...CELL, ...MONO }}>{floor.toFixed(1)}:1</td>
      <td style={{ ...CELL, ...MONO }}>{reached(ratio)}</td>
      <td
        style={{
          ...CELL,
          color: ok ? 'var(--foreground)' : 'var(--destructive-ink)',
          fontWeight: 600,
        }}
      >
        {ok ? 'pass' : 'fail'}
      </td>
    </tr>
  )
}

/**
 * Describes the rows of one group.
 */
interface RowsProps {
  /**
   * Carries the group.
   */
  group: Group

  /**
   * Carries every token of the theme.
   */
  tokens: Readonly<Record<TokenName, string>>
}

/**
 * Draws one group: its heading, then one row per pair.
 *
 * @param {RowsProps} props - The group and the theme. `RowsProps` documents every member.
 * @returns {JSX.Element} A heading row, then one measured row per pair.
 */
function Rows({ group, tokens }: Readonly<RowsProps>): JSX.Element {
  return (
    <>
      <tr>
        <th colSpan={6} scope="colgroup" style={{ ...HEAD, paddingTop: '1.25rem' }}>
          {group.title}
        </th>
      </tr>
      {group.pairs.map((pair) => (
        <Row floor={group.floor} key={`${pair[1]} on ${pair[0]}`} pair={pair} tokens={tokens} />
      ))}
    </>
  )
}

/**
 * Measures every guarantee against the theme the document is drawn in.
 *
 * A row that fails is a defect in the theme rather than in the component that used the pair:
 * fix the token, and every screen using that pair moves with it.
 *
 * @returns {JSX.Element} One table, grouped by what is guaranteed.
 */
export function Guarantees(): JSX.Element {
  return (
    <Themed>
      {({ tokens }: CurrentTheme) => (
        <table style={{ borderCollapse: 'collapse', margin: '1.5rem 0', width: '100%' }}>
          <thead>
            <tr>
              <th style={HEAD}>Text on surface</th>
              <th style={HEAD}>Sample</th>
              <th style={HEAD}>Ratio</th>
              <th style={HEAD}>Required</th>
              <th style={HEAD}>Reaches</th>
              <th style={HEAD}>Result</th>
            </tr>
          </thead>
          <tbody>
            {GROUPS.map((group) => (
              <Rows group={group} key={group.title} tokens={tokens} />
            ))}
          </tbody>
        </table>
      )}
    </Themed>
  )
}
