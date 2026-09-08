/**
 * @fileoverview Reads a workspace once and answers everything the preview draws with: which
 * packages are themes, which module wraps every story, which stylesheets come before any
 * theme, and what a toolbar may offer. The words themselves belong to the packages that own
 * them, `core-theme` and `core-appearance`; this is the one place that puts a reading of them
 * together and turns each declared path into one a bundler can resolve.
 */

import { basename, resolve } from 'node:path'

import {
  APPEARANCE_CONTRIBUTION,
  APPEARANCE_KEY,
  type AppearanceContribution,
  type Offered,
} from '@stealthscale/core-appearance'
import { type Logger, SILENT } from '@stealthscale/core-logging'
import { refused, type Result, succeeded } from '@stealthscale/core-result'
import {
  type FieldIssue,
  looseObject,
  record,
  safeParse,
  string,
  union,
  unknown,
} from '@stealthscale/core-schema'
import { THEME_CONTRIBUTION, THEME_KEY, type ThemeContribution } from '@stealthscale/core-theme'
import { contributions, type Registered, workspaceManifests } from '@stealthscale/tool-workspace'

/**
 * Names what a reading refuses with: one entry per malformed field, each path naming the
 * package that wrote it.
 */
type Refusals = readonly FieldIssue[]

/**
 * Names the two entries a theme package exports and the preview imports: the stylesheet that
 * declares its tokens behind its attribute, and the module holding its solved table.
 */
const THEME_ARTEFACTS = { stylesheet: './scoped.css', values: './values' } as const

/**
 * Accepts an `exports` map in the shape a manifest writes it.
 */
const EXPORTS = record(string(), unknown())

/**
 * Accepts one entry of an `exports` map: a path, or a conditions object naming a `default`.
 */
const TARGET = union([string(), looseObject({ default: string() })])

/**
 * Describes one theme a workspace holds.
 */
export interface ThemeRegistration {
  /**
   * Carries the value written to the document's theme attribute, which is the basename of the
   * package's directory: `themes/thesmos` gives `thesmos`.
   */
  name: string

  /**
   * Names the package that registered it.
   */
  package: string

  /**
   * Names the stylesheet that declares the theme's tokens behind its `data-theme` attribute,
   * absolute. It is what the package exports at `./scoped.css`.
   */
  stylesheet: string

  /**
   * Carries the name a person picks the theme by.
   */
  title: string

  /**
   * Names the module whose `values` export is the solved table, absolute. It is what the
   * package exports at `./values`.
   */
  values: string
}

/**
 * Describes what the preview draws every story with, gathered from every package that
 * registered an appearance entry.
 */
export interface AppearanceRegistration {
  /**
   * Lists the densities on offer, each once, in workspace order. The first is the default.
   */
  densities: readonly string[]

  /**
   * Lists the locales on offer, each once, in workspace order. The first is the fallback.
   */
  locales: readonly string[]

  /**
   * Names the provider module, absolute. It is `undefined` where no package registers one,
   * and the preview then wraps a story in nothing.
   */
  provider: string | undefined

  /**
   * Names the stylesheets to load before any theme, absolute, in workspace order.
   */
  stylesheets: readonly string[]
}

/**
 * Describes what one reading of a workspace found registered.
 */
export interface Registrations {
  /**
   * Carries what the preview draws every story with.
   */
  appearance: AppearanceRegistration

  /**
   * Lists every theme, in workspace order.
   */
  themes: readonly ThemeRegistration[]
}

/**
 * Reports a second package registering a provider, which the preview cannot obey: one module
 * wraps every story.
 *
 * @param {string} name - The package that registered the second one.
 * @param {string} first - The package that registered the first.
 * @returns {FieldIssue} The refusal, pointing at the second package's own field.
 */
function secondProvider(name: string, first: string): FieldIssue {
  return {
    code: 'one_provider',
    params: { first, second: name },
    path: `${name}.stealth.${APPEARANCE_KEY}.provider`,
    reason: `A provider is registered by ${first}`,
  }
}

/**
 * Collects a list every package contributed, each entry once, in workspace order.
 *
 * @param {readonly Registered<AppearanceContribution>[]} registered - Every appearance entry.
 * @param {'densities' | 'locales'} field - The member to collect.
 * @returns {string[]} The values, each once.
 */
function gathered(
  registered: readonly Registered<AppearanceContribution>[],
  field: 'densities' | 'locales',
): string[] {
  const found: string[] = []

  for (const { value } of registered) {
    for (const entry of value[field] ?? []) {
      if (!found.includes(entry)) found.push(entry)
    }
  }

  return found
}

/**
 * Resolves every stylesheet against the package that registered it.
 *
 * @param {readonly Registered<AppearanceContribution>[]} registered - Every appearance entry.
 * @returns {string[]} The stylesheets, absolute, in workspace order.
 */
function stylesheetsOf(registered: readonly Registered<AppearanceContribution>[]): string[] {
  const found: string[] = []

  for (const { manifest, value } of registered) {
    for (const sheet of value.stylesheets ?? []) found.push(resolve(manifest.directory, sheet))
  }

  return found
}

/**
 * Resolves the provider against the package that registered it, and reports it.
 *
 * @param {Registered<AppearanceContribution>} registered - The entry that names the provider.
 * @param {Logger} log - Where the reading reports what it found.
 * @returns {string} The provider module, absolute.
 */
function resolvedProvider(
  { manifest, value }: Registered<AppearanceContribution>,
  log: Logger,
): string {
  const module = resolve(manifest.directory, String(value.provider))
  log.info('registered the provider every story is wrapped in', { module, package: manifest.name })
  return module
}

