import { describe, expect, it } from 'vite-plus/test'

import * as index from './index.ts'

describe('index', () => {
  it('exports the command tree, the release harness and what the commands are built on', () => {
    expect(Object.keys(index).toSorted()).toEqual([
      'commandMeta',
      'configuredRegistry',
      'dependencyClosure',
      'expandWorkspacePattern',
      'failed',
      'failures',
      'lastLines',
      'missingFiles',
      'pack',
      'packageRoot',
      'passed',
      'publishTarball',
      'readManifest',
      'registryHasVersion',
      'release',
      'releaseCommand',
      'releaseCommandWith',
      'releaseSet',
      'render',
      'shell',
      'stealth',
      'tagEvent',
      'withTrailingSlash',
      'workspaceManifests',
      'workspacePatterns',
      'workspaceRoot',
      'writeTagEvents',
    ])
  })
})
