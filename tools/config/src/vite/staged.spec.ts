import { describe, expect, it } from 'vite-plus/test'

import { stagedConfig } from './staged.ts'

describe('stagedConfig', () => {
  it('runs one command over every text format the repositories hold', () => {
    expect(stagedConfig()).toEqual({
      '*.{ts,tsx,js,mjs,cjs,json,css,md,yaml,yml}': 'vp check --fix',
    })
  })

  it('applies what the formatter and the linter can fix rather than only reporting it', () => {
    expect(Object.values(stagedConfig())).toEqual(['vp check --fix'])
  })

  it('takes a repository at its word about which extensions it holds', () => {
    expect(stagedConfig({ extensions: ['ts', 'md'] })).toEqual({
      '*.{ts,md}': 'vp check --fix',
    })
  })
})
