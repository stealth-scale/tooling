/**
 * @fileoverview Plays the animations the contract names, so the vocabulary a component writes
 * against can be watched rather than read. Each is drawn at its real speed, with a control
 * that stretches every one by the same factor for a reader who wants to study one.
 */

import { type CSSProperties, type JSX, useState } from 'react'

import { ANIMATION, DURATION } from '@stealthscale/core-theme'

import { BUTTON, CAPTION, CORNER } from './styles.ts'

/**
 * Sets the stage one animation plays on.
 *
 * A collapse animates to `--collapsible-panel-height`, which a component measures and sets,
 * because a keyframe cannot animate to `auto`. The stage sets it so the specimen plays what a
 * component would, rather than snapping.
 */
const STAGE: CSSProperties = {
  ['--collapsible-panel-height' as string]: '3rem',
  alignItems: 'center',
  background: 'var(--muted)',
  blockSize: '6rem',
  borderRadius: CORNER,
  display: 'grid',
  justifyItems: 'center',
  overflow: 'hidden',
}

/**
 * Stretches every specimen by this much when a reader asks to watch one.
 *
 * A theme's own timings are a fifth of a second, which is right on screen and too fast to
 * study. The caption keeps naming the real time, so nothing here is mistaken for the value.
 */
const SLOWER = 6

/**
 * Sets what a shimmer moves across. It animates `background-position`, so a specimen filled
 * with one colour has nothing to move and reads as broken.
 */
const SHIMMER: CSSProperties = {
  background: 'linear-gradient(90deg, var(--muted) 0%, var(--primary) 50%, var(--muted) 100%)',
  backgroundSize: '200% 100%',
}

/**
 * Names how long one animation runs, in milliseconds.
 *
 * @param {string} shorthand - The animation, as `ANIMATION` writes it.
 * @returns {number} The time it takes, whether it names a duration step or its own seconds.
 */
function millisecondsOf(shorthand: string): number {
  const written = String(shorthand.split(' ')[1])
  const step = /^var\(--duration-(?<name>[a-z]+)\)$/u.exec(written)

  // eslint-disable-next-line unicorn/prefer-number-coercion -- `Number('1.6s')` is NaN
  return step === null ? Number.parseFloat(written) * 1000 : Number(DURATION[String(step[1])])
}

/**
 * Returns `true` when an animation repeats until something stops it.
 *
 * @param {string} shorthand - The animation, as `ANIMATION` writes it.
 * @returns {boolean} `true` for a loop, which keeps turning across a replay.
 */
function repeats(shorthand: string): boolean {
  return shorthand.includes('infinite')
}

/**
 * Describes one specimen.
 */
interface SpecimenProps {
  /**
   * Names the animation, as a utility writes it after `animate-`.
   */
  name: string

  /**
   * Carries the animation, as `ANIMATION` writes it.
   */
  shorthand: string

  /**
   * Marks that every specimen is being stretched, so one can be studied.
   */
  slow: boolean
}

/**
 * Plays one animation on its own stage, and names the time it really takes.
 *
 * The spinner is marked as one. Reduced motion is answered by the generated stylesheet, whose
 * rules carry `!important` and so outrank an inline style, and its one exception is the
 * spinner slot: a specimen carrying that name is slowed where the rest are stopped, which is
 * what a component gets.
 *
 * @param {SpecimenProps} props - The animation and the speed. `SpecimenProps` documents every
 *     member.
 * @returns {JSX.Element} The stage, then the utility's name and the real time.
 */
function Specimen({ name, shorthand, slow }: Readonly<SpecimenProps>): JSX.Element {
  const time = millisecondsOf(shorthand)

  return (
    <div style={{ display: 'grid', gap: '0.375rem' }}>
      <div style={STAGE}>
        <div
          data-animation={shorthand}
          data-slot={name === 'spin' ? 'spinner' : 'animated'}
          style={{
            animation: shorthand,

            // Always written, even at real speed. React clears a style key that goes from a
            // value to absent, and clearing this one resets the shorthand's own duration to 0s.
            animationDuration: `${String(time * (slow ? SLOWER : 1))}ms`,
            background: 'var(--primary)',
            blockSize: '3rem',
            borderRadius: CORNER,
            inlineSize: '3rem',
            ...(name === 'shimmer' ? SHIMMER : {}),
          }}
        />
      </div>
      <code style={CAPTION}>
        animate-{name} <span style={{ opacity: 0.7 }}>{`${String(time)}ms`}</span>
      </code>
    </div>
  )
}

/**
 * Plays every animation the contract names, each on its own stage.
 *
 * The shorthand is read from `ANIMATION` rather than from `var(--animate-*)`. Tailwind drops a
 * theme value in a namespace it owns when no utility uses it, and nothing in a catalogue
 * writes `animate-fade-in`, so every one of these resolves to nothing as a custom property.
 *
 * A replay remounts the entrances and the exits, because each runs once and holds its last
 * frame. A loop keeps its element, since remounting one makes it stutter every time something
 * else replays.
 *
 * @returns {JSX.Element} The controls, then one stage per animation.
 */
export function Animations(): JSX.Element {
  const [run, setRun] = useState(0)
  const [slow, setSlow] = useState(false)

  return (
    <div style={{ display: 'grid', gap: '0.75rem', margin: '1.5rem 0' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        <button
          onClick={() => {
            setRun((was) => was + 1)
          }}
          style={BUTTON}
          type="button"
        >
          Play them again
        </button>
        <button
          onClick={() => {
            setSlow((was) => !was)
          }}
          style={BUTTON}
          type="button"
        >
          {slow ? 'Real speed' : `Slow them to a ${String(SLOWER)}th`}
        </button>
      </div>
      <div
        style={{
          display: 'grid',
          gap: '0.75rem',
          gridTemplateColumns: 'repeat(auto-fill, minmax(11rem, 1fr))',
        }}
      >
        {Object.entries(ANIMATION).map(([name, shorthand]) => (
          <Specimen
            key={repeats(shorthand) ? name : `${name} ${String(run)}`}
            name={name}
            shorthand={shorthand}
            slow={slow}
          />
        ))}
      </div>
    </div>
  )
}
