import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { ANIMATION, DURATION, EASE } from '@stealthscale/core-theme'

import { previewWrote } from './fixtures.ts'
import { Animations, Durations, Easings } from './motion.tsx'

describe('Easings', () => {
  it('runs every curve over the slowest duration, together, on one button', () => {
    const { container } = render(<Easings />)
    const runners = container.querySelectorAll('[data-slot="runner"]')

    expect(runners).toHaveLength(Object.keys(EASE).length)
    expect(runners[0]?.getAttribute('style')).toContain('translateX(0)')
    expect(runners[0]?.getAttribute('style')).toContain('350ms')

    fireEvent.click(container.querySelector('button') as Element)

    expect(runners[0]?.getAttribute('style')).toContain('calc(100% * 8)')
    expect(container.querySelector('button')?.textContent).toBe('Send them back')
  })
})

describe('Durations', () => {
  it('runs every duration on one curve, fastest first', () => {
    const { container } = render(<Durations />)
    const runners = container.querySelectorAll('[data-slot="runner"]')

    expect(runners).toHaveLength(Object.keys(DURATION).length)
    expect(runners[0]?.getAttribute('style')).toContain('100ms')
    expect(container.textContent).toContain('duration-fast')
  })

  it('says so and collapses every run when the motion toolbar asks for less', () => {
    const { container } = render(<Durations />)
    previewWrote({ reducedMotion: true })

    expect(container.querySelector('[data-slot="reduced"]')).not.toBeNull()
    expect(container.querySelector('[data-slot="runner"]')?.getAttribute('style')).toContain(
      '0.01ms',
    )
  })
})

describe('Animations', () => {
  it('plays every animation the contract names, from the table rather than a variable', () => {
    previewWrote({ reducedMotion: false })
    const { container } = render(<Animations />)
    const played = container.querySelectorAll<HTMLElement>('[data-slot="animated"]')

    expect(played).toHaveLength(Object.keys(ANIMATION).length)
    expect(
      played[0]?.dataset.animation,
      'Tailwind drops an unused theme value, so var(--animate-*) would draw nothing',
    ).toBe(ANIMATION['collapse-down'])
    expect(container.textContent).toContain('animate-fade-in')
  })

  it('restarts them all when the button is pressed, since an entrance runs once', () => {
    previewWrote({ reducedMotion: false })
    const { container } = render(<Animations />)
    const before = container.querySelectorAll('[data-slot="animated"]')[0]

    fireEvent.click(container.querySelector('button') as Element)

    expect(container.querySelectorAll('[data-slot="animated"]')[0]).not.toBe(before)
  })

  it('draws them still when the motion toolbar asks for less', () => {
    const { container } = render(<Animations />)
    previewWrote({ reducedMotion: true })

    expect(
      container.querySelector<HTMLElement>('[data-slot="animated"]')?.dataset.animation,
    ).toBeUndefined()
  })
})
