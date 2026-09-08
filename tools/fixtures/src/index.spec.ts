import { describe, expect, it } from 'vite-plus/test'

import * as fixtures from '#index.ts'

describe('the package barrel', () => {
  it('exports the builders, the seed and the locales, and nothing else', () => {
    expect(Object.keys(fixtures).toSorted()).toEqual([
      'DEFAULT_LOCALE',
      'LOCALES',
      'SEED',
      'definitionsFor',
      'fixture',
      'many',
      'nearestLocale',
    ])
  })
})
