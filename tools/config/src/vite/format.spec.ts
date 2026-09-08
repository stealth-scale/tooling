import { describe, expect, it } from 'vite-plus/test'

import { formatConfig } from './format.ts'
import { GENERATED } from './generated.ts'

describe('formatConfig', () => {
  it('settles the taste every repository would otherwise argue again', () => {
    expect(formatConfig()).toEqual({
      ignorePatterns: [...GENERATED],
      printWidth: 100,
      semi: false,
      singleQuote: true,
      sortPackageJson: true,
    })
  })

  it('wraps at the width the docblock rules assume unless a repository says otherwise', () => {
    expect(formatConfig().printWidth, 'the shared width').toBe(100)
    expect(formatConfig({ printWidth: 120 }).printWidth, 'overridden').toBe(120)
  })

  it("adds a repository's own generated paths to the shared ones", () => {
    expect(formatConfig({ ignore: ['**/src/translations/**'] }).ignorePatterns).toEqual([
      ...GENERATED,
      '**/src/translations/**',
    ])
  })
})
