import { type JSX } from 'react'

import { act, render } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { type Appearance } from '@stealthscale/core-appearance'

import { solveThemes } from '#preview/appearance.ts'
import { preview } from '#preview/store.ts'

import { type CurrentTheme, Themed } from './theme.tsx'

/** A recipe that states only what it must. */
const RECIPE = { accent: 200, chart: [258, 152, 292, 45, 12], neutral: 260, primary: 258 }

/** An appearance in one theme and one mode. */
function drawnIn(theme: string, mode: Appearance['mode']): Appearance {
  return {
    density: 'comfortable',
    direction: 'ltr',
    locale: 'en',
    mode,
    reducedMotion: true,
    theme,
  }
}

/** A block that prints what it was handed about the theme. */
function Printed(theme: CurrentTheme): JSX.Element {
  const motion = theme.reducedMotion ? 'still' : 'moving'
  return (
    <b>
      {theme.title} {theme.name} {theme.mode} {theme.tokens.background} {motion}
    </b>
  )
}

describe('Themed', () => {
  it('says why it draws nothing before a preview has written anything', () => {
    const { container } = render(<Themed>{Printed}</Themed>)

    expect(container.querySelector('[data-slot="no-theme"]')?.textContent).toContain(
      'No theme is registered',
    )
  })

  it('draws the block from the theme the document is in, and follows the toolbars', () => {
    const themes = solveThemes({ kalon: { recipe: RECIPE, title: 'Kalon' } })
    const { container } = render(<Themed>{Printed}</Themed>)

    act(() => {
      preview.set({ appearance: drawnIn('kalon', 'dark'), themes })
    })

    expect(container.textContent).toContain('Kalon kalon dark oklch(')
    expect(container.textContent).toContain('still')
  })

  it('says so when the theme on is one the workspace did not register', () => {
    const { container } = render(<Themed>{Printed}</Themed>)

    act(() => {
      preview.set({ appearance: drawnIn('thesmos', 'light'), themes: {} })
    })

    expect(container.querySelector('[data-slot="no-theme"]')).not.toBeNull()
  })
})
