import { describe, expect, it } from 'vite-plus/test'

import * as locale from './index.ts'

describe('the package barrel', () => {
  it('exports the tag readers and the negotiator, and nothing else', () => {
    expect(Object.keys(locale).toSorted()).toEqual([
      'canonical',
      'chain',
      'negotiate',
      'parts',
      'preferences',
      'widened',
    ])
  })
})
