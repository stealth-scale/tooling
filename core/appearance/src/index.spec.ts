import { describe, expect, it } from 'vite-plus/test'

import * as appearance from './index.ts'

describe('the package barrel', () => {
  it('exports the schemas, the defaults and the document writer, and nothing else', () => {
    expect(Object.keys(appearance).toSorted()).toEqual([
      'APPEARANCE_CONTRIBUTION',
      'APPEARANCE_KEY',
      'ATTRIBUTES',
      'MODE_CLASS',
      'appearanceFor',
      'appearanceSchema',
      'applyToDocument',
      'machine',
      'offeredSchema',
      'readFromDocument',
    ])
  })
})
