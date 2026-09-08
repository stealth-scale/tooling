import { describe, expect, it } from 'vite-plus/test'

import { stealthDefaults } from './defaults.ts'
import { formatConfig } from './format.ts'
import { lintConfig } from './lint.ts'
import { runConfig } from './run.ts'
import { serverSourceConditions, sourceConditions } from './source.ts'
import { stagedConfig } from './staged.ts'
import { testConfig } from './test.ts'

describe('stealthDefaults', () => {
  it('carries every block a repository would otherwise have to configure itself', () => {
    expect(Object.keys(stealthDefaults).toSorted()).toEqual([
      'fmt',
      'lint',
      'pack',
      'resolve',
      'run',
      'ssr',
      'staged',
      'test',
    ])
  })

  it('is each builder at its shared value, so there is one source of truth', () => {
    expect(stealthDefaults.fmt).toEqual(formatConfig())
    expect(stealthDefaults.lint).toEqual(lintConfig())
    expect(stealthDefaults.run).toEqual(runConfig())
    expect(stealthDefaults.staged).toEqual(stagedConfig())
    expect(stealthDefaults.test).toEqual(testConfig())
    expect(stealthDefaults.resolve?.conditions).toEqual(sourceConditions())
    expect(
      stealthDefaults.ssr?.resolve?.conditions,
      'a spec loads another package through the node resolver',
    ).toEqual(serverSourceConditions())
  })

  it('packs the way the pack builder does, deriving stylesheets per package', () => {
    expect(stealthDefaults.pack).toMatchObject({ dts: { tsgo: true }, publint: true })
    expect(
      typeof (stealthDefaults.pack as { exports?: { customExports?: unknown } }).exports
        ?.customExports,
      'the automatic derivation, not a fixed map',
    ).toBe('function')
  })

  it('assumes nothing renders, which is what a repository overrides when something does', () => {
    expect(
      stealthDefaults.lint?.overrides,
      'what a tool default-exports, a catalogue config and a specification',
    ).toHaveLength(3)
    expect(stealthDefaults.test?.projects, 'no jsdom project').toHaveLength(1)
  })
})
