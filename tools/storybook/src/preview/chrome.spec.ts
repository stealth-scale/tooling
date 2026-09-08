import { describe, expect, it } from 'vite-plus/test'

import { type Appearance } from '@stealthscale/core-appearance'
import { type ThemeValues } from '@stealthscale/core-theme'

import { type Themes } from './appearance.ts'
import { chromeFor, chromeFrom } from './chrome.ts'

/** A theme's tokens, in the ones the chrome reads. */
function values(overrides: Record<string, string> = {}): ThemeValues {
  const tokens = {
    background: 'oklch(99% 0.002 260)',
    border: '#dddddd',
    card: 'rgb(250 250 250)',
    'font-mono': 'JetBrains Mono',
    'font-sans': 'Inter',
    foreground: '#111111',
    input: '#cccccc',
    muted: '#eeeeee',
    'muted-foreground': '#666666',
    primary: 'oklch(45% 0.17 258)',
    radius: '0.5rem',
    ...overrides,
  } as unknown as ThemeValues['light']

  return { dark: tokens, light: tokens }
}

/** An appearance in one theme and one mode. */
function drawnIn(theme: string, mode: Appearance['mode']): Appearance {
  return {
    density: 'comfortable',
    direction: 'ltr',
    locale: 'en',
    mode,
    reducedMotion: false,
    theme,
  }
}

describe('chromeFrom', () => {
  it('reads every colour as hex, because the frame parses no perceptual notation', () => {
    const chrome = chromeFrom(values(), 'light', 'Kalon')

    expect(chrome.appBg).toMatch(/^#[\da-f]{6}$/u)
    expect(chrome.colorPrimary).toMatch(/^#[\da-f]{6}$/u)
    expect(chrome.barBg, 'read from an rgb() notation').toBe('#fafafa')
    expect(chrome.appBorderColor).toBe('#dddddd')
  })

  it('names the theme and the mode the story is drawn in', () => {
    expect(chromeFrom(values(), 'dark', 'Kalon').base).toBe('dark')
    expect(chromeFrom(values(), 'light', 'Kalon').brandTitle).toBe('Kalon')
    expect(chromeFrom(values(), 'light', 'Kalon').brandUrl).toBe('/')
  })

  it('is complete, so a setting this leaves out takes Storybook’s own rather than nothing', () => {
    expect(chromeFrom(values(), 'light', 'Kalon').appHoverBg).toEqual(expect.any(String))
  })

  it('carries the fonts through as written, since they are no colour', () => {
    const chrome = chromeFrom(values(), 'light', 'Kalon')

    expect(chrome.fontBase).toBe('Inter')
    expect(chrome.fontCode).toBe('JetBrains Mono')
  })

  it('reads the corner in pixels, and insets an input by two of them', () => {
    const chrome = chromeFrom(values(), 'light', 'Kalon')

    expect(chrome.appBorderRadius, '0.5rem at 16 pixels to the rem').toBe(8)
    expect(chrome.inputBorderRadius).toBe(6)
  })

  it('keeps an input square rather than negative for a theme with no corner', () => {
    const chrome = chromeFrom(values({ radius: '0rem' }), 'light', 'Kalon')

    expect(chrome.appBorderRadius).toBe(0)
    expect(chrome.inputBorderRadius).toBe(0)
  })

  it('reads a corner written in pixels as it is, rather than as rem', () => {
    const chrome = chromeFrom(values({ radius: '8px' }), 'light', 'Kalon')

    expect(chrome.appBorderRadius).toBe(8)
    expect(chrome.inputBorderRadius).toBe(6)
  })

  it('answers a corner of nothing for a radius it cannot read', () => {
    const named = chromeFrom(values({ radius: 'thin' }), 'light', 'Kalon')
    const computed = chromeFrom(values({ radius: 'calc(1rem + 2px)' }), 'light', 'Kalon')
    const relative = chromeFrom(values({ radius: '1em' }), 'light', 'Kalon')

    expect(named.appBorderRadius, 'a word carries no length').toBe(0)
    expect(computed.appBorderRadius, 'and neither does an expression').toBe(0)
    expect(relative.appBorderRadius, 'nor a unit that depends on the element').toBe(0)
  })

  it('answers black for a token that names no colour, rather than throwing', () => {
    expect(chromeFrom(values({ primary: 'transparent' }), 'light', 'Kalon').colorPrimary).toBe(
      '#000000',
    )
  })
})

describe('chromeFor', () => {
  const themes: Themes = { kalon: { title: 'Kalon', values: values() } }

  it('reads the frame out of the theme the story is drawn in', () => {
    const chrome = chromeFor(drawnIn('kalon', 'dark'), themes)

    expect(chrome?.brandTitle).toBe('Kalon')
    expect(chrome?.base).toBe('dark')
  })

  it('draws no frame of its own for a theme the workspace does not have', () => {
    expect(chromeFor(drawnIn('thesmos', 'light'), themes)).toBeUndefined()
  })
})
