import { describe, expect, it } from 'vite-plus/test'

import { canonical, chain, parts, widened } from './tags.ts'

describe('canonical', () => {
  it('corrects the case of each subtag as BCP-47 writes it', () => {
    expect(canonical('EN-gb')).toBe('en-GB')
    expect(canonical('zh-hant-tw')).toBe('zh-Hant-TW')
  })

  it('gives undefined for a string that is not a tag', () => {
    expect(canonical('not a tag')).toBeUndefined()
    expect(canonical('')).toBeUndefined()
  })
})

describe('parts', () => {
  it('takes a tag apart into the language, script and region', () => {
    expect(parts('zh-Hant-TW')).toEqual({ language: 'zh', region: 'TW', script: 'Hant' })
  })

  it('leaves out what the tag does not name', () => {
    expect(parts('nl')).toEqual({ language: 'nl', region: undefined, script: undefined })
  })

  it('gives undefined for a string that is not a tag', () => {
    expect(parts('not a tag')).toBeUndefined()
  })
})

describe('widened', () => {
  it('adds the script and region the engine considers likely', () => {
    expect(widened('zh')).toBe('zh-Hans-CN')
    expect(widened('nl')).toBe('nl-Latn-NL')
  })

  it('gives undefined for a string that is not a tag', () => {
    expect(widened('not a tag')).toBeUndefined()
  })
})

describe('chain', () => {
  it('walks from most specific to least, which is the order a catalogue resolves in', () => {
    expect(chain('zh-Hant-TW')).toEqual(['zh-Hant-TW', 'zh-Hant', 'zh'])
  })

  it('gives a single-subtag tag as itself', () => {
    expect(chain('nl')).toEqual(['nl'])
  })

  it('canonicalises before walking, so the case it was written in does not matter', () => {
    expect(chain('EN-gb')).toEqual(['en-GB', 'en'])
  })

  it('drops an extension rather than walking through it', () => {
    expect(chain('en-GB-u-ca-gregory'), 'everything from the single-letter subtag on').toEqual([
      'en-GB',
      'en',
    ])
  })

  it('gives nothing for a string that is not a tag', () => {
    expect(chain('not a tag')).toEqual([])
  })
})
