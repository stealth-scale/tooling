import { describe, expect, it } from 'vite-plus/test'

import { stealthDefaults } from './defaults.ts'
import { formatConfig } from './format.ts'
import { lintConfig } from './lint.ts'
import { runConfig } from './run.ts'
import { serverSourceConditions, sourceConditions } from './source.ts'
import { stagedConfig } from './staged.ts'
import { testConfig } from './test.ts'

const CONDITION = 'ui-source'

const defaults = stealthDefaults({ sourceCondition: CONDITION })

describe('stealthDefaults', () => {
  it('carries every block a repository would otherwise have to configure itself', () => {
    expect(Object.keys(defaults).toSorted()).toEqual([
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
    expect(defaults.fmt).toEqual(formatConfig())
    expect(defaults.lint).toEqual(lintConfig())
    expect(defaults.run).toEqual(runConfig())
    expect(defaults.staged).toEqual(stagedConfig())
    expect(defaults.test).toEqual(testConfig())
    expect(defaults.resolve?.conditions).toEqual(sourceConditions(CONDITION))
    expect(
      defaults.ssr?.resolve?.conditions,
      'a spec loads another package through the node resolver',
    ).toEqual(serverSourceConditions(CONDITION))
  })

  it('gives both resolvers and the pack step the one condition it was told', () => {
    const { exports } = defaults.pack as { exports: { devExports?: unknown } }

    expect(exports.devExports, 'what the pack step writes into every manifest').toBe(CONDITION)
    expect(defaults.resolve?.conditions?.[0]).toBe(CONDITION)
    expect(stealthDefaults({ sourceCondition: 'platform-source' }).resolve?.conditions?.[0]).toBe(
      'platform-source',
    )
  })

  it('packs the way the pack builder does, deriving stylesheets per package', () => {
    expect(defaults.pack).toMatchObject({ dts: { tsgo: true }, publint: true })
    expect(
      typeof (defaults.pack as { exports?: { customExports?: unknown } }).exports?.customExports,
      'the automatic derivation, not a fixed map',
    ).toBe('function')
  })

  it('assumes nothing renders, which is what a repository overrides when something does', () => {
    expect(
      defaults.lint?.overrides,
      'what a tool default-exports, a Storybook config and a specification',
    ).toHaveLength(3)
    expect(defaults.test?.projects, 'no jsdom project').toHaveLength(1)
  })
})
