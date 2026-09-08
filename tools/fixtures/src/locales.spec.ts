import { base, en } from '@faker-js/faker'
import { describe, expect, it } from 'vite-plus/test'

import { DEFAULT_LOCALE, definitionsFor, LOCALES, nearestLocale } from '#locales.ts'

describe('LOCALES', () => {
  it('names every locale the sample data ships as a tag, sorted', () => {
    expect(LOCALES).toContain('nl')
    expect(LOCALES).toContain('nl-BE')
    expect(LOCALES).toContain('zh-CN')
    expect(LOCALES.toSorted()).toEqual([...LOCALES])
  })

  it('leaves out a key that is no tag at all, such as a joke locale', () => {
    expect(LOCALES, 'BORK is four letters, so it is no variant subtag').not.toContain('en-BORK')
    expect(LOCALES.every((tag) => !tag.includes('_'))).toBe(true)
  })
})

describe('nearestLocale', () => {
  it('answers a locale the sample data ships exactly', () => {
    expect(nearestLocale('nl-BE')).toBe('nl-BE')
    expect(nearestLocale('de-AT')).toBe('de-AT')
  })

  it('truncates until it reaches one, so a region nothing ships still reads as its language', () => {
    expect(nearestLocale('nl-NL')).toBe('nl')
    expect(nearestLocale('de-DE')).toBe('de')
  })

  it('widens where truncating finds nothing, so a script reaches a region that writes it', () => {
    expect(nearestLocale('zh-Hans')).toBe('zh-CN')
    expect(nearestLocale('pt')).toBe('pt-BR')
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
