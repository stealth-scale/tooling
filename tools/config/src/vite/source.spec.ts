import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vite-plus/test'

import { serverSourceConditions, SOURCE_CONDITION, sourceConditions } from './source.ts'

/** A Vite config, as far as this spec reads it. */
interface Resolving {
  resolve?: { conditions?: string[] }
  ssr?: { resolve?: { conditions?: string[] } }
}

describe('sourceConditions', () => {
  it('puts the workspace condition ahead of the defaults Vite would otherwise lose', () => {
    const conditions = sourceConditions()

    expect(conditions[0]).toBe(SOURCE_CONDITION)
    expect(conditions).toContain('module')
    expect(conditions).toContain('browser')
    expect(conditions.length).toBeGreaterThan(2)
  })

  it('is the condition the type checker turns on, in the tsconfig this package ships', () => {
    const config = JSON.parse(
      readFileSync(new URL('../../tsconfig/base.json', import.meta.url), 'utf8'),
    ) as { compilerOptions: { customConditions?: string[] } }

    expect(config.compilerOptions.customConditions).toEqual([SOURCE_CONDITION])
  })

  it('is what the repository root resolves with, through the defaults it spreads', async () => {
    const root = (await import('../../../../vite.config.ts')).default as Resolving

    expect(root.resolve?.conditions).toEqual(sourceConditions())
  })
})

describe('serverSourceConditions', () => {
  it('puts the workspace condition ahead of the defaults Node resolves with', () => {
    const conditions = serverSourceConditions()

    expect(conditions[0]).toBe(SOURCE_CONDITION)
    expect(conditions).toContain('node')
    expect(conditions, 'the browser condition belongs to the other resolver').not.toContain(
      'browser',
    )
  })

  it('reaches the resolver a specification loads another package through', async () => {
    const root = (await import('../../../../vite.config.ts')).default as Resolving

    expect(root.ssr?.resolve?.conditions).toEqual(serverSourceConditions())
  })
})
