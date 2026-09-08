import { describe, expect, it } from 'vite-plus/test'

import * as logging from './index.ts'

describe('the package barrel', () => {
  it('exports the contract, the level order and the two loggers, and nothing else', () => {
    expect(Object.keys(logging).toSorted()).toEqual([
      'LEVELS',
      'SILENT',
      'atLeast',
      'recordingLogger',
    ])
  })
})
