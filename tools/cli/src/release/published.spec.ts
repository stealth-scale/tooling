import { describe, expect, it } from 'vite-plus/test'

import {
  DEPENDENCY_BLOCKS,
  overridden,
  publishedManifest,
  rangeFor,
  resolvedRanges,
} from '#release/published.ts'

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

describe('overridden', () => {
  it('publishes the built paths a manifest names for publishing, not the source it works on', () => {
    const declared = {
      bin: { stealth: './src/bin/stealth.ts' },
      exports: { '.': { default: './dist/index.mjs', 'tooling-source': './src/index.ts' } },
      publishConfig: {
        access: 'public',
        bin: { stealth: './dist/bin/stealth.mjs' },
        exports: { '.': './dist/index.mjs' },
      },
    }

    expect(overridden(declared)).toMatchObject({
      bin: { stealth: './dist/bin/stealth.mjs' },
      exports: { '.': './dist/index.mjs' },
    })
  })

  it('leaves what npm reads off the tarball where npm reads it', () => {
    const declared = { publishConfig: { access: 'public', registry: 'https://example.test' } }
    const written = overridden(declared)

    expect(written['publishConfig'], 'access decides whether the package is public').toEqual(
      declared.publishConfig,
    )
    expect(Object.keys(written), 'and neither becomes a field of its own').toEqual([
      'publishConfig',
    ])
  })

  it('leaves a manifest that overrides nothing exactly as it was', () => {
    const declared = { name: 'x', version: '0.1.0' }

    expect(overridden(declared)).toEqual(declared)
    expect(overridden({ ...declared, publishConfig: 'wrong' })).toEqual({
      ...declared,
      publishConfig: 'wrong',
    })
  })
})

describe('publishedManifest', () => {
  it('does both jobs: the published fields, and a real range for the protocol', () => {
    const declared = {
      bin: { stealth: './src/bin/stealth.ts' },
      dependencies: { '@stealthscale/core-theme': 'workspace:^' },
      publishConfig: { access: 'public', bin: { stealth: './dist/bin/stealth.mjs' } },
    }

    expect(publishedManifest(declared, VERSIONS)).toMatchObject({
      bin: { stealth: './dist/bin/stealth.mjs' },
      dependencies: { '@stealthscale/core-theme': '^0.1.0' },
    })
  })
})
