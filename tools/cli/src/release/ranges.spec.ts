import { describe, expect, it } from 'vite-plus/test'

import { DEPENDENCY_BLOCKS, rangeFor, resolvedRanges } from '#release/ranges.ts'

/**
 * Holds the versions one release is going out at.
 */
const VERSIONS = new Map([
  ['@stealthscale/core-theme', '0.1.0'],
  ['@stealthscale/tool-config', '0.1.0'],
])

describe('rangeFor', () => {
  it('pins a star, since whatever the workspace holds means nothing off it', () => {
    expect(rangeFor('*', '0.1.0')).toBe('0.1.0')
    expect(rangeFor('', '0.1.0'), 'a bare protocol is the same ask').toBe('0.1.0')
  })

  it('takes the operator a caret or a tilde asked for', () => {
    expect(rangeFor('^', '0.1.0')).toBe('^0.1.0')
    expect(rangeFor('~', '0.1.0')).toBe('~0.1.0')
  })

  it('publishes a range somebody wrote by hand as they wrote it', () => {
    expect(rangeFor('>=0.1.0 <2', '0.1.0')).toBe('>=0.1.0 <2')
  })
})

describe('resolvedRanges', () => {
  it('writes the version being published, not the one a lockfile remembers', () => {
    const declared = { dependencies: { '@stealthscale/core-theme': 'workspace:^' } }

    expect(resolvedRanges(declared, VERSIONS)).toEqual({
      dependencies: { '@stealthscale/core-theme': '^0.1.0' },
    })
  })

  it('reaches every block a manifest declares a dependency in', () => {
    const declared = Object.fromEntries(
      DEPENDENCY_BLOCKS.map((block) => [block, { '@stealthscale/tool-config': 'workspace:^' }]),
    )
    const written = resolvedRanges(declared, VERSIONS)

    expect(Object.keys(written)).toEqual([...DEPENDENCY_BLOCKS])
    expect(Object.values(written)).toEqual(
      DEPENDENCY_BLOCKS.map(() => ({ '@stealthscale/tool-config': '^0.1.0' })),
    )
  })

  it('leaves a range that is not the protocol exactly as it was', () => {
    const declared = { dependencies: { react: '^19.0.0', valibot: 'catalog:' } }

    expect(resolvedRanges(declared, VERSIONS)).toEqual({
      dependencies: { react: '^19.0.0', valibot: 'catalog:' },
    })
  })

  it('leaves a protocol the release does not hold, so packing fails on it loudly', () => {
    const declared = { dependencies: { '@stealthscale/theme-base': 'workspace:^' } }

    expect(resolvedRanges(declared, VERSIONS)).toEqual({
      dependencies: { '@stealthscale/theme-base': 'workspace:^' },
    })
  })

  it('keeps everything a manifest holds that is not a dependency', () => {
    const declared = { exports: { '.': './dist/index.mjs' }, name: 'x', version: '0.1.0' }

    expect(resolvedRanges(declared, VERSIONS)).toEqual(declared)
  })

  it('leaves a block that is no object, and a range that is no string, as they were', () => {
    const declared = { dependencies: { '@stealthscale/core-theme': 5 }, devDependencies: 'wrong' }

    expect(resolvedRanges(declared, VERSIONS)).toEqual(declared)
  })
})
