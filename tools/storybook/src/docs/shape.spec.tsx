import { render } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { GLOW, RADIUS, SHADOW } from '@stealthscale/core-theme'

import { previewWrote } from './fixtures.ts'
import { Radii, Shadows } from './shape.tsx'

describe('Radii', () => {
  it('names the theme’s radius and draws every step as a multiple of it, smallest first', () => {
    const { container } = render(<Radii />)
    previewWrote()

    expect(container.querySelector('[data-slot="radius"]')?.textContent).toBe('0.5rem')
    expect(container.querySelectorAll('[data-slot="corner"]')).toHaveLength(
      Object.keys(RADIUS).length,
    )
    expect(container.querySelector('[data-slot="corner"]')?.textContent).toContain('rounded-xs')
    expect(container.textContent).toContain('calc(var(--radius) * 0.25)')
  })
})

describe('Shadows', () => {
  it('draws every shadow step and every glow on a card, mixed from the theme’s ink', () => {
    const { container } = render(<Shadows />)
    previewWrote()

    const drawn = container.querySelectorAll('[data-slot="elevation"]')

    expect(drawn).toHaveLength(Object.keys(SHADOW).length + Object.keys(GLOW).length)
    expect(container.textContent).toContain('shadow-glow-md')
    expect(drawn[0]?.querySelector('div')?.getAttribute('style')).toContain(
      'var(--shadow-highlight)',
    )
  })
})
