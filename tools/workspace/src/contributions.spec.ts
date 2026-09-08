import { describe, expect, it } from 'vite-plus/test'

import { array, looseObject, type SchemaOf, string } from '@stealthscale/core-schema'
import { packageFiles, scratchWorkspace, workspaceFiles } from '@stealthscale/tool-testing'

import { contributions } from './contributions.ts'
import { type Manifest, workspaceManifests } from './manifests.ts'

/** What a package writes to declare itself a theme, standing in for core-theme's own. */
interface Theme {
  recipe: string
  title: string
}

/** What a package writes to say what a appearance draws with, in the members this file needs. */
interface Appearance {
  stylesheets: readonly string[]
}

const THEME: SchemaOf<Theme> = looseObject({ recipe: string(), title: string() })
const APPEARANCE: SchemaOf<Appearance> = looseObject({ stylesheets: array(string()) })

/**
 * Reads a workspace whose packages register the fields given, and removes it afterwards.
 */
function reading<Value>(
  registered: Record<string, unknown>,
  key: string,
  schema: SchemaOf<Value>,
): ReturnType<typeof contributions<Value>> {
  const files: Record<string, string> = { ...workspaceFiles(['packages/*']) }
  for (const [directory, stealth] of Object.entries(registered)) {
    Object.assign(
      files,
      packageFiles(`packages/${directory}`, { name: `@t/${directory}`, stealth }),
    )
  }
  const workspace = scratchWorkspace(files)

  try {
    return contributions(workspaceManifests(workspace.root), key, schema)
  } finally {
    workspace.remove()
  }
}

describe('contributions', () => {
  it('answers every package that registered the kind asked for, in workspace order', () => {
    const read = reading(
      {
        alpha: { theme: { recipe: './src/recipe.ts', title: 'Alpha' } },
        beta: { appearance: { stylesheets: ['./src/base.css'] } },
        gamma: { theme: { recipe: './recipe.ts', title: 'Gamma' } },
      },
      'theme',
      THEME,
    )

    expect(read.ok).toBe(true)
    if (!read.ok) return
    expect(read.value.map(({ value }) => value.title)).toEqual(['Alpha', 'Gamma'])
    expect(read.value.map(({ manifest }) => manifest.name)).toEqual(['@t/alpha', '@t/gamma'])
  })

  it('reads another key of the same field without minding what the others hold', () => {
    const read = reading(
      {
        alpha: { appearance: { stylesheets: ['./src/base.css'] }, theme: { title: 47 } },
        beta: {},
      },
      'appearance',
      APPEARANCE,
    )

    expect(read.ok).toBe(true)
    if (!read.ok) return
    expect(read.value).toHaveLength(1)
    expect(read.value[0]?.value.stylesheets).toEqual(['./src/base.css'])
  })

  it('carries the manifest, so a caller resolves a path in the contribution against it', () => {
    const read = reading(
      { alpha: { theme: { recipe: './src/recipe.ts', title: 'A' } } },
      'theme',
      THEME,
    )

    expect(read.ok).toBe(true)
    if (!read.ok) return
    expect(read.value[0]?.manifest.directory).toMatch(/packages\/alpha$/u)
  })

  it('leaves out a package that registers nothing at all', () => {
    const workspace = scratchWorkspace({
      ...workspaceFiles(['packages/*']),
      ...packageFiles('packages/plain', { name: '@t/plain' }),
    })

    const read = contributions(workspaceManifests(workspace.root), 'theme', THEME)

    expect(read).toEqual({ ok: true, value: [] })
    workspace.remove()
  })

  it('refuses a contribution that does not fit the schema, naming the package and the field', () => {
    const read = reading({ alpha: { theme: { recipe: './r.ts' } } }, 'theme', THEME)

    expect(read.ok).toBe(false)
    if (read.ok) return
    expect(read.failure.map(({ path }) => path)).toEqual(['@t/alpha.stealth.theme.title'])
  })

  it('refuses a stealth field that is not an object, whatever key was asked for', () => {
    const read = reading({ alpha: 5 }, 'theme', THEME)

    expect(read.ok).toBe(false)
    if (read.ok) return
    expect(read.failure).toHaveLength(1)
    expect(read.failure[0]?.path).toBe('@t/alpha.stealth')
    expect(read.failure[0]?.code).toBe('record')
  })

  it('reports every package at once rather than stopping at the first', () => {
    const read = reading(
      {
        alpha: { theme: { recipe: 12, title: 'Alpha' } },
        beta: { theme: { recipe: './r.ts', title: 'Beta' } },
        gamma: 'nonsense',
      },
      'theme',
      THEME,
    )

    expect(read.ok).toBe(false)
    if (read.ok) return
    expect(read.failure.map(({ path }) => path)).toEqual([
      '@t/alpha.stealth.theme.recipe',
      '@t/gamma.stealth',
    ])
  })

  it('answers nothing for a workspace with no packages', () => {
    expect(contributions([] as readonly Manifest[], 'theme', THEME)).toEqual({
      ok: true,
      value: [],
    })
  })
})
