import { afterEach, describe, expect, it, vi } from 'vite-plus/test'

import { type Offered } from '@stealthscale/core-appearance'

import { type Themes } from './appearance.ts'
import { initialGlobalsFor, toolbarsFor } from './globals.ts'

/** What a workspace with two of everything offers. */
const OFFERED: Offered = {
  densities: ['comfortable', 'compact'],
  locales: ['en', 'nl-BE'],
  themes: ['kalon', 'thesmos'],
}

/** The themes, for the names a person reads in the list. */
const THEMES = {
  kalon: { title: 'Kalon', values: {} },
  thesmos: { title: 'Thesmos', values: {} },
} as unknown as Themes

/** Reads the values one toolbar offers. */
function offered(name: string): unknown[] {
  const items = toolbarsFor(OFFERED, THEMES)[name]?.toolbar?.items ?? []
  return items.map((item) => (typeof item === 'string' ? item : item.value))
}

describe('toolbarsFor', () => {
  it('draws one toolbar per value a person can change', () => {
    expect(Object.keys(toolbarsFor(OFFERED, THEMES)).toSorted()).toEqual([
      'density',
      'direction',
      'locale',
      'mode',
      'reducedMotion',
      'theme',
    ])
  })

  it('lists a theme by the name it registered, not by its directory', () => {
    expect(toolbarsFor(OFFERED, THEMES)['theme']?.toolbar?.items).toEqual([
      { title: 'Kalon', value: 'kalon' },
      { title: 'Thesmos', value: 'thesmos' },
    ])
  })

  it('falls back to the name a document writes for a theme it has no title for', () => {
    expect(toolbarsFor(OFFERED, {})['theme']?.toolbar?.items[0]).toEqual({
      title: 'Kalon',
      value: 'kalon',
    })
  })

  it('draws no picker for something the workspace offers one of', () => {
    const single: Offered = { densities: ['compact'], locales: ['en'], themes: ['kalon'] }

    const drawn = Object.keys(toolbarsFor(single, THEMES))

    expect(drawn, 'one theme, one density and one language are no choice').toEqual([
      'mode',
      'direction',
      'reducedMotion',
    ])
  })

  it('offers both modes, both directions and both settings for motion, as strings', () => {
    expect(offered('mode')).toEqual(['light', 'dark'])
    expect(offered('direction')).toEqual(['ltr', 'rtl'])
    expect(offered('reducedMotion')).toEqual(['full', 'reduced'])
  })

  it('shows the choice on in the toolbar’s own title', () => {
    expect(toolbarsFor(OFFERED, THEMES)['theme']?.toolbar?.dynamicTitle).toBe(true)
  })

  it('leaves the starting value to the initial globals, as Storybook asks', () => {
    for (const toolbar of Object.values(toolbarsFor(OFFERED, THEMES))) {
      expect(toolbar).not.toHaveProperty('defaultValue')
    }
  })
})

describe('initialGlobalsFor', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts the motion toolbar on reduced when the machine asks for less', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))

    expect(initialGlobalsFor(OFFERED)['reducedMotion']).toBe('reduced')
  })

  it('starts each toolbar where the machine and the offer settle', () => {
    const starting = initialGlobalsFor(OFFERED)

    expect(starting['theme']).toBe('kalon')
    expect(starting['density']).toBe('comfortable')
    expect(starting['locale']).toBe('en')
    expect(['dark', 'light']).toContain(starting['mode'])
    expect(['ltr', 'rtl']).toContain(starting['direction'])
    expect(['full', 'reduced']).toContain(starting['reducedMotion'])
  })

  it('writes a value for every global, drawn or not, so a story can pin any of them', () => {
    expect(Object.keys(initialGlobalsFor(OFFERED)).toSorted()).toEqual([
      'density',
      'direction',
      'locale',
      'mode',
      'reducedMotion',
      'theme',
    ])
  })
})
