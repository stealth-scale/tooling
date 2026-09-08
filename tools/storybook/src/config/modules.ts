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
   * every stylesheet under it: the design system's own, then each theme's.
   */
  provider: 'virtual:stealth/provider',

  /**
   * Holds every theme solved, keyed by the name a document writes.
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
 * Writes the module holding every theme, solved.
 *
 * A theme solves its palette in its own build and exports the result at `./values`, so this
 * imports it rather than carrying a recipe the browser would have to solve. No consumer ships
 * the solver, every one reads the same table, and a recipe that cannot be drawn has already
 * failed its own package's build. The table is imported by the absolute path the reading
 * resolved, because a bare name in a module the plugin serves is resolved from the
 * repository's root, and the root depends on no theme.
 *
 * The scales come across beside the tokens, so a page that draws what a theme states, its
 * durations, its shadows or its type scale, reads them as data rather than parsing the
 * stylesheet it just wrote.
 *
 * @param {Registrations} registered - The reading of the workspace.
 * @returns {string} The module's source.
 */
function themesModule(registered: Registrations): string {
  const imports = registered.themes.map(
    (theme, index) =>
      `import { tables as tables${String(index)}, values as values${String(index)} } from ${literal(theme.values)}`,
  )
  const entries = registered.themes.map((theme, index) => {
    const held = `tables: tables${String(index)}, title: ${literal(theme.title)}, values: values${String(index)}`
    return `  ${literal(theme.name)}: { ${held} },`
  })

  return [...imports, '', 'export const themes = {', ...entries, '}', ''].join('\n')
}

/**
 * Writes the module holding what wraps every story, and every stylesheet under it.
 *
 * One module imports both so their order is fixed rather than left to whenever a preview
 * annotation happens to run: the design system's own rules land first, then each theme's
 * tokens behind its own `[data-theme]`. Both go through the bundler, so the cascade is import
 * order and Tailwind's layers arbitrate the rest.
 *
 * Every registered theme is loaded, not only the one a toolbar is on, so switching a theme
 * changes an attribute rather than fetching a stylesheet, and a page drawing two themes at
 * once has both. Each theme's font files come first, since a face has to be there before the
 * theme that names it is drawn in.
 *
 * @param {Registrations} registered - The reading of the workspace.
 * @returns {string} The module's source. Where no package registers a provider it draws the
 *     story and nothing around it.
 */
function providerModule(registered: Registrations): string {
  const { provider, stylesheets } = registered.appearance
  const faces = registered.themes.map((theme) => `import ${literal(theme.fonts)}`)
  const sheets = stylesheets.map((sheet) => `import ${literal(sheet)}`)
  const themes = registered.themes.map((theme) => `import ${literal(theme.stylesheet)}`)
  const wraps =
    provider === undefined
      ? 'export default ({ children }) => children'
      : `export { default } from ${literal(provider)}`

  return `${[...faces, ...sheets, ...themes, wraps].join('\n')}\n`
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
