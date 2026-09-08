/**
 * @fileoverview Carries what the workspace registered into the browser, as modules the preview
 * imports. Nothing is written to disk and no repository keeps a generated file in step: the
 * plugin answers each module from the reading, so adding a theme or a stylesheet is adding a
 * package.
 */

import { type Plugin } from 'vite-plus'

import { type Registrations } from './registrations.ts'
import { offeredBy } from './registrations.ts'

/**
 * Names the modules the preview imports, each answered from the reading of the workspace.
 */
export const MODULES = {
  /**
   * Holds what a toolbar may offer: the densities, locales and themes on offer.
   */
  offered: 'virtual:stealth/offered',

  /**
   * Holds the module that wraps every story, which is the design system's own provider, and
   * the stylesheets that come before any theme.
   */
  provider: 'virtual:stealth/provider',

  /**
   * Holds every theme's recipe and title, keyed by the name a document writes.
   */
  themes: 'virtual:stealth/themes',
} as const

/**
 * Marks a resolved virtual module, so nothing else tries to read it off the disk.
 */
const RESOLVED = '\0'

/**
 * Writes a value as a literal the generated module can carry.
 *
 * @param {unknown} value - The value to write, which came from a manifest.
 * @returns {string} The value as JSON, which is valid as an expression.
 */
function literal(value: unknown): string {
  return JSON.stringify(value)
}

/**
 * Writes the module holding every theme's recipe.
 *
 * The recipe is carried as its package wrote it and solved where the story runs, because a
 * recipe is TypeScript and only the bundler evaluates it. The module imports nothing but the
 * recipes, each by its absolute path, so it resolves the same way in every layout.
 *
 * @param {Registrations} registered - The reading of the workspace.
 * @returns {string} The module's source.
 */
function themesModule(registered: Registrations): string {
  const imports = registered.themes.map(
    (theme, index) => `import recipe${String(index)} from ${literal(theme.recipe)}`,
  )
  const entries = registered.themes.map(
    (theme, index) =>
      `  ${literal(theme.name)}: { recipe: recipe${String(index)}, title: ${literal(theme.title)} },`,
  )

  return [...imports, '', 'export const themes = {', ...entries, '}', ''].join('\n')
}

/**
 * Writes the module holding what wraps every story.
 *
 * The stylesheets the preview loads before any theme are imported here rather than from a
 * module of their own, because every story needs both and one import keeps their order fixed:
 * the design system's own rules land before a theme's tokens.
 *
 * @param {Registrations} registered - The reading of the workspace.
 * @returns {string} The module's source. Where no package registers a provider it draws the
 *     story and nothing around it.
 */
function providerModule(registered: Registrations): string {
  const { provider, stylesheets } = registered.appearance
  const sheets = stylesheets.map((sheet) => `import ${literal(sheet)}`)
  const wraps =
    provider === undefined
      ? 'export default ({ children }) => children'
      : `export { default } from ${literal(provider)}`

  return `${[...sheets, wraps].join('\n')}\n`
}

/**
 * Builds the plugin that answers the preview's modules from the workspace.
 *
 * @param {Registrations} registered - The reading of the workspace.
 * @returns {Plugin} The plugin, for a Storybook configuration's `viteFinal`.
 */
export function virtualModules(registered: Registrations): Plugin {
  const sources: Record<string, () => string> = {
    [MODULES.offered]: () => `export const offered = ${literal(offeredBy(registered))}\n`,
    [MODULES.provider]: () => providerModule(registered),
    [MODULES.themes]: () => themesModule(registered),
  }

  return {
    /**
     * Answers a module the preview asked for.
     *
     * @param {string} id - The resolved identifier.
     * @returns {string | undefined} The module's source, or nothing when it is not one of
     *     these.
     */
    load: (id) => (id.startsWith(RESOLVED) ? sources[id.slice(1)]?.() : undefined),

    name: 'stealth:modules',

    /**
     * Claims the preview's own modules, so nothing looks for them on disk.
     *
     * @param {string} id - The identifier a module asked for.
     * @returns {string | undefined} The marked identifier, or nothing for anything else.
     */
    resolveId: (id) => (id in sources ? `${RESOLVED}${id}` : undefined),
  }
}
