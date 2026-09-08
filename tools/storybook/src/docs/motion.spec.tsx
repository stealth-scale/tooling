import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { DURATION, EASE } from '@stealthscale/core-theme'

import { previewWrote } from './fixtures.ts'
import { Durations, Easings } from './motion.tsx'

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
