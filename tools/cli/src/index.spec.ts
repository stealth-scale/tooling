import { describe, expect, it } from 'vite-plus/test'

import * as index from './index.ts'

describe('index', () => {
  it('exports the command tree, the release harness and what the commands are built on', () => {
    expect(Object.keys(index).toSorted()).toEqual([
      'commandMeta',
      'configuredRegistry',
      'failed',
      'failures',
      'lastLines',
      'missingFiles',
      'pack',
      'passed',
      'publishTarball',
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
      'writeTagEvents',
    ])
  })
})
