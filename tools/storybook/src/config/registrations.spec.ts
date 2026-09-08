import { describe, expect, it } from 'vite-plus/test'

import { recordingLogger } from '@stealthscale/core-logging'
import {
  packageFiles,
  type ScratchWorkspace,
  scratchWorkspace,
  workspaceFiles,
} from '@stealthscale/tool-testing'

import { offeredBy, type Registrations, registrations } from './registrations.ts'

/** What a design system registers, in the entry core-appearance names. */
const DESIGN_SYSTEM = {
  appearance: {
    densities: ['comfortable', 'compact'],
    locales: ['en', 'nl-BE'],
    provider: './src/provider.tsx',
    stylesheets: ['./src/base.css'],
  },
}

/**
 * Builds a workspace whose packages register what the fields say.
 */
function workspaceOf(registered: Record<string, unknown>): ScratchWorkspace {
  const files: Record<string, string> = {
    ...workspaceFiles(['foundations/*', 'components/*', 'themes/*']),
  }
  for (const [directory, stealth] of Object.entries(registered)) {
    Object.assign(
      files,
      packageFiles(directory, { name: `@t/${directory.replace('/', '-')}`, stealth }),
    )
  }
  return scratchWorkspace(files)
}

/**
 * Reads a scratch workspace and answers what it registered, failing the case on a refusal.
 */
function readingOf(scratch: ScratchWorkspace): Registrations {
  const read = registrations(scratch.root)
  if (!read.ok) throw new Error(`refused: ${read.failure.map((issue) => issue.path).join(', ')}`)
  return read.value
}

/**
 * Reads a scratch workspace and answers every refusal, as its path and its code.
 */
function refusalsOf(scratch: ScratchWorkspace): string[] {
  const read = registrations(scratch.root)
  return read.ok ? [] : read.failure.map(({ code, path }) => `${path}: ${code}`)
}

describe('registrations', () => {
  it('finds every theme, names it after its directory and resolves its recipe', () => {
    const scratch = workspaceOf({
      'themes/kalon': { theme: { recipe: './src/recipe.ts', title: 'Kalon' } },
      'themes/thesmos': { theme: { recipe: './src/recipe.ts', title: 'Thesmos' } },
    })

    const { themes } = readingOf(scratch)

    expect(themes.map(({ name }) => name)).toEqual(['kalon', 'thesmos'])
    expect(themes.map(({ title }) => title)).toEqual(['Kalon', 'Thesmos'])
    expect(themes[0]?.recipe).toBe(scratch.path('themes/kalon/src/recipe.ts'))
    scratch.remove()
  })

  it('gathers what the preview draws with, resolving each stylesheet against its package', () => {
    const scratch = workspaceOf({ 'foundations/theme': DESIGN_SYSTEM })

    const { appearance } = readingOf(scratch)

    expect(appearance.densities).toEqual(['comfortable', 'compact'])
    expect(appearance.locales).toEqual(['en', 'nl-BE'])
    expect(appearance.provider).toBe(scratch.path('foundations/theme/src/provider.tsx'))
    expect(appearance.stylesheets).toEqual([scratch.path('foundations/theme/src/base.css')])
    scratch.remove()
  })

  it('adds what a second package contributes without repeating what the first did', () => {
    const scratch = workspaceOf({
      'components/library': { appearance: { densities: ['compact', 'touch'] } },
      'foundations/theme': DESIGN_SYSTEM,
    })

    const { appearance } = readingOf(scratch)

    expect(appearance.densities, 'workspace order, each once').toEqual([
      'comfortable',
      'compact',
      'touch',
    ])
    scratch.remove()
  })

  it('answers nothing to draw with for a workspace where no package registers', () => {
    const scratch = workspaceOf({ 'components/library': {} })

    const { appearance, themes } = readingOf(scratch)

    expect(themes).toEqual([])
    expect(appearance).toEqual({
      densities: [],
      locales: [],
      provider: undefined,
      stylesheets: [],
    })
    scratch.remove()
  })

  it('refuses a second provider, naming the package that registered it', () => {
    const scratch = workspaceOf({
      'components/library': { appearance: { provider: './src/other.tsx' } },
      'foundations/theme': DESIGN_SYSTEM,
    })

    expect(refusalsOf(scratch)).toEqual([
      '@t/components-library.stealth.appearance.provider: one_provider',
    ])
    scratch.remove()
  })

  it('reports a malformed theme and a malformed appearance in one reading', () => {
    const scratch = workspaceOf({
      'foundations/theme': { appearance: { densities: 'compact' } },
      'themes/kalon': { theme: { title: 'Kalon' } },
    })

    expect(refusalsOf(scratch)).toEqual([
      '@t/foundations-theme.stealth.appearance.densities: array',
      '@t/themes-kalon.stealth.theme.recipe: loose_object',
    ])
    scratch.remove()
  })

  it('refuses a malformed appearance while every theme is well formed', () => {
    const scratch = workspaceOf({
      'foundations/theme': { appearance: { provider: 12 } },
      'themes/kalon': { theme: { recipe: './src/recipe.ts', title: 'Kalon' } },
    })

    expect(refusalsOf(scratch)).toEqual([
      '@t/foundations-theme.stealth.appearance.provider: string',
    ])
    scratch.remove()
  })

  it('reports what it registered, so a build says what it found rather than only failing', () => {
    const scratch = workspaceOf({
      'foundations/theme': DESIGN_SYSTEM,
      'themes/kalon': { theme: { recipe: './src/recipe.ts', title: 'Kalon' } },
    })
    const log = recordingLogger()

    registrations(scratch.root, log)

    expect(log.records.map(({ message }) => message)).toEqual([
      'registered the provider every story is wrapped in',
      'registered a theme',
    ])
    expect(log.records[1]?.fields).toMatchObject({ name: 'kalon' })
    scratch.remove()
  })
})

describe('offeredBy', () => {
  it('offers the densities and locales declared, and every theme found', () => {
    const scratch = workspaceOf({
      'foundations/theme': DESIGN_SYSTEM,
      'themes/kalon': { theme: { recipe: './src/recipe.ts', title: 'Kalon' } },
    })

    expect(offeredBy(readingOf(scratch))).toEqual({
      densities: ['comfortable', 'compact'],
      locales: ['en', 'nl-BE'],
      themes: ['kalon'],
    })
    scratch.remove()
  })
})
