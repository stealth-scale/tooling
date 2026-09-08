import { describe, expect, it } from 'vite-plus/test'

import * as vite from './index.ts'

describe('the vite barrel', () => {
  it('carries one builder per block a root config composes', () => {
    expect(Object.keys(vite).toSorted()).toEqual([
      'DOC_RULES',
      'GENERATED',
      'MARKUP_RULES',
      'SAFETY_RULES',
      'SIZE_RULES',
      'SOURCE_CONDITION',
      'docblocksOff',
      'formatConfig',
      'generatedGlobs',
      'lintConfig',
      'packConfig',
      'runConfig',
      'sortRules',
      'sourceConditions',
      'stagedConfig',
      'stealthDefaults',
      'stylesheetExports',
      'testConfig',
    ])
  })

  it('exports the builders as functions and the rule sets as data', () => {
    const builders = ['formatConfig', 'lintConfig', 'packConfig', 'runConfig', 'testConfig']
    const exported = new Map(Object.entries(vite))

    for (const name of builders) {
      expect(typeof exported.get(name), name).toBe('function')
    }
    expect(vite.SOURCE_CONDITION).toBe('stealth-source')
    expect(typeof vite.SIZE_RULES, 'a rule set is data a caller can read').toBe('object')
  })
})
