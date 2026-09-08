import { describe, expect, it } from 'vite-plus/test'

import { recordingLogger } from '@stealthscale/core-logging'
import {
  packageFiles,
  type ScratchWorkspace,
  scratchWorkspace,
  workspaceFiles,
} from '@stealthscale/tool-testing'

import { offeredBy, type Registrations, registrations } from './registrations.ts'

/** Describes one package of a scratch workspace: what it registers, and what it exports. */
interface Package {
  exports?: Readonly<Record<string, unknown>>
  stealth: unknown
}

/** Names the two artefacts every theme package exports. */
const THEME_EXPORTS = { './scoped.css': './dist/scoped.css', './values': './dist/values.mjs' }

/** What a design system registers, in the entry core-appearance names. */
const DESIGN_SYSTEM: Package = {
  stealth: {
    appearance: {
      densities: ['comfortable', 'compact'],
      locales: ['en', 'nl-BE'],
      provider: './src/provider.tsx',
      stylesheets: ['./src/base.css'],
    },
  },
}

/**
 * Builds a theme package: its title, and the two artefacts every theme exports.
 */
function theme(
  title: unknown,
  exports: Readonly<Record<string, unknown>> = THEME_EXPORTS,
): Package {
  return { exports, stealth: { theme: { title } } }
}

/**
 * Builds a workspace whose packages register and export what the fields say.
 */
function workspaceOf(packages: Record<string, Package>): ScratchWorkspace {
  const files: Record<string, string> = {
    ...workspaceFiles(['foundations/*', 'components/*', 'themes/*']),
  }
  for (const [directory, fields] of Object.entries(packages)) {
    Object.assign(
      files,
      packageFiles(directory, { name: `@t/${directory.replace('/', '-')}`, ...fields }),
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
  it('finds every theme and names it after the directory that holds it', () => {
    const scratch = workspaceOf({
      'themes/kalon': theme('Kalon'),
      'themes/thesmos': theme('Thesmos'),
    })

    const { themes } = readingOf(scratch)

    expect(themes.map(({ name }) => name)).toEqual(['kalon', 'thesmos'])
    expect(themes.map(({ title }) => title)).toEqual(['Kalon', 'Thesmos'])
    expect(themes.map(({ package: name }) => name)).toEqual([
      '@t/themes-kalon',
      '@t/themes-thesmos',
    ])
    scratch.remove()
  })

  it("resolves a theme's table and its scoped stylesheet against the package that ships them", () => {
    const scratch = workspaceOf({ 'themes/kalon': theme('Kalon') })

    const { themes } = readingOf(scratch)

    expect(themes[0]?.values).toBe(scratch.path('themes/kalon/dist/values.mjs'))
    expect(themes[0]?.stylesheet).toBe(scratch.path('themes/kalon/dist/scoped.css'))
    scratch.remove()
  })

  it('reads the default of an entry written with conditions, since the artefact is generated', () => {
    const scratch = workspaceOf({
      'themes/kalon': theme('Kalon', {
        './scoped.css': './dist/scoped.css',
        './values': { default: './dist/values.mjs', 'ui-source': './src/values.ts' },
      }),
    })

    expect(readingOf(scratch).themes[0]?.values).toBe(scratch.path('themes/kalon/dist/values.mjs'))
    scratch.remove()
  })

  it('refuses a theme that exports no table or no scoped stylesheet, naming each entry', () => {
    const scratch = workspaceOf({
      'themes/kalon': theme('Kalon', { './scoped.css': './dist/scoped.css' }),
      'themes/thesmos': { stealth: { theme: { title: 'Thesmos' } } },
    })

    expect(refusalsOf(scratch)).toEqual([
      '@t/themes-kalon.exports["./values"]: missing_export',
      '@t/themes-thesmos.exports["./scoped.css"]: missing_export',
      '@t/themes-thesmos.exports["./values"]: missing_export',
    ])
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
      'components/library': { stealth: { appearance: { densities: ['compact', 'touch'] } } },
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
    const scratch = workspaceOf({ 'components/library': { stealth: {} } })

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
      'components/library': { stealth: { appearance: { provider: './src/other.tsx' } } },
      'foundations/theme': DESIGN_SYSTEM,
    })

    expect(refusalsOf(scratch)).toEqual([
      '@t/components-library.stealth.appearance.provider: one_provider',
    ])
    scratch.remove()
  })

  it('reports a second provider and a theme missing an artefact in one reading', () => {
    const scratch = workspaceOf({
      'components/library': { stealth: { appearance: { provider: './src/other.tsx' } } },
      'foundations/theme': DESIGN_SYSTEM,
      'themes/kalon': theme('Kalon', {}),
    })

    expect(refusalsOf(scratch)).toEqual([
      '@t/components-library.stealth.appearance.provider: one_provider',
      '@t/themes-kalon.exports["./scoped.css"]: missing_export',
      '@t/themes-kalon.exports["./values"]: missing_export',
    ])
    scratch.remove()
  })

  it('reports a malformed theme and a malformed appearance in one reading', () => {
    const scratch = workspaceOf({
      'foundations/theme': { stealth: { appearance: { densities: 'compact' } } },
      'themes/kalon': theme(12),
    })

    expect(refusalsOf(scratch)).toEqual([
      '@t/foundations-theme.stealth.appearance.densities: array',
      '@t/themes-kalon.stealth.theme.title: string',
    ])
    scratch.remove()
  })

  it('refuses a malformed appearance while every theme is well formed', () => {
    const scratch = workspaceOf({
      'foundations/theme': { stealth: { appearance: { provider: 12 } } },
      'themes/kalon': theme('Kalon'),
    })

    expect(refusalsOf(scratch)).toEqual([
      '@t/foundations-theme.stealth.appearance.provider: string',
    ])
    scratch.remove()
  })

  it('reports what it registered, so a build says what it found rather than only failing', () => {
    const scratch = workspaceOf({
      'foundations/theme': DESIGN_SYSTEM,
      'themes/kalon': theme('Kalon'),
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
      'themes/kalon': theme('Kalon'),
    })

    expect(offeredBy(readingOf(scratch))).toEqual({
      densities: ['comfortable', 'compact'],
      locales: ['en', 'nl-BE'],
      themes: ['kalon'],
    })
    scratch.remove()
  })
})
