import { describe, expect, it } from 'vite-plus/test'

import { ANIMATION, KEYFRAMES, PRESS_SCALE, SPINNING, STILL } from './motion.ts'

/** Orders two names, so two sets of them compare. */
const alphabetical = (one: string, other: string): number => one.localeCompare(other)

describe('the motion vocabulary', () => {
  it('runs keyframes it also defines, and defines none it never runs', () => {
    const run = Object.values(ANIMATION).map((shorthand) => String(shorthand.split(' ')[0]))

    expect(
      run.toSorted(alphabetical),
      'a component naming an animation gets one that draws',
    ).toEqual(Object.keys(KEYFRAMES).toSorted(alphabetical))
  })

  it('builds every one-shot animation from the theme’s own duration and easing', () => {
    const loops = new Set(['ping', 'pulse', 'shimmer', 'spin'])
    const once = Object.entries(ANIMATION).filter(([name]) => !loops.has(name))

    for (const [name, shorthand] of once) {
      expect(shorthand, `${name} reads the theme rather than a literal`).toContain(
        'var(--duration-',
      )
      expect(shorthand, `${name} reads the theme rather than a literal`).toContain('var(--ease-')
    }
  })

  it('leaves an entrance and an exit holding their last frame', () => {
    const entrances = Object.entries(ANIMATION).filter(([name]) => name.includes('-in'))

    for (const [name, shorthand] of entrances) {
      expect(shorthand, `${name} would flash one frame at full opacity without it`).toContain(
        'backwards',
      )
    }

    expect(ANIMATION['fade-out'], 'an exit that snaps back reads as a blip').toContain('forwards')
  })

  it('presses a control in far enough to answer and not so far the label reflows', () => {
    expect(PRESS_SCALE).toBeGreaterThan(0.9)
    expect(PRESS_SCALE).toBeLessThan(1)
  })

  it('stops motion without stopping the events a component waits for', () => {
    expect(STILL, 'zero would fire no animationend, and a component would hang open').toContain(
      'animation-duration: 0.01ms !important',
    )
    expect(SPINNING, 'a frozen spinner reports that nothing is happening').toContain(
      'animation-iteration-count: infinite !important',
    )
  })
})
