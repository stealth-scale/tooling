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
  /** Names the package, where the directory it sits in does not decide it. */
  name?: string
  stealth: unknown
}

/** Names what every theme package exports, as `core-theme` declares it. */
const THEME_EXPORTS = { './*.css': './dist/*.css', './values': './dist/values.mjs' }

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
 * Builds a theme package: the value its attribute takes, its title, and the artefacts every
 * theme exports. The name is the title in lower case, so a case naming one names both.
 */
function theme(
  title: unknown,
  exports: Readonly<Record<string, unknown>> = THEME_EXPORTS,
): Package {
  return { exports, stealth: { theme: { name: String(title).toLowerCase(), title } } }
}

/**
 * Builds a workspace whose packages register and export what the fields say.
 *
 * A directory under `node_modules` is a package the repository installed rather than one it
 * holds, which is how a consumer of the toolchain has every theme it draws.
 */
function workspaceOf(
  packages: Record<string, Package>,
  root: Readonly<Record<string, unknown>> = {},
): ScratchWorkspace {
  const files: Record<string, string> = {
    ...workspaceFiles(['foundations/*', 'components/*', 'themes/*'], root),
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
  it('finds every theme and names it as the package that registered it states', () => {
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

  it('names a theme what its manifest says rather than the directory holding it', () => {
    const scratch = workspaceOf({ 'themes/package': theme('Kalon') })

    // The two disagree here on purpose: the value a document writes is what the theme's own
    // build scoped its stylesheet to, and only the manifest carries that to a consumer.
    expect(readingOf(scratch).themes[0]?.name).toBe('kalon')
    scratch.remove()
  })

  it('finds a theme the repository installed, which is how a consumer has any at all', () => {
    const scratch = workspaceOf(
      {
        'node_modules/@s/theme-ember': { ...theme('Ember'), name: '@s/theme-ember' },
        'themes/kalon': theme('Kalon'),
      },
      { devDependencies: { '@s/theme-ember': '^1' } },
    )

    const { themes } = readingOf(scratch)

    expect(
      themes.map(({ name }) => name),
      'workspace first, then what is installed',
    ).toEqual(['kalon', 'ember'])
    expect(themes[1]?.stylesheet).toBe(scratch.path('node_modules/@s/theme-ember/dist/scoped.css'))
    scratch.remove()
  })

  it('draws the theme on disk where a repository develops one it also depends on', () => {
    const scratch = workspaceOf(
      {
        'node_modules/@t/themes-kalon': { ...theme('Installed'), name: '@t/themes-kalon' },
        'themes/kalon': theme('Kalon'),
      },
      { devDependencies: { '@t/themes-kalon': '^1' } },
    )

    const { themes } = readingOf(scratch)

    expect(themes, 'the installed copy is the same package, so it registers once').toHaveLength(1)
    expect(themes[0]?.title).toBe('Kalon')
    scratch.remove()
  })

  it('resolves every artefact the preview reads against the package that ships it', () => {
    const scratch = workspaceOf({ 'themes/kalon': theme('Kalon') })

    const { themes } = readingOf(scratch)

    expect(themes[0]?.values).toBe(scratch.path('themes/kalon/dist/values.mjs'))
    expect(themes[0]?.stylesheet).toBe(scratch.path('themes/kalon/dist/scoped.css'))
    expect(themes[0]?.fonts, 'a theme that brings its own faces loads them itself').toBe(
      scratch.path('themes/kalon/dist/fonts.css'),
    )
    scratch.remove()
  })

  it('reads the default of an entry written with conditions, since the artefact is generated', () => {
    const scratch = workspaceOf({
      'themes/kalon': theme('Kalon', {
        './*.css': './dist/*.css',
        './values': { default: './dist/values.mjs', 'ui-source': './src/values.ts' },
      }),
    })

    expect(readingOf(scratch).themes[0]?.values).toBe(scratch.path('themes/kalon/dist/values.mjs'))
    scratch.remove()
  })

  it('takes an exact entry over a pattern that would also match it', () => {
    const scratch = workspaceOf({
      'themes/kalon': theme('Kalon', {
        './*.css': './dist/*.css',
        './scoped.css': './dist/themed.css',
        './values': './dist/values.mjs',
      }),
    })

    expect(readingOf(scratch).themes[0]?.stylesheet).toBe(
      scratch.path('themes/kalon/dist/themed.css'),
    )
    expect(readingOf(scratch).themes[0]?.fonts, 'and the pattern serves the rest').toBe(
      scratch.path('themes/kalon/dist/fonts.css'),
    )
    scratch.remove()
  })

  it('refuses a theme that exports none of the artefacts the preview reads, naming each', () => {
    const scratch = workspaceOf({
      'themes/kalon': theme('Kalon', { './*.css': './dist/*.css' }),
      // No `exports` field at all, which is a different miss from one that exports nothing.
      'themes/thesmos': { stealth: { theme: { name: 'thesmos', title: 'Thesmos' } } },
    })

    expect(refusalsOf(scratch)).toEqual([
      '@t/themes-kalon.exports["./values"]: missing_export',
      '@t/themes-thesmos.exports["./fonts.css"]: missing_export',
      '@t/themes-thesmos.exports["./scoped.css"]: missing_export',
      '@t/themes-thesmos.exports["./values"]: missing_export',
    ])
    scratch.remove()
  })

  it('matches a pattern only past its own literal parts, the way Node resolves one', () => {
    const scratch = workspaceOf({
      'themes/kalon': theme('Kalon', { './*': './dist/*', './values': './dist/values.mjs' }),
    })

    const [kalon] = readingOf(scratch).themes

    expect(kalon?.stylesheet, 'a bare star matches any subpath').toBe(
      scratch.path('themes/kalon/dist/scoped.css'),
    )
    expect(kalon?.fonts).toBe(scratch.path('themes/kalon/dist/fonts.css'))
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
      '@t/themes-kalon.exports["./fonts.css"]: missing_export',
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
