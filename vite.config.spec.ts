import { describe, expect, it } from 'vite-plus/test'

import { serverSourceConditions, sourceConditions } from './tools/config/src/index.ts'
import config from './vite.config.ts'

describe('the repository config', () => {
  it('resolves a workspace package to its source, in both resolvers', () => {
    expect(config.resolve?.conditions).toEqual(sourceConditions())
    expect(
      config.ssr?.resolve?.conditions,
      'a specification loads another package through the node resolver',
    ).toEqual(serverSourceConditions())
  })
})
