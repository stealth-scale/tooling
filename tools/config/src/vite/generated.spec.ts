import { describe, expect, it } from 'vite-plus/test'

import { GENERATED, generatedGlobs } from './generated.ts'

describe('GENERATED', () => {
  it('names what a build writes, and nothing a person edits', () => {
    expect(GENERATED).toEqual([
      '**/dist/**',
      '**/coverage/**',
      '**/storybook-static/**',
      '**/.scratch/**',
      '**/*.gen.*',
      '**/*.config.d.ts',
      '**/CHANGELOG.md',
    ])
  })

  it('keeps a running catalogue out of the working directory it writes notes to', () => {
    expect(GENERATED, 'a catalogue built into .scratch reloads every client').toContain(
      '**/.scratch/**',
    )
  })

  it('keeps the changelog out, since refusing what changesets wrote blocks the release', () => {
    expect(GENERATED, 'the version commit lands on main and the check runs on it').toContain(
      '**/CHANGELOG.md',
    )
  })
})

describe('generatedGlobs', () => {
  it('is the shared list when a repository generates nothing of its own', () => {
    expect(generatedGlobs()).toEqual([...GENERATED])
  })

  it('appends rather than replaces, so a repository cannot lose the shared globs', () => {
    expect(generatedGlobs(['**/src/translations/**'])).toEqual([
      ...GENERATED,
      '**/src/translations/**',
    ])
  })

  it('copies, so a caller cannot mutate the shared list through the result', () => {
    const before = GENERATED.length

    generatedGlobs().push('**/oops/**')

    expect(GENERATED).toHaveLength(before)
  })
})
