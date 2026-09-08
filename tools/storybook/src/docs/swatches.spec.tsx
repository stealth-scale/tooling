import { render } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { CHART_TOKENS, SURFACE_TOKENS } from '@stealthscale/core-theme'

import { previewWrote } from './fixtures.ts'
import { Series, Swatches } from './swatches.tsx'

describe('Swatches', () => {
  it('says why it draws nothing before a theme is on', () => {
    const { container } = render(<Swatches of="surface" />)

    expect(container.querySelector('[data-slot="no-theme"]')).not.toBeNull()
  })

  it('draws every token of the group, named and valued, as the theme resolves it', () => {
    const { container } = render(<Swatches of="surface" />)
    previewWrote()

    expect(container.querySelectorAll('[data-slot="swatch"]')).toHaveLength(SURFACE_TOKENS.length)
    expect(container.textContent).toContain('card-foreground')
    expect(container.textContent).toContain('oklch(')
  })
})

describe('Series', () => {
  it('draws one bar per chart token, so the series can be told apart', () => {
    const { container } = render(<Series />)
    previewWrote()

    expect(container.querySelectorAll('[data-slot="bar"]')).toHaveLength(CHART_TOKENS.length)
    expect(container.textContent).toContain('positive')
  })
})
