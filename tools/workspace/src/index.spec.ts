import { describe, expect, it } from 'vite-plus/test'

import * as pkg from './index.ts'

describe('the package barrel', () => {
  it('exports the manifest reader and the contribution reader, and nothing else', () => {
    expect(Object.keys(pkg).toSorted()).toEqual([
      'contributions',
      'dependencyClosure',
      'dependencyManifests',
      'expandWorkspacePattern',
      'packageRoot',
      'readManifest',
      'workspaceManifests',
      'workspacePatterns',
      'workspaceRoot',
    ])
  })
})
