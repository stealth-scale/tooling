import { describe, expect, it } from 'vite-plus/test'

import { GENERATED, generatedGlobs } from './generated.ts'

describe('GENERATED', () => {
  it('names what a build writes, and nothing a person edits', () => {
    expect(GENERATED).toEqual(['**/dist/**', '**/coverage/**', '**/*.gen.*', '**/*.config.d.ts'])
  })
})

describe('generatedGlobs', () => {
  it('is the shared list when a repository generates nothing of its own', () => {
    expect(generatedGlobs()).toEqual([...GENERATED])
  })

  it('appends rather than replaces, so a repository cannot lose the shared globs', () => {
    expect(generatedGlobs(['**/storybook-static/**'])).toEqual([
      ...GENERATED,
      '**/storybook-static/**',
    ])
  })

  it('copies, so a caller cannot mutate the shared list through the result', () => {
    const before = GENERATED.length

    generatedGlobs().push('**/oops/**')

    expect(GENERATED).toHaveLength(before)
  })
})
