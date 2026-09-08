import { describe, expect, it } from 'vite-plus/test'

import { type Offered } from './appearance.ts'
import { appearanceFor, type Machine, machine, type MachineSource } from './defaults.ts'

/**
 * Holds what a product with two of everything offers.
 */
const offered: Offered = {
  densities: ['comfortable', 'compact'],
  locales: ['en', 'nl', 'ar'],
  themes: ['thesmos', 'sustainix'],
}

/**
 * Holds a machine that asks for nothing in particular.
 */
const quiet: Machine = { languages: [], prefersDark: false, prefersReducedMotion: false }

/**
 * Builds a source that answers the queries it is given and lists the languages it is given.
 *
 * @param {readonly string[]} matching - The media queries that match.
 * @param {readonly string[]} [languages] - The languages the browser reports. Default: none.
 * @returns {MachineSource} The source.
 */
function sourceOf(matching: readonly string[], languages?: readonly string[]): MachineSource {
  return {
    matchMedia: (query) => ({ matches: matching.includes(query) }),
    ...(languages === undefined ? {} : { navigator: { languages } }),
  }
}

describe('machine', () => {
  it('reads the colour scheme, the motion preference and the languages off a window', () => {
    const source = sourceOf(
      ['(prefers-color-scheme: dark)', '(prefers-reduced-motion: reduce)'],
      ['nl-BE', 'en'],
    )

    expect(machine(source)).toEqual({
      languages: ['nl-BE', 'en'],
      prefersDark: true,
      prefersReducedMotion: true,
    })
  })

  it('reads nothing off a source that cannot answer, which is what a server is', () => {
    expect(machine({})).toEqual({ languages: [], prefersDark: false, prefersReducedMotion: false })
  })

  it('reads the global object when it is given no source', () => {
    const read = machine()

    expect(typeof read.prefersDark).toBe('boolean')
    expect(Array.isArray(read.languages)).toBe(true)
  })
})

describe('appearanceFor', () => {
  it('starts on the first theme and density the product offers, in light, with motion', () => {
    expect(appearanceFor(offered, quiet)).toEqual({
      density: 'comfortable',
      direction: 'ltr',
      locale: 'en',
      mode: 'light',
      reducedMotion: false,
      theme: 'thesmos',
    })
  })

  it('follows the machine into dark and reduced motion', () => {
    const drawn = appearanceFor(offered, {
      languages: [],
      prefersDark: true,
      prefersReducedMotion: true,
    })

    expect(drawn.mode).toBe('dark')
    expect(drawn.reducedMotion).toBe(true)
  })

  it('negotiates the locale from the languages against what the product ships words for', () => {
    expect(appearanceFor(offered, { ...quiet, languages: ['nl-BE', 'en'] }).locale).toBe('nl')
    expect(appearanceFor(offered, { ...quiet, languages: ['de'] }).locale, 'the fallback').toBe(
      'en',
    )
  })

  it('reads the direction off the locale it settled on', () => {
    expect(appearanceFor(offered, { ...quiet, languages: ['ar-EG'] })).toMatchObject({
      direction: 'rtl',
      locale: 'ar',
    })
  })

  it('lets what a caller states win over the machine and the offer', () => {
    const drawn = appearanceFor(
      offered,
      { languages: ['nl'], prefersDark: true, prefersReducedMotion: false },
      { direction: 'rtl', locale: 'en', mode: 'light', theme: 'sustainix' },
    )

    expect(drawn).toEqual({
      density: 'comfortable',
      direction: 'rtl',
      locale: 'en',
      mode: 'light',
      reducedMotion: false,
      theme: 'sustainix',
    })
  })

  it('answers en for a product that ships no words and a machine that names no language', () => {
    expect(appearanceFor({ ...offered, locales: [] }, quiet).locale).toBe('en')
  })

  it('leaves the theme and the density empty for a product that offers none', () => {
    const drawn = appearanceFor({ densities: [], locales: ['en'], themes: [] }, quiet)

    expect(drawn.theme).toBe('')
    expect(drawn.density).toBe('')
  })
})
