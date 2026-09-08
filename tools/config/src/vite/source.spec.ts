import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vite-plus/test'

import { serverSourceConditions, sourceConditions } from './source.ts'

const CONDITION = 'ui-source'

describe('sourceConditions', () => {
  it('puts the repository condition ahead of the defaults Vite would otherwise lose', () => {
    const conditions = sourceConditions(CONDITION)

    expect(conditions[0]).toBe(CONDITION)
    expect(conditions).toContain('module')
    expect(conditions).toContain('browser')
    expect(conditions.length).toBeGreaterThan(2)
  })

  it('takes the name from the caller, so two repositories never share one condition', () => {
    expect(sourceConditions('platform-source')[0]).toBe('platform-source')
    expect(sourceConditions(CONDITION)[0]).toBe(CONDITION)
  })

  it('leaves the condition out of the tsconfig it ships, which every repository extends', () => {
    const config = JSON.parse(
      readFileSync(new URL('../../tsconfig/base.json', import.meta.url), 'utf8'),
    ) as { compilerOptions: { customConditions?: string[] } }

    expect(
      config.compilerOptions.customConditions,
      'a shared base cannot name a condition that belongs to one repository',
    ).toBeUndefined()
  })
})

describe('serverSourceConditions', () => {
  it('puts the repository condition ahead of the defaults Node resolves with', () => {
    const conditions = serverSourceConditions(CONDITION)

    expect(conditions[0]).toBe(CONDITION)
    expect(conditions).toContain('node')
    expect(conditions, 'the browser condition belongs to the other resolver').not.toContain(
      'browser',
    )
  })
})
