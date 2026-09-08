import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { ANIMATION } from '@stealthscale/core-theme'

import { Animations } from './animations.tsx'

describe('Animations', () => {
  it('plays every animation the contract names, from the table rather than a variable', () => {
    const { container } = render(<Animations />)
    const played = container.querySelectorAll<HTMLElement>('[data-animation]')

    expect(played).toHaveLength(Object.keys(ANIMATION).length)
    expect(
      played[0]?.dataset.animation,
      'Tailwind drops an unused theme value, so var(--animate-*) would draw nothing',
    ).toBe(ANIMATION['collapse-down'])
    expect(container.textContent).toContain('animate-fade-in')
  })

  it('names the real time beside each one, whatever speed it is being watched at', () => {
    const { container } = render(<Animations />)

    expect(container.textContent, 'normal is 200ms in every theme').toContain('200ms')
    expect(container.textContent, 'and a spinner states its own second').toContain('1000ms')
  })

  it('restarts a one-shot on the button, and leaves a loop turning', () => {
    const { container } = render(<Animations />)
    const entrance = container.querySelector('[data-animation*="fade-in"]')
    const loop = container.querySelector('[data-slot="spinner"]')

    fireEvent.click(container.querySelector('button') as Element)

    expect(container.querySelector('[data-animation*="fade-in"]')).not.toBe(entrance)
    expect(
      container.querySelector('[data-slot="spinner"]'),
      'remounting a loop makes it stutter every time something else replays',
    ).toBe(loop)
  })

  it('stretches every duration by the same factor when asked to slow down', () => {
    const { container } = render(<Animations />)
    const slower = container.querySelectorAll('button')[1] as Element

    fireEvent.click(slower)

    const fade = container.querySelector<HTMLElement>('[data-animation*="fade-in"]')

    expect(fade?.style.animationDuration, '200ms stretched six times').toBe('1200ms')
  })

  it('marks the spinner, so the stylesheet slows it rather than stopping it', () => {
    const { container } = render(<Animations />)

    expect(
      container.querySelector<HTMLElement>('[data-slot="spinner"]')?.dataset.animation,
      'reduced motion is answered by the stylesheet, which outranks an inline style',
    ).toBe(ANIMATION['spin'])
  })
})
