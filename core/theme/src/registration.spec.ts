import { describe, expect, it } from 'vite-plus/test'

import { safeParse } from '@stealthscale/core-schema'

import { THEME_CONTRIBUTION, THEME_KEY } from '#registration.ts'

describe('THEME_KEY', () => {
  it('names the entry a theme registers itself under', () => {
    expect(THEME_KEY).toBe('theme')
  })
})

describe('THEME_CONTRIBUTION', () => {
  it('accepts the attribute value and the title a theme declares', () => {
    expect(safeParse(THEME_CONTRIBUTION, { name: 'thesmos', title: 'Thesmos' })).toEqual({
      ok: true,
      value: { name: 'thesmos', title: 'Thesmos' },
    })
  })

  it('carries a key it does not name through unread', () => {
    const read = safeParse(THEME_CONTRIBUTION, {
      name: 'thesmos',
      swatch: './swatch.png',
      title: 'Thesmos',
    })

    expect(read.ok).toBe(true)
    if (!read.ok) return
    expect(read.value.title).toBe('Thesmos')
  })

  it('refuses an entry that names neither, and says so about both', () => {
    const read = safeParse(THEME_CONTRIBUTION, {})

    expect(read.ok).toBe(false)
    if (read.ok) return
    expect(read.failure.map(({ path }) => path)).toEqual(['name', 'title'])
  })

  it('refuses a theme that states a title but no attribute value to scope it to', () => {
    const read = safeParse(THEME_CONTRIBUTION, { title: 'Thesmos' })

    expect(read.ok).toBe(false)
    if (read.ok) return
    expect(read.failure.map(({ path }) => path)).toEqual(['name'])
  })

  it('refuses a word that is not a string, with a code and no words of its own', () => {
    const read = safeParse(THEME_CONTRIBUTION, { name: 'thesmos', title: 12 })

    expect(read.ok).toBe(false)
    if (read.ok) return
    expect(read.failure[0]?.code).toBe('string')
    expect(read.failure[0]?.path).toBe('title')
  })

  it('refuses an entry that is not an object at all', () => {
    expect(safeParse(THEME_CONTRIBUTION, './src/recipe.ts').ok).toBe(false)
  })
})
