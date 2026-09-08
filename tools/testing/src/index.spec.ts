import { describe, expect, it } from 'vite-plus/test'

import * as testing from './index.ts'

describe('the package barrel', () => {
  it('exports the scratch workspace and the manifest builders, and nothing else', () => {
    expect(Object.keys(testing).toSorted()).toEqual([
      'manifest',
      'packageFiles',
      'scratchWorkspace',
      'withScratchWorkspace',
      'withScratchWorkspaceAsync',
      'workspaceFiles',
    ])
  })
})
