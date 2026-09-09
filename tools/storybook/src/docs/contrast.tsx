/**
 * @fileoverview Measures every pair the contract guarantees against the theme the document is
 * drawn in, so the palette's claims are checkable on the page: switch the theme or the mode
 * and every ratio is recomputed from the solved colours.
 */

import { type CSSProperties, type JSX } from 'react'

import {
  CODE_TOKENS,
  contrast,
  FILL_PAIRS,
  OUTLINE_PAIRS,
  type Pair,
  RATIOS,
  TEXT_PAIRS,
  type TokenName,
} from '@stealthscale/core-theme'

import { type Criterion, reached } from './pairs.tsx'
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
 * Sets every row on the page's own surface.
 *
 * Storybook's documentation stylesheet paints every second row of a table a fixed grey, which
 * is neither of this theme's surfaces and reads as banding in dark mode. An inline background
 * outranks that rule, so the table sits on the page whatever theme is on.
 */
const ROW: CSSProperties = { background: 'transparent' }

/**
 * Describes one group of guarantees: the pairs, and the floor every theme holds them to.
 */
interface Group {
  /**
   * Names the criterion the pairs are read under, which decides what a ratio reaches.
   */
  criterion: Criterion

  /**
   * Sets the ratio every pair has to clear.
   */
  floor: number

  /**
   * Lists the pairs.
   */
  pairs: ReadonlyArray<Pair>

  /**
   * Says what the group is, as the table's own heading.
   */
  title: string
}

/**
 * Names the syntax roles, widened, so a pair's token can be tested against them.
 */
const CODE = new Set<string>(CODE_TOKENS)

/**
 * Returns `true` for a pair the fills' level decides, which every other group excludes.
 *
 * @param {Pair} pair - The surface and what sits on it.
 * @returns {boolean} `true` where the pair is a fill and its label.
 */
function isFill([on, over]: Pair): boolean {
  return FILL_PAIRS.some(([fill, label]) => fill === on && label === over)
}

/**
 * Lists the pairs the fills' level does not apply to, which every theme holds to AAA whatever
 * its recipe asks. They are split into the kinds a reader is looking for rather than printed
 * as one list: a page of twenty rows under one heading answers no question anybody asked.
 *
 * Each kind is derived from what the token is rather than named here, so an outcome or a
 * syntax role added to the contract reaches the right group without an edit.
 */
const READ: readonly Group[] = [
  {
    criterion: 'text',
    floor: RATIOS.AAA,
    pairs: TEXT_PAIRS.filter(
      (pair) =>
        !isFill(pair) &&
        !CODE.has(pair[1]) &&
        !pair[1].endsWith('-ink') &&
        !pair[0].endsWith('-soft'),
    ),
    title: 'Text on a surface, AAA in every theme',
  },
  {
    criterion: 'text',
    floor: RATIOS.AAA,
    pairs: TEXT_PAIRS.filter(([, over]) => over.endsWith('-ink')),
    title: 'An outcome as text on the page, which is what a word or a number is drawn with',
  },
  {
    criterion: 'text',
    floor: RATIOS.AAA,
    pairs: TEXT_PAIRS.filter(([on]) => on.endsWith('-soft')),
    title: 'A label on an outcome’s soft surface, which a badge or a callout sits inside',
  },
  {
    criterion: 'text',
    floor: RATIOS.AAA,
    pairs: TEXT_PAIRS.filter(([, over]) => CODE.has(over)),
    title: 'A syntax role on the surface a snippet sits on',
  },
]

/**
 * Lists every group, in the order the table prints them.
 */
const GROUPS: readonly Group[] = [
  ...READ,
  {
    criterion: 'text',
    floor: RATIOS.AA,
    pairs: FILL_PAIRS,
    title: "A label on a fill, the level the theme's recipe asked for and AA at the least",
  },
  {
    criterion: 'edge',
    floor: RATIOS.UI,
    pairs: OUTLINE_PAIRS,
    title: 'An edge on its surface, the 3:1 WCAG 1.4.11 asks of a boundary',
  },
]

/**
 * Describes one row.
 */
interface RowProps {
  /**
   * Names the criterion the pair is read under.
   */
  criterion: Criterion

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
function Row({ criterion, floor, pair: [on, over], tokens }: RowProps): JSX.Element {
  const ratio = contrast(tokens[over], tokens[on])
  const ok = ratio >= floor

  return (
    <tr data-ok={ok ? '' : undefined} data-slot="guarantee" style={ROW}>
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
      <td style={{ ...CELL, ...MONO }}>{reached(ratio, criterion)}</td>
      <td
        style={{
          ...CELL,
          color: ok ? 'var(--success-ink)' : 'var(--destructive-ink)',
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
function Rows({ group, tokens }: RowsProps): JSX.Element {
  return (
    <>
      <tr style={ROW}>
        <th colSpan={6} scope="colgroup" style={{ ...HEAD, paddingTop: '1.25rem' }}>
          {group.title}
        </th>
      </tr>
      {group.pairs.map((pair) => (
        <Row
          criterion={group.criterion}
          floor={group.floor}
          key={`${pair[1]} on ${pair[0]}`}
          pair={pair}
          tokens={tokens}
        />
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
            <tr style={ROW}>
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
