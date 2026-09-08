import { describe, expect, it } from 'vite-plus/test'

import { packConfig, stylesheetExports } from './pack.ts'
import { SOURCE_CONDITION } from './source.ts'

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
    const pack = packConfig()

    expect(pack.attw, 'a CSS subpath resolves in no mode, and these are ESM-only').toEqual({
      excludeEntrypoints: [/\.css$/u],
      profile: 'esm-only',
    })
    expect(pack.publint, 'the manifest is read as a registry would').toBe(true)
    expect(pack.dts, 'declarations come from the native compiler').toEqual({ tsgo: true })
  })

  it('writes the source condition into every exports map', () => {
    expect(asExports(packConfig().exports).devExports).toBe(SOURCE_CONDITION)
    expect(asExports(packConfig({ staticExports: {} }).exports).devExports).toBe(SOURCE_CONDITION)
  })

  it('derives a stylesheet export from the manifest when a package names none', () => {
    const derive = asExports(packConfig().exports).customExports as Derive

    expect(derive({ '.': './dist/index.mjs' }, { pkg: { files: ['dist', 'source.css'] } })).toEqual(
      { '.': './dist/index.mjs', './source.css': './source.css' },
    )
  })

  it('keeps what the build wrote when a package ships no stylesheet at all', () => {
    const derive = asExports(packConfig().exports).customExports as Derive

    expect(derive({ '.': './dist/index.mjs' }, { pkg: {} })).toEqual({ '.': './dist/index.mjs' })
  })

  it('names the commands a package installs, and leaves the naming alone with none', () => {
    const bin = { stealth: './src/bin/stealth.ts' }

    expect(asExports(packConfig({ bin }).exports).bin).toEqual(bin)
    expect(
      asExports(packConfig().exports).bin,
      'the pack step then names the command after the package',
    ).toBeUndefined()
  })

  it('takes a package at its word, so a file no build writes survives the rewrite', () => {
    const named = { './tsconfig/base.json': './tsconfig/base.json' }

    expect(asExports(packConfig({ staticExports: named }).exports).customExports).toEqual(named)
  })
})
