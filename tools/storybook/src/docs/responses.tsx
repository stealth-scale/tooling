/**
 * @fileoverview Draws the two classes a control opts into, beside one that opts into neither.
 * Put a pointer on each: the fill changes on all three, and what the class decides is whether
 * the change eases or arrives. At the theme's fast duration that is a hundred milliseconds, so
 * it reads as an edge taken off rather than as movement, which is what a response should be.
 */

import { type CSSProperties, type JSX, useState } from 'react'

import { CAPTION, CORNER, HAIRLINE } from './styles.ts'

/**
 * Sets what every control looks like, apart from the fill the pointer changes.
 */
const CONTROL: CSSProperties = {
  border: HAIRLINE,
  borderRadius: CORNER,
  cursor: 'pointer',
  font: 'inherit',
  fontSize: '0.8125rem',
  padding: '0.625rem 1.25rem',
}

/**
 * Lists the three controls: the class each opts into, and what a pointer on it shows.
 */
const ROWS: readonly (readonly [name: string, className: string, note: string])[] = [
  ['no class', '', 'The fill arrives with the pointer.'],
  ['motion-state', 'motion-state', 'The fill crosses, on the theme’s fast duration and out curve.'],
  ['motion-press', 'motion-press', 'The same, and it shrinks while it is held down.'],
]

/**
 * Describes one control.
 */
interface ResponseProps {
  /**
   * Names the class it opts into, empty for the control that opts into none.
   */
  className: string

  /**
   * Says what a pointer on it shows, under the control.
   */
  note: string

  /**
   * Labels it.
   */
  title: string
}

/**
 * Draws one control, whose fill changes under the pointer.
 *
 * The fill is changed from here rather than from a stylesheet because these blocks draw in
 * inline styles, and a `:hover` rule cannot be written as one. The class is what decides
 * whether the change eases; the press is the class's own, and needs no state.
 *
 * @param {ResponseProps} props - The class, the label and the note. `ResponseProps` documents
 *     every member.
 * @returns {JSX.Element} The control, above its note.
 */
function Response({ className, note, title }: ResponseProps): JSX.Element {
  const [under, setUnder] = useState(false)

  return (
    <div style={{ display: 'grid', gap: '0.5rem', justifyItems: 'start' }}>
      <button
        className={className}
        data-slot="response"
        onPointerEnter={() => {
          setUnder(true)
        }}
        onPointerLeave={() => {
          setUnder(false)
        }}
        style={{
          ...CONTROL,
          background: under ? 'var(--accent)' : 'var(--secondary)',
          color: under ? 'var(--accent-foreground)' : 'var(--secondary-foreground)',
        }}
        type="button"
      >
        {title}
      </button>
      <span style={CAPTION}>{note}</span>
    </div>
  )
}

/**
 * Draws what a control opts into, and what it looks like opting into nothing.
 *
 * Both classes stop the moment the motion toolbar asks for less: the keyframes stylesheet holds
 * every transition on the page to a hundredth of a millisecond, so neither has to check.
 *
 * @returns {JSX.Element} The three controls, side by side.
 */
export function Responses(): JSX.Element {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', margin: '1.5rem 0' }}>
      {ROWS.map(([name, className, note]) => (
        <Response className={className} key={name} note={note} title={name} />
      ))}
    </div>
  )
}
