/**
 * @fileoverview Runs the motion the contract fixes for every theme: the easings, the durations
 * and the animations built from them, each family side by side. A curve is invisible in a
 * table of `cubic-bezier` values, and the only way to tell one from another is to watch them
 * start and stop together.
 */

import { type CSSProperties, type JSX, useState } from 'react'

import { ANIMATION, DURATION, EASE } from '@stealthscale/core-theme'

import { usePreview } from '#preview/store.ts'

import { CAPTION, CORNER } from './styles.ts'

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
 * Sets the button that starts every runner.
 */
const BUTTON: CSSProperties = {
  background: 'var(--secondary)',
  border: '1px solid var(--border)',
  borderRadius: CORNER,
  color: 'var(--secondary-foreground)',
  cursor: 'pointer',
  font: 'inherit',
  fontSize: '0.8125rem',
  justifySelf: 'start',
  padding: '0.5rem 1rem',
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
  const slowest = `${String(Math.max(...Object.values(DURATION)))}ms`
  const rows = Object.entries(EASE).map(
    ([name, curve]) => [`ease-${name}`, curve, slowest] as const,
  )

  return <Runners rows={rows} />
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
  const rows = Object.entries(DURATION)
    .toSorted(([, a], [, b]) => a - b)
    .map(([name, time]) => [`duration-${name}`, ONE_CURVE, `${String(time)}ms`] as const)

  return <Runners rows={rows} />
}

/**
 * Sets the stage one animation plays on.
 *
 * A collapse animates to `--collapsible-panel-height`, which a component measures and sets,
 * because a keyframe cannot animate to `auto`. The stage sets it so the specimen plays what a
 * component would, rather than snapping.
 */
const STAGE: CSSProperties = {
  ['--collapsible-panel-height' as string]: '1.5rem',
  alignItems: 'center',
  background: 'var(--muted)',
  blockSize: '4rem',
  borderRadius: CORNER,
  display: 'grid',
  justifyItems: 'center',
  overflow: 'hidden',
}

/**
 * Plays every animation the contract names, each on its own stage.
 *
 * The shorthand is read from `ANIMATION` rather than from `var(--animate-*)`. Tailwind drops a
 * theme value in a namespace it owns when no utility uses it, so a page that read the custom
 * property would draw nothing at all for the entrances and exits nothing else on the page
 * happens to use.
 *
 * @returns {JSX.Element} A button that replays them, then one stage per animation.
 */
export function Animations(): JSX.Element {
  const [run, setRun] = useState(0)
  const reduced = usePreview()?.appearance.reducedMotion === true

  return (
    <div style={{ display: 'grid', gap: '0.75rem', margin: '1.5rem 0' }}>
      <button
        onClick={() => {
          setRun((was) => was + 1)
        }}
        style={BUTTON}
        type="button"
      >
        Play them again
      </button>
      <div
        style={{
          display: 'grid',
          gap: '0.75rem',
          gridTemplateColumns: 'repeat(auto-fill, minmax(11rem, 1fr))',
        }}
      >
        {Object.entries(ANIMATION).map(([name, shorthand]) => (
          <div key={`${name} ${String(run)}`} style={{ display: 'grid', gap: '0.375rem' }}>
            <div style={STAGE}>
              <div
                data-animation={reduced ? undefined : shorthand}
                data-slot="animated"
                style={{
                  animation: reduced ? '' : shorthand,
                  background: 'var(--primary)',
                  blockSize: '1.5rem',
                  borderRadius: CORNER,
                  inlineSize: '1.5rem',
                }}
              />
            </div>
            <code style={CAPTION}>animate-{name}</code>
          </div>
        ))}
      </div>
    </div>
  )
}
