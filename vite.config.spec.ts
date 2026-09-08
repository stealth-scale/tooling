import { describe, expect, it, vi } from 'vite-plus/test'

import { serverSourceConditions, sourceConditions } from './tools/config/src/index.ts'
import config from './vite.config.ts'

/**
 * Stands in for Storybook's plugin factory. The config calls the factory as it is built, and
 * the real one loads `.storybook/main.ts` through Storybook's own loader as soon as it runs
 * under vitest, which corrupts the coverage of every file that load touches.
 */
vi.mock('@storybook/addon-vitest/vitest-plugin', () => ({
  storybookTest: vi.fn<() => Promise<never[]>>(() => Promise.resolve([])),
}))

describe('the repository config', () => {
  it('resolves a workspace package to its source, in both resolvers', () => {
    expect(config.resolve?.conditions).toEqual(sourceConditions())
    expect(
      config.ssr?.resolve?.conditions,
      'a specification loads another package through the node resolver',
    ).toEqual(serverSourceConditions())
  })
})
