import { describe, expect, it } from 'vite-plus/test'

import * as kit from './index.ts'

describe('the package barrel', () => {
  it('exports what a story file is written with, and nothing else', () => {
    expect(Object.keys(kit).toSorted()).toEqual([
      'Grid',
      'Legend',
      'Mirror',
      'STATES',
      'StateGrid',
      'countsEveryCell',
      'example',
      'forcedBy',
      'interactive',
      'localeOf',
      'mirrors',
      'sideOf',
      'underTest',
    ])
  })
})
