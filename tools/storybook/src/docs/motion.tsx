/**
 * @fileoverview Runs the easings and the durations the current theme states, side by side. A
 * curve is invisible in a table of `cubic-bezier` values, and the only way to tell one from
 * another is to watch them start and stop together. A theme that states a speed moves every
 * duration at once, so what runs here is what the theme on the toolbar ships.
 */

import { type CSSProperties, type JSX, useState } from 'react'

import { usePreview } from '#preview/store.ts'

import { BUTTON, CAPTION, CORNER } from './styles.ts'
import { type CurrentTheme, Themed } from './theme.tsx'

/**
 * Sets the track a runner crosses.
 */
const TRACK: CSSProperties = {
  background: 'var(--muted)',
  blockSize: '2rem',
  borderRadius: CORNER,
  overflow: 'hidden',
  position: 'relative',
}

/**
 * Describes one runner.
 */
interface RunnerProps {
  /**
   * Sets how long the crossing takes, as CSS writes it.
   */
  duration: string

  /**
   * Sets the curve, as CSS writes it.
   */
  easing: string

  /**
   * Marks that the runner is at the far end of its track.
   */
  playing: boolean
}

/**
 * Draws a square that runs the length of its track, so a curve can be seen.
 *
 * @param {RunnerProps} props - The curve and the time. `RunnerProps` documents every member.
 * @returns {JSX.Element} The track and the runner.
 */
function Runner({ duration, easing, playing }: Readonly<RunnerProps>): JSX.Element {
  return (
    <div style={TRACK}>
      <div
        data-slot="runner"
        style={{
          background: 'var(--primary)',
          blockSize: '2rem',
          borderRadius: CORNER,
          inlineSize: '2rem',
          transform: playing ? 'translateX(calc(100% * 8))' : 'translateX(0)',
          transitionDuration: duration,
          transitionProperty: 'transform',
          transitionTimingFunction: easing,
        }}
      />
    </div>
  )
}

/**
 * Describes one family of runners: what each row varies, on what the rest holds still.
 */
interface RunnersProps {
  /**
   * Lists the rows: the utility's name, the curve, and the time.
   */
  rows: readonly (readonly [name: string, easing: string, duration: string])[]
}

/**
 * Draws a family of runners behind one button that starts them together.
 *
 * @param {RunnersProps} props - The rows. `RunnersProps` documents every member.
 * @returns {JSX.Element} The button, then one labelled track per row.
 */
function Runners({ rows }: Readonly<RunnersProps>): JSX.Element {
  const [playing, setPlaying] = useState(false)
  const reduced = usePreview()?.appearance.reducedMotion === true

  return (
    <div style={{ display: 'grid', gap: '0.75rem', margin: '1.5rem 0' }}>
      <button
        onClick={() => {
          setPlaying((was) => !was)
        }}
        style={BUTTON}
        type="button"
      >
        {playing ? 'Send them back' : 'Run them'}
      </button>
      {reduced ? (
        <p data-slot="reduced" style={{ ...CAPTION, margin: 0 }}>
          Reduced motion is on, so every runner arrives at once. That is the point of the setting.
        </p>
      ) : null}
      {rows.map(([name, easing, duration]) => (
        <div key={name} style={{ display: 'grid', gap: '0.25rem' }}>
          <div style={CAPTION}>
            {name} <span style={{ opacity: 0.7 }}>{`${easing} · ${duration}`}</span>
          </div>
          <Runner duration={reduced ? '0.01ms' : duration} easing={easing} playing={playing} />
        </div>
      ))}
    </div>
  )
}

/**
 * Runs every easing over the slowest duration, so only the curve differs.
 *
 * @returns {JSX.Element} One track per curve.
 */
export function Easings(): JSX.Element {
  return (
    <Themed>
      {({ tables }: CurrentTheme) => {
        const slowest = `${String(Math.max(...Object.values(tables.duration)))}ms`

        return (
          <Runners
            rows={Object.entries(tables.ease).map(
              ([name, curve]) => [`ease-${name}`, curve, slowest] as const,
            )}
          />
        )
      }}
    </Themed>
  )
}

/**
 * Names the curve every duration runs on: the browser's own ease-out, so the contract's
 * curves are compared on the easing page and the times here.
 */
const ONE_CURVE = 'ease-out'

/**
 * Runs every duration on one curve, so only the time differs.
 *
 * @returns {JSX.Element} One track per duration, fastest first.
 */
export function Durations(): JSX.Element {
  return (
    <Themed>
      {({ tables }: CurrentTheme) => (
        <Runners
          rows={Object.entries(tables.duration)
            .toSorted(([, a], [, b]) => a - b)
            .map(([name, time]) => [`duration-${name}`, ONE_CURVE, `${String(time)}ms`] as const)}
        />
      )}
    </Themed>
  )
}
