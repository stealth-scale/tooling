import { describe, expect, it } from 'vite-plus/test'

import { safeParse } from '@stealthscale/core-schema'

import { type Appearance, appearanceSchema, type Offered, offeredSchema } from './appearance.ts'

/**
 * Holds what a product with two of everything offers.
 */
const offered: Offered = {
  densities: ['comfortable', 'compact'],
  locales: ['en', 'nl-BE'],
  themes: ['thesmos', 'sustainix'],
}

/**
 * Holds an appearance inside that offer.
 */
const drawn: Appearance = {
  density: 'compact',
  direction: 'ltr',
  locale: 'nl-BE',
  mode: 'dark',
  reducedMotion: false,
  theme: 'sustainix',
}

/**
 * Lists the codes a schema refused a value with.
 *
 * @param {ReturnType<typeof safeParse>} result - The result `safeParse` returned.
 * @returns {string[]} The codes in the schema's order. Empty when the schema accepted the value.
 */
function codesOf(result: ReturnType<typeof safeParse>): string[] {
  return result.ok ? [] : result.failure.map((issue) => issue.code)
}

describe('appearanceSchema', () => {
  it('accepts an appearance inside the offer', () => {
    expect(safeParse(appearanceSchema(offered), drawn)).toEqual({ ok: true, value: drawn })
  })

  it('refuses a theme, a density or a mode the product does not offer', () => {
    const result = safeParse(appearanceSchema(offered), {
      ...drawn,
      density: 'touch',
      mode: 'sepia',
      theme: 'candy',
    })

    expect(result.ok).toBe(false)
    expect(result.ok ? [] : result.failure.map((issue) => issue.path).toSorted()).toEqual([
      'density',
      'mode',
      'theme',
    ])
    expect(new Set(codesOf(result))).toEqual(new Set(['picklist']))
  })

  it('refuses a locale that is no tag with the code language_tag', () => {
    const result = safeParse(appearanceSchema(offered), { ...drawn, locale: 'not a tag' })

    expect(codesOf(result)).toEqual(['language_tag'])
  })

  it('refuses a direction that is neither ltr nor rtl', () => {
    expect(codesOf(safeParse(appearanceSchema(offered), { ...drawn, direction: 'up' }))).toEqual([
      'picklist',
    ])
  })

  it('refuses everything for a product that offers nothing, so an empty offer cannot pass', () => {
    const nothing = { densities: [], locales: [], themes: [] }

    expect(safeParse(appearanceSchema(nothing), drawn).ok).toBe(false)
  })
})

describe('offeredSchema', () => {
  it('accepts three lists of names, the locales being tags', () => {
    expect(safeParse(offeredSchema(), offered)).toEqual({ ok: true, value: offered })
  })

  it('refuses a locale in the offer that is no tag, naming where it sits', () => {
    const result = safeParse(offeredSchema(), { ...offered, locales: ['en', 'nl_BE'] })

    expect(result.ok ? [] : result.failure.map((issue) => [issue.path, issue.code])).toEqual([
      ['locales.1', 'language_tag'],
    ])
  })
})
