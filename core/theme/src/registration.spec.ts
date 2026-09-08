import { describe, expect, it } from 'vite-plus/test'

import { safeParse } from '@stealthscale/core-schema'

import { THEME_CONTRIBUTION, THEME_KEY } from '#registration.ts'

describe('THEME_KEY', () => {
  it('names the entry a theme registers itself under', () => {
    expect(THEME_KEY).toBe('theme')
  })
})

describe('THEME_CONTRIBUTION', () => {
  it('accepts the recipe and the title a theme declares', () => {
    expect(safeParse(THEME_CONTRIBUTION, { recipe: './src/recipe.ts', title: 'Thesmos' })).toEqual({
      ok: true,
      value: { recipe: './src/recipe.ts', title: 'Thesmos' },
    })
  })

  it('carries a key it does not name through unread', () => {
    const read = safeParse(THEME_CONTRIBUTION, {
      recipe: './src/recipe.ts',
      swatch: './swatch.png',
      title: 'Thesmos',
    })

    expect(read.ok).toBe(true)
    if (!read.ok) return
    expect(read.value.recipe).toBe('./src/recipe.ts')
  })

  it('refuses an entry missing either word, and says which', () => {
    const read = safeParse(THEME_CONTRIBUTION, { recipe: './src/recipe.ts' })

    expect(read.ok).toBe(false)
    if (read.ok) return
    expect(read.failure.map(({ path }) => path)).toEqual(['title'])
  })

  it('refuses a word that is not a string, with a code and no words of its own', () => {
    const read = safeParse(THEME_CONTRIBUTION, { recipe: 12, title: 'Thesmos' })

    expect(read.ok).toBe(false)
    if (read.ok) return
    expect(read.failure[0]?.code).toBe('string')
    expect(read.failure[0]?.path).toBe('recipe')
  })

  it('refuses an entry that is not an object at all', () => {
    expect(safeParse(THEME_CONTRIBUTION, './src/recipe.ts').ok).toBe(false)
  })
})
