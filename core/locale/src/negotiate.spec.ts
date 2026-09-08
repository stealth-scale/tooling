import { describe, expect, it } from 'vite-plus/test'

import { negotiate, preferences } from './negotiate.ts'

describe('preferences', () => {
  it('reads the tags a header names, most wanted first', () => {
    expect(preferences('en-GB,en;q=0.9,nl;q=0.8')).toEqual([
      { quality: 1, tag: 'en-GB' },
      { quality: 0.9, tag: 'en' },
      { quality: 0.8, tag: 'nl' },
    ])
  })

  it('sorts by quality rather than by the order the header wrote them', () => {
    expect(preferences('nl;q=0.2,en;q=0.9').map((preference) => preference.tag)).toEqual([
      'en',
      'nl',
    ])
  })

  it("keeps the header's own order where two tags share a quality", () => {
    expect(preferences('fr;q=0.5,de;q=0.5').map((preference) => preference.tag)).toEqual([
      'fr',
      'de',
    ])
  })

  it('treats a tag with no quality as wanted most', () => {
    expect(preferences('nl')).toEqual([{ quality: 1, tag: 'nl' }])
  })

  it('drops the wildcard and anything that is not a tag, which nothing can match', () => {
    expect(preferences('*,en;q=0.9')).toEqual([{ quality: 0.9, tag: 'en' }])
    expect(preferences('not a tag,nl')).toEqual([{ quality: 1, tag: 'nl' }])
  })

  it('reads a quality that is not a number as wanted most, rather than dropping the tag', () => {
    expect(preferences('nl;q=high')).toEqual([{ quality: 1, tag: 'nl' }])
    expect(preferences('nl;q=7')).toEqual([{ quality: 1, tag: 'nl' }])
  })

  it('reads a semicolon with no quality behind it as wanted most', () => {
    expect(preferences('nl;')).toEqual([{ quality: 1, tag: 'nl' }])
    expect(preferences('nl;q=')).toEqual([{ quality: 1, tag: 'nl' }])
  })

  it('drops a tag the client refused with q=0, which names it to say no to it', () => {
    expect(preferences('de,en;q=0')).toEqual([{ quality: 1, tag: 'de' }])
    expect(preferences('en;q=0'), 'a header that refuses everything asks for nothing').toEqual([])
  })

  it('reads a header that asks for nothing as asking for nothing', () => {
    expect(preferences()).toEqual([])
    expect(preferences('   ')).toEqual([])
  })
})

describe('negotiate', () => {
  it('answers in a tag the catalogue ships exactly', () => {
    expect(negotiate(['nl'], ['en', 'nl'], 'en')).toBe('nl')
  })

  it('never answers in a tag the client refused, because it never reaches the match', () => {
    const wanted = preferences('en;q=0,nl').map((preference) => preference.tag)

    expect(negotiate(wanted, ['en', 'nl'], 'en')).toBe('nl')
  })

  it('truncates the requested tag until it names something available', () => {
    expect(negotiate(['en-GB'], ['en', 'nl'], 'nl'), 'en-GB then en').toBe('en')
  })

  it('takes the first request that matches, in the order the client asked', () => {
    expect(negotiate(['de', 'nl', 'en'], ['en', 'nl'], 'en')).toBe('nl')
  })

  it('gives back the available tag as the catalogue wrote it, not as it was asked for', () => {
    expect(negotiate(['EN-gb'], ['en-GB'], 'nl'), 'a catalogue key is a file name').toBe('en-GB')
  })

  it('widens both sides where truncation finds nothing, so a script reaches its language', () => {
    expect(negotiate(['zh'], ['zh-Hans'], 'en'), 'zh widens to zh-Hans-CN').toBe('zh-Hans')
    expect(negotiate(['nl-BE'], ['nl'], 'en'), 'this one truncates rather than widens').toBe('nl')
  })

  it('meets an offer at the script where the two widen to different regions', () => {
    expect(negotiate(['zh-HK'], ['zh-Hant'], 'en'), 'zh-Hant-HK meets zh-Hant-TW at zh-Hant').toBe(
      'zh-Hant',
    )
    expect(negotiate(['sr-ME'], ['sr-Latn'], 'en'), 'sr-Latn-ME meets sr-Latn-RS at sr-Latn').toBe(
      'sr-Latn',
    )
    expect(negotiate(['zh-TW'], ['zh-Hant'], 'en'), 'and where they widen alike').toBe('zh-Hant')
  })

  it('answers a sibling region once both widen to the same script, which is the matcher', () => {
    expect(negotiate(['en-GB'], ['en-US'], 'nl'), 'both widen to en-Latn').toBe('en-US')
  })

  it('gives a step to the first offer that claims it, so a catalogue order decides', () => {
    expect(negotiate(['en-AU'], ['en-US', 'en-GB'], 'nl')).toBe('en-US')
    expect(negotiate(['en-AU'], ['en-GB', 'en-US'], 'nl')).toBe('en-GB')
  })

  it('falls back where nothing the client asked for is available', () => {
    expect(negotiate(['de'], ['en', 'nl'], 'en')).toBe('en')
  })

  it('falls back where the client asked for nothing', () => {
    expect(negotiate([], ['en', 'nl'], 'en')).toBe('en')
  })

  it('falls back where the catalogue ships nothing', () => {
    expect(negotiate(['nl'], [], 'en')).toBe('en')
  })

  it('returns the fallback as it was given, so a caller can serve what it gets back', () => {
    expect(negotiate(['de'], ['en'], 'en-GB')).toBe('en-GB')
  })

  it('ignores an available tag that is not a tag at all', () => {
    expect(negotiate(['nl'], ['not a tag', 'nl'], 'en')).toBe('nl')
    expect(negotiate(['nl'], ['not a tag'], 'en')).toBe('en')
  })

  it('ignores a requested tag that is not a tag at all', () => {
    expect(negotiate(['not a tag', 'nl'], ['nl'], 'en')).toBe('nl')
    expect(negotiate(['not a tag'], ['nl'], 'en'), 'in the widened pass too').toBe('en')
  })

  it('keeps the first of two available tags that widen the same', () => {
    // `zh-Hans` and `zh-CN` both widen to `zh-Hans-CN`.
    expect(negotiate(['zh'], ['zh-Hans', 'zh-CN'], 'en')).toBe('zh-Hans')
    expect(negotiate(['zh'], ['zh-CN', 'zh-Hans'], 'en'), "the catalogue's order decides").toBe(
      'zh-CN',
    )
  })

  it('keeps the first of two available tags that canonicalise the same', () => {
    expect(negotiate(['en-GB'], ['en-GB', 'EN-gb'], 'nl')).toBe('en-GB')
  })
})
