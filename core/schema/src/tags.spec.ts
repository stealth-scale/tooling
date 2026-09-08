import { describe, expect, it } from 'vite-plus/test'

import { safeParse } from './parse.ts'
import { isLanguageTag, languageTag, locale } from './tags.ts'

/**
 * Lists the codes a schema refused a value with.
 *
 * @param {ReturnType<typeof safeParse>} result - The result `safeParse` returned.
 * @returns {string[]} The codes in the schema's order. Empty when the schema accepted the value.
 */
function codesOf(result: ReturnType<typeof safeParse>): string[] {
  return result.ok ? [] : result.failure.map((issue) => issue.code)
}

describe('isLanguageTag', () => {
  it('accepts a tag the engine reads, whatever case it was written in', () => {
    expect(isLanguageTag('nl-BE')).toBe(true)
    expect(isLanguageTag('EN-gb')).toBe(true)
    expect(isLanguageTag('zh-Hant-TW')).toBe(true)
  })

  it('refuses a string that is no tag', () => {
    expect(isLanguageTag('not a tag')).toBe(false)
    expect(isLanguageTag('')).toBe(false)
    expect(isLanguageTag('nl_BE'), 'an underscore is not a subtag separator').toBe(false)
  })
})

describe('languageTag', () => {
  it('is a validation action that reports a code and no words', () => {
    const action = languageTag()

    expect(action.kind).toBe('validation')
    expect(action.type).toBe('language_tag')
    expect(action.message).toBeUndefined()
    expect(action.reference).toBe(languageTag)
    expect(action.requirement).toBe(isLanguageTag)
  })
})

describe('locale', () => {
  it('accepts a language tag', () => {
    expect(safeParse(locale(), 'nl-BE')).toEqual({ ok: true, value: 'nl-BE' })
  })

  it('refuses a value that is not a string with that code alone', () => {
    expect(codesOf(safeParse(locale(), 42))).toEqual(['string'])
  })

  it('refuses a string that is no tag with language_tag, the string being its only scalar', () => {
    const result = safeParse(locale(), 'not a tag')

    expect(codesOf(result)).toEqual(['language_tag'])
    expect(result.ok ? [] : result.failure.map((issue) => issue.params)).toEqual([
      { received: '"not a tag"' },
    ])
  })
})
