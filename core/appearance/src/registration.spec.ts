import { describe, expect, it } from 'vite-plus/test'

import { safeParse } from '@stealthscale/core-schema'

import { APPEARANCE_CONTRIBUTION, APPEARANCE_KEY } from './registration.ts'

describe('APPEARANCE_KEY', () => {
  it('names the entry a design system registers itself under', () => {
    expect(APPEARANCE_KEY).toBe('appearance')
  })
})

describe('APPEARANCE_CONTRIBUTION', () => {
  it('accepts an entry that registers all three', () => {
    const written = {
      densities: ['comfortable', 'compact'],
      locales: ['en', 'nl-BE'],
      provider: './src/provider.tsx',
      stylesheets: ['./src/base.css', './src/fonts.css'],
    }

    expect(safeParse(APPEARANCE_CONTRIBUTION, written)).toEqual({ ok: true, value: written })
  })

  it('accepts a package that contributes only one of them, and one that contributes none', () => {
    expect(safeParse(APPEARANCE_CONTRIBUTION, { stylesheets: ['./src/keyframes.css'] })).toEqual({
      ok: true,
      value: { stylesheets: ['./src/keyframes.css'] },
    })
    expect(safeParse(APPEARANCE_CONTRIBUTION, {})).toEqual({ ok: true, value: {} })
  })

  it('carries a key it does not name through unread', () => {
    const read = safeParse(APPEARANCE_CONTRIBUTION, {
      motion: './src/motion.css',
      provider: './src/provider.tsx',
    })

    expect(read.ok).toBe(true)
    if (!read.ok) return
    expect(read.value.provider).toBe('./src/provider.tsx')
  })

  it('refuses a member written as undefined rather than left out', () => {
    expect(safeParse(APPEARANCE_CONTRIBUTION, { provider: undefined }).ok).toBe(false)
  })

  it('refuses a density that is no string, naming the entry it sits at', () => {
    const read = safeParse(APPEARANCE_CONTRIBUTION, { densities: ['comfortable', 3] })

    expect(read.ok).toBe(false)
    if (read.ok) return
    expect(read.failure[0]?.code).toBe('string')
    expect(read.failure[0]?.path).toBe('densities.1')
  })

  it('refuses a locale that is no language tag, so a toolbar cannot offer one', () => {
    const read = safeParse(APPEARANCE_CONTRIBUTION, { locales: ['en', 'not a tag'] })

    expect(read.ok).toBe(false)
    if (read.ok) return
    expect(read.failure[0]?.code).toBe('language_tag')
    expect(read.failure[0]?.path).toBe('locales.1')
  })

  it('refuses a list written as one value, and an entry that is not an object', () => {
    expect(safeParse(APPEARANCE_CONTRIBUTION, { stylesheets: './src/base.css' }).ok).toBe(false)
    expect(safeParse(APPEARANCE_CONTRIBUTION, './src/provider.tsx').ok).toBe(false)
  })
})
