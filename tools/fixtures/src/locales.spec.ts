import { base, en } from '@faker-js/faker'
import { describe, expect, it } from 'vite-plus/test'

import { canonical } from '@stealthscale/core-locale'

import { DEFAULT_LOCALE, definitionsFor, LOCALES, nearestLocale } from '#locales.ts'

/**
 * Returns `true` when every subtag after the language is a script or a region, so the tag
 * carries no variant.
 *
 * @param {string} tag - The tag to check.
 * @returns {boolean} `true` for `sr-Latn-RS`. `false` for `en-AU-ocker`.
 */
function languageScriptRegion(tag: string): boolean {
  return tag
    .split('-')
    .slice(1)
    .every((subtag) => /^(?:[A-Z][a-z]{3}|[A-Z]{2}|\d{3})$/u.test(subtag))
}

describe('LOCALES', () => {
  it('names every locale the sample data ships as a canonical tag, sorted', () => {
    expect(LOCALES).toContain('nl')
    expect(LOCALES).toContain('nl-BE')
    expect(LOCALES).toContain('zh-CN')
    expect(LOCALES.toSorted()).toEqual([...LOCALES])
    for (const tag of LOCALES) expect(canonical(tag), tag).toBe(tag)
  })

  it('writes a script where BCP-47 puts it, so a request for the script reaches the entry', () => {
    expect(LOCALES).toContain('sr-Latn-RS')
    expect(LOCALES).toContain('uz-Latn-UZ')
    expect(LOCALES).toContain('mn-Cyrl-MN')
    expect(LOCALES).toContain('ckb')
    expect(LOCALES).toContain('ku-Latn')
    for (const tag of LOCALES) expect(languageScriptRegion(tag), tag).toBe(true)
  })

  it('leaves out the base and the two joke locales, which nothing should ask for', () => {
    expect(LOCALES).not.toContain('en-Bork')
    expect(LOCALES).not.toContain('en-AU-ocker')
    expect(LOCALES.every((tag) => !tag.includes('_'))).toBe(true)
  })
})

describe('nearestLocale', () => {
  it('answers a locale the sample data ships exactly', () => {
    expect(nearestLocale('nl-BE')).toBe('nl-BE')
    expect(nearestLocale('de-AT')).toBe('de-AT')
  })

  it('truncates until it reaches one, so a region nothing ships reads as its language', () => {
    expect(nearestLocale('nl-NL')).toBe('nl')
    expect(nearestLocale('de-DE')).toBe('de')
  })

  it('widens where truncating finds nothing, so a script reaches a region that writes it', () => {
    expect(nearestLocale('zh-Hans')).toBe('zh-CN')
    expect(nearestLocale('zh-HK')).toBe('zh-TW')
    expect(nearestLocale('pt')).toBe('pt-BR')
  })

  it('reaches an entry written with its script from the language or the script alone', () => {
    expect(nearestLocale('sr')).toBe('sr-Latn-RS')
    expect(nearestLocale('sr-Latn')).toBe('sr-Latn-RS')
    expect(nearestLocale('uz-Latn')).toBe('uz-Latn-UZ')
    expect(nearestLocale('mn')).toBe('mn-Cyrl-MN')
  })

  it('falls back rather than throwing, because a fixture is not the subject of the case', () => {
    expect(nearestLocale('xx-YY')).toBe(DEFAULT_LOCALE)
    expect(nearestLocale('not a tag')).toBe(DEFAULT_LOCALE)
  })
})

describe('definitionsFor', () => {
  it('puts the locale over English and the base, so a field it lacks is still filled in', () => {
    expect(definitionsFor('nl')).toHaveLength(3)
    expect(definitionsFor('nl').slice(1)).toEqual([en, base])
  })

  it('does not name English twice when English is the nearest', () => {
    expect(definitionsFor('en')).toEqual([en, base])
    expect(definitionsFor('xx-YY')).toEqual([en, base])
  })
})
