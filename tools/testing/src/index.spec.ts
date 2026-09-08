import { describe, expect, it } from 'vite-plus/test'

import * as testing from './index.ts'

describe('the package barrel', () => {
  it('exports the scratch workspace, the manifest builders and the measurements', () => {
    expect(Object.keys(testing).toSorted()).toEqual([
      'manifest',
      'packageFiles',
      'pixels',
      'scratchWorkspace',
      'seamBetween',
      'withScratchWorkspace',
      'withScratchWorkspaceAsync',
      'workspaceFiles',
    ])
  })
})
