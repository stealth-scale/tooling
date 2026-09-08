import { describe, expect, it } from 'vite-plus/test'

import { type Offered } from '@stealthscale/core-appearance'

import { appearanceFrom } from './appearance.ts'

/** What a workspace with two themes and two languages offers. */
const OFFERED: Offered = {
  densities: ['comfortable', 'compact'],
  locales: ['en', 'ar'],
  themes: ['kalon', 'thesmos'],
}

describe('appearanceFrom', () => {
  it('takes every value a toolbar is on', () => {
    const appearance = appearanceFrom(
      {
        density: 'compact',
        direction: 'rtl',
        locale: 'ar',
        mode: 'dark',
        reducedMotion: 'reduced',
        theme: 'thesmos',
      },
      OFFERED,
    )

    expect(appearance).toEqual({
      density: 'compact',
      direction: 'rtl',
      locale: 'ar',
      mode: 'dark',
      reducedMotion: true,
      theme: 'thesmos',
    })
  })

  it('falls back to the offer where a toolbar says nothing', () => {
    const appearance = appearanceFrom({}, OFFERED)

    expect(appearance.theme, 'the first theme offered').toBe('kalon')
    expect(appearance.density, 'the first density offered').toBe('comfortable')
    expect(typeof appearance.reducedMotion).toBe('boolean')
  })

  it('reads the direction off the locale unless a toolbar states one', () => {
    expect(appearanceFrom({ locale: 'ar' }, OFFERED).direction).toBe('rtl')
    expect(appearanceFrom({ direction: 'ltr', locale: 'ar' }, OFFERED).direction).toBe('ltr')
  })

  it('reads full motion as a choice, not as a toolbar saying nothing', () => {
    expect(appearanceFrom({ reducedMotion: 'full' }, OFFERED).reducedMotion).toBe(false)
  })

  it('ignores a toolbar carrying something that is not its value', () => {
    const appearance = appearanceFrom(
      { density: '', direction: 'sideways', mode: 'twilight', reducedMotion: 'yes', theme: 12 },
      OFFERED,
    )

    expect(appearance.theme).toBe('kalon')
    expect(appearance.density).toBe('comfortable')
    expect(appearance.direction).toBe('ltr')
    expect(['dark', 'light']).toContain(appearance.mode)
  })
})
