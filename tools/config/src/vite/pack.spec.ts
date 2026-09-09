import { describe, expect, it } from 'vite-plus/test'

import { packConfig, stylesheetExports } from './pack.ts'

const CONDITION = 'ui-source'

/**
 * Names the callback form of `customExports`, which is what the automatic derivation is.
 */
type Derive = (
  exports: Record<string, unknown>,
  packed: { pkg: { files?: readonly string[] | undefined } },
) => Record<string, unknown>

/**
 * The exports options a pack config carries, typed for reading.
 *
 * The field is a union of a flag and an options object; a caller that has just built one
 * knows which it is, and the toolchain does not narrow it for them.
 *
 * @param exports - What `packConfig` put in its `exports` field.
 * @returns The options, with the two fields this spec reads.
 */
function asExports(exports: unknown): {
  bin?: unknown
  customExports?: unknown
  devExports?: unknown
} {
  return exports ?? {}
}

describe('stylesheetExports', () => {
  it('exports every stylesheet at the package root, and nothing under a directory', () => {
    expect(stylesheetExports(['dist', 'source.css'])).toEqual({ './source.css': './source.css' })
    expect(stylesheetExports(['dist', 'styles.css', 'src/*.css'])).toEqual({
      './styles.css': './styles.css',
    })
  })

  it('is empty for a package that ships none, named or not', () => {
    expect(stylesheetExports(['dist']), 'files without a stylesheet').toEqual({})
    expect(stylesheetExports(), 'no files at all').toEqual({})
  })
})

describe('packConfig', () => {
  it('checks a pack the way a registry and a consumer read it', () => {
    const pack = packConfig({ sourceCondition: CONDITION })

    expect(pack.attw, 'a CSS subpath resolves in no mode, and these are ESM-only').toEqual({
      excludeEntrypoints: [/\.css$/u],
      profile: 'esm-only',
    })
    expect(pack.publint, 'the manifest is read as a registry would').toBe(true)
    expect(pack.dts, 'declarations come from the native compiler').toEqual({ tsgo: true })
  })

  it('keeps the source condition out of every exports map, since a tarball ships no source', () => {
    expect(
      asExports(packConfig({ sourceCondition: CONDITION }).exports).devExports,
      'tsdown would write the pnpm layout with it, which neither npm nor bun applies',
    ).toBeUndefined()
    expect(
      asExports(packConfig({ sourceCondition: CONDITION, staticExports: {} }).exports).devExports,
    ).toBeUndefined()
  })

  it('derives a stylesheet export from the manifest when a package names none', () => {
    const derive = asExports(packConfig({ sourceCondition: CONDITION }).exports)
      .customExports as Derive

    expect(derive({ '.': './dist/index.mjs' }, { pkg: { files: ['dist', 'source.css'] } })).toEqual(
      { '.': './dist/index.mjs', './source.css': './source.css' },
    )
  })

  it('keeps what the build wrote when a package ships no stylesheet at all', () => {
    const derive = asExports(packConfig({ sourceCondition: CONDITION }).exports)
      .customExports as Derive

    expect(derive({ '.': './dist/index.mjs' }, { pkg: {} })).toEqual({ '.': './dist/index.mjs' })
  })

  it('names the commands a package installs, and leaves the naming alone with none', () => {
    const bin = { stealth: './src/bin/stealth.ts' }

    expect(asExports(packConfig({ bin, sourceCondition: CONDITION }).exports).bin).toEqual(bin)
    expect(
      asExports(packConfig({ sourceCondition: CONDITION }).exports).bin,
      'the pack step then names the command after the package',
    ).toBeUndefined()
  })

  it('carries a file a person wrote into the built package, where one names it', () => {
    const sheets = [{ from: 'src/*.css', to: 'dist' }]

    expect(packConfig({ copy: sheets, sourceCondition: CONDITION })).toMatchObject({ copy: sheets })
    expect(
      packConfig({ sourceCondition: CONDITION }),
      'a package that names none ships only what the build wrote',
    ).not.toHaveProperty('copy')
  })

  it('takes part in the pack itself, for a package that writes an artefact of its own', () => {
    const hooks = {
      'build:before': (): void => {
        // A package writes its own artefacts here; this one writes nothing.
      },
    }

    expect(packConfig({ hooks, sourceCondition: CONDITION })).toMatchObject({ hooks })
    expect(
      packConfig({ sourceCondition: CONDITION }),
      'a package that writes nothing of its own takes no part',
    ).not.toHaveProperty('hooks')
  })

  it('leaves what a plugin supplies at run time as an import, where a package names it', () => {
    const virtual = /^virtual:stealth\//u

    expect(packConfig({ neverBundle: [virtual], sourceCondition: CONDITION })).toMatchObject({
      deps: { neverBundle: [virtual] },
    })
    expect(
      packConfig({ sourceCondition: CONDITION }),
      'a package that names none bundles everything it imports',
    ).not.toHaveProperty('deps')
  })

  it('takes a package at its word, so a file no build writes survives the rewrite', () => {
    const named = { './tsconfig/base.json': './tsconfig/base.json' }

    expect(
      asExports(packConfig({ sourceCondition: CONDITION, staticExports: named }).exports)
        .customExports,
    ).toEqual(named)
  })
})