/**
 * Settles which module wraps every story.
 *
 * @param {readonly Registered<AppearanceContribution>[]} registered - Every appearance entry.
 * @param {Logger} log - Where the reading reports what it found.
 * @returns {Result<string | undefined, Refusals>} The provider module, absolute. It is
 *     `undefined` where no package registers one. One refusal per package beyond the first.
 */
function providerOf(
  registered: readonly Registered<AppearanceContribution>[],
  log: Logger,
): Result<string | undefined, Refusals> {
  const [first, ...rest] = registered.filter(({ value }) => value.provider !== undefined)
  if (first !== undefined && rest.length > 0) {
    return refused(rest.map(({ manifest }) => secondProvider(manifest.name, first.manifest.name)))
  }

  return succeeded(first === undefined ? undefined : resolvedProvider(first, log))
}

/**
 * Reads where one entry of an `exports` map points, relative to the package.
 *
 * The map is read rather than the package resolved by name, because a bare import in a
 * module the plugin serves is resolved from the repository's root, and the root depends on
 * no theme. A conditions object gives its `default`: the artefact is generated, so no
 * condition points anywhere else.
 *
 * @param {unknown} exports - The manifest's `exports` field, as written.
 * @param {string} entry - The entry to read: `./values`.
 * @returns {string | undefined} The path the entry names, or nothing where the map has no
 *     such entry or the entry names no path.
 */
function exportTarget(exports: unknown, entry: string): string | undefined {
  const map = safeParse(EXPORTS, exports)
  if (!map.ok) return undefined

  const target = safeParse(TARGET, map.value[entry])
  if (!target.ok) return undefined
  return typeof target.value === 'string' ? target.value : target.value.default
}

/**
 * Reports a theme that exports no entry the preview needs.
 *
 * @param {string} name - The package.
 * @param {string} entry - The entry it does not export: `./values`.
 * @returns {FieldIssue} The refusal, pointing at the package's exports map.
 */
function missingArtefact(name: string, entry: string): FieldIssue {
  return {
    code: 'missing_export',
    params: { entry },
    path: `${name}.exports["${entry}"]`,
    reason: `A theme exports its ${entry} entry`,
  }
}

/**
 * Turns a theme's entry into its registration, with both artefacts resolved against the
 * package that ships them.
 *
 * @param {Registered<ThemeContribution>} registered - The package's theme entry.
 * @param {Logger} log - Where the reading reports what it found.
 * @returns {Result<ThemeRegistration, Refusals>} The theme, named after the directory that
 *     holds it, or one refusal per artefact the package does not export.
 */
function themeOf(
  { manifest, value }: Registered<ThemeContribution>,
  log: Logger,
): Result<ThemeRegistration, Refusals> {
  const name = basename(manifest.directory)
  const stylesheet = exportTarget(manifest.exports, THEME_ARTEFACTS.stylesheet)
  const values = exportTarget(manifest.exports, THEME_ARTEFACTS.values)

  if (stylesheet === undefined || values === undefined) {
    return refused(
      Object.values(THEME_ARTEFACTS)
        .filter((entry) => exportTarget(manifest.exports, entry) === undefined)
        .map((entry) => missingArtefact(manifest.name, entry)),
    )
  }

  log.info('registered a theme', { name, package: manifest.name })
  return succeeded({
    name,
    package: manifest.name,
    stylesheet: resolve(manifest.directory, stylesheet),
    title: value.title,
    values: resolve(manifest.directory, values),
  })
}

/**
 * Reads a workspace and answers what its packages registered for Storybook.
 *
 * One reading answers the whole configuration, so nothing keeps a second list of the themes,
 * the stylesheets or what a toolbar offers. One reading reports every malformed field in
 * every package, because somebody fixing manifests wants the whole list. The one-provider
 * rule and the artefacts a theme exports are read off the entries, so both run once every
 * entry is well formed, and together.
 *
 * @param {string} root - The workspace root, absolute.
 * @param {Logger} [log] - Where the reading reports each registration. Default: `SILENT`,
 *     which writes nothing.
 * @returns {Result<Registrations, Refusals>} The reading, or every refusal with the package
 *     that wrote the field on each path.
 */
export function registrations(root: string, log: Logger = SILENT): Result<Registrations, Refusals> {
  const manifests = workspaceManifests(root)
  const appearance = contributions(manifests, APPEARANCE_KEY, APPEARANCE_CONTRIBUTION)
  const themes = contributions(manifests, THEME_KEY, THEME_CONTRIBUTION)
  if (!appearance.ok || !themes.ok) {
    return refused([
      ...(appearance.ok ? [] : appearance.failure),
      ...(themes.ok ? [] : themes.failure),
    ])
  }

  const provider = providerOf(appearance.value, log)
  const registered: ThemeRegistration[] = []
  const refusals: FieldIssue[] = []
  for (const theme of themes.value) {
    const read = themeOf(theme, log)
    if (read.ok) registered.push(read.value)
    else refusals.push(...read.failure)
  }
  if (!provider.ok) return refused([...provider.failure, ...refusals])
  if (refusals.length > 0) return refused(refusals)

  return succeeded({
    appearance: {
      densities: gathered(appearance.value, 'densities'),
      locales: gathered(appearance.value, 'locales'),
      provider: provider.value,
      stylesheets: stylesheetsOf(appearance.value),
    },
    themes: registered,
  })
}

/**
 * Reads what a toolbar may offer out of a reading of the workspace.
 *
 * @param {Registrations} registered - The reading of the workspace.
 * @returns {Offered} The offer: the densities and locales declared, and every theme found.
 */
export function offeredBy(registered: Registrations): Offered {
  return {
    densities: registered.appearance.densities,
    locales: registered.appearance.locales,
    themes: registered.themes.map((theme) => theme.name),
  }
}
