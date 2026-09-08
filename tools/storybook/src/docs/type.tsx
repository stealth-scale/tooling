/**
 * @fileoverview Draws the type scale, the weights, the tracking and the leading the contract
 * fixes for every theme, in the families the current theme names. A theme picks families and
 * nothing else about type, so every specimen reads the scale off the contract and only its
 * family off the document.
 */

import { type CSSProperties, type JSX, type ReactNode } from 'react'

import { FONT_WEIGHT, LEADING, TEXT, TRACKING } from '@stealthscale/core-theme'

import { CAPTION, HAIRLINE } from './styles.ts'

/**
 * Sets the sentence every specimen is drawn with.
 */
const SAMPLE = 'The quick brown fox jumps over the lazy dog'

/**
 * Sets the label column: what to type to get the specimen beside it.
 */
const LABEL: CSSProperties = { ...CAPTION, flex: '0 0 8.5rem', fontSize: '0.75rem' }

/**
 * Sets one row: the utility on the start side, the type it produces after it.
 */
const ROW: CSSProperties = {
  alignItems: 'baseline',
  borderTop: HAIRLINE,
  display: 'flex',
  gap: '1.5rem',
  padding: '0.75rem 0',
}

/**
 * Describes one row of a specimen table.
 */
interface RowProps {
  /**
   * Carries the specimen.
   */
  children: ReactNode

  /**
   * Names the utility that produces the specimen.
   */
  label: string

  /**
   * Carries the value under the label.
   */
  note: string
}

/**
 * Draws one row: the utility, its value, and the specimen.
 *
 * @param {RowProps} props - The row. `RowProps` documents every member.
 * @returns {JSX.Element} The utility and its value, then the specimen beside them.
 */
function Row({ children, label, note }: Readonly<RowProps>): JSX.Element {
  return (
    <div data-slot="specimen" style={ROW}>
      <div style={LABEL}>
        <div>{label}</div>
        <div style={{ opacity: 0.7 }}>{note}</div>
      </div>
      <div style={{ color: 'var(--foreground)', minWidth: 0 }}>{children}</div>
    </div>
  )
}

/**
 * Describes a table of specimens.
 */
interface TableProps {
  /**
   * Carries the rows.
   */
  children: ReactNode
}

/**
 * Draws a table of rows, with the hairline the last row needs under it.
 *
 * @param {TableProps} props - The rows. `TableProps` documents every member.
 * @returns {JSX.Element} The rows, closed by a hairline.
 */
function Table({ children }: Readonly<TableProps>): JSX.Element {
  return <div style={{ borderBottom: HAIRLINE, margin: '1.5rem 0' }}>{children}</div>
}

/**
 * Draws the type scale: every step, at its size, with the line height paired to it.
 *
 * @returns {JSX.Element} One row per step, smallest first.
 */
export function Scale(): JSX.Element {
  const steps = Object.entries(TEXT).toSorted(([, a], [, b]) => a.size - b.size)

  return (
    <Table>
      {steps.map(([step, { lineHeight, size }]) => (
        <Row
          key={step}
          label={`text-${step}`}
          note={`${String(size)}rem / ${String(lineHeight)}rem`}
        >
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: `${String(size)}rem`,
              lineHeight: `${String(lineHeight)}rem`,
            }}
          >
            {SAMPLE}
          </span>
        </Row>
      ))}
    </Table>
  )
}

/**
 * Draws every weight at one size, so only the weight differs.
 *
 * @returns {JSX.Element} One row per weight, lightest first.
 */
export function Weights(): JSX.Element {
  const weights = Object.entries(FONT_WEIGHT).toSorted(([, a], [, b]) => a - b)

  return (
    <Table>
      {weights.map(([name, weight]) => (
        <Row key={name} label={`font-${name}`} note={String(weight)}>
          <span
            style={{ fontFamily: 'var(--font-sans)', fontSize: '1.125rem', fontWeight: weight }}
          >
            {SAMPLE}
          </span>
        </Row>
      ))}
    </Table>
  )
}

/**
 * Draws every letter spacing, at a size where the difference is legible.
 *
 * @returns {JSX.Element} One row per step, tightest first.
 */
export function Tracking(): JSX.Element {
  const steps = Object.entries(TRACKING).toSorted(([, a], [, b]) => a - b)

  return (
    <Table>
      {steps.map(([name, em]) => (
        <Row key={name} label={`tracking-${name}`} note={`${String(em)}em`}>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1.125rem',
              letterSpacing: `${String(em)}em`,
            }}
          >
            {SAMPLE}
          </span>
        </Row>
      ))}
    </Table>
  )
}

/**
 * Draws every line height on enough text to wrap, which is the only place it is visible.
 *
 * @returns {JSX.Element} One row per step, tightest first.
 */
export function Leading(): JSX.Element {
  const steps = Object.entries(LEADING).toSorted(([, a], [, b]) => a - b)

  return (
    <Table>
      {steps.map(([name, ratio]) => (
        <Row key={name} label={`leading-${name}`} note={String(ratio)}>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              lineHeight: ratio,
              margin: 0,
              maxWidth: '32rem',
            }}
          >
            {`${SAMPLE}. ${SAMPLE}.`}
          </p>
        </Row>
      ))}
    </Table>
  )
}

/**
 * Draws the monospace family at the three sizes it is read at.
 *
 * @returns {JSX.Element} One row per size.
 */
export function Mono(): JSX.Element {
  return (
    <Table>
      {['0.75rem', '0.875rem', '1rem'].map((size) => (
        <Row key={size} label="font-mono" note={size}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: size }}>
            const duration = 1_234ms // 0x4d2
          </span>
        </Row>
      ))}
    </Table>
  )
}
