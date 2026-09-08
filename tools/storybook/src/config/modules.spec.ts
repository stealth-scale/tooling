import { describe, expect, it } from 'vite-plus/test'

import { MODULES, virtualModules } from './modules.ts'
import { type Registrations } from './registrations.ts'

/** A reading of a workspace that registered one of everything. */
const REGISTERED: Registrations = {
  appearance: {
    densities: ['comfortable', 'compact'],
    locales: ['en', 'nl-BE'],
    provider: '/ws/foundations/theme/src/provider.tsx',
    stylesheets: ['/ws/foundations/theme/src/base.css', '/ws/components/library/src/keyframes.css'],
  },
  themes: [
    {
      name: 'kalon',
      package: '@t/theme-kalon',
      recipe: '/ws/themes/kalon/src/recipe.ts',
      title: 'Kalon',
    },
  ],
}

/** A reading of a workspace where nothing registered anything. */
const NOTHING: Registrations = {
  appearance: { densities: [], locales: [], provider: undefined, stylesheets: [] },
  themes: [],
}

/** The plugin's hooks, in the shape these cases call them. */
interface Hooks {
  load: (id: string) => string | undefined
  name: string
  resolveId: (id: string) => string | undefined
}

/**
 * Answers the source of one module, resolving it first as the bundler would.
 */
function sourceOf(registered: Registrations, module: string): string | undefined {
  const plugin = virtualModules(registered) as unknown as Hooks
  const resolved = plugin.resolveId(module)
  return resolved === undefined ? undefined : plugin.load(resolved)
}

describe('virtualModules', () => {
  it('claims its own modules and leaves everything else to the bundler', () => {
    const plugin = virtualModules(REGISTERED) as unknown as Hooks

    expect(plugin.name).toBe('stealth:modules')
    expect(plugin.resolveId(MODULES.themes)).toBe(`\0${MODULES.themes}`)
    expect(plugin.resolveId('react')).toBeUndefined()
    expect(plugin.load('react'), 'a module it never claimed').toBeUndefined()
  })

  it('carries every theme as its recipe and title, keyed by what a document writes', () => {
    const source = String(sourceOf(REGISTERED, MODULES.themes))

    expect(source).toContain(`import recipe0 from "/ws/themes/kalon/src/recipe.ts"`)
    expect(source).toContain(`"kalon": { recipe: recipe0, title: "Kalon" }`)
    expect(source, 'the recipes are the only imports, so the module resolves anywhere').not.toMatch(
      /^import (?!recipe\d)/mu,
    )
  })

  it('wraps every story in the registered provider, under every registered stylesheet', () => {
    const source = String(sourceOf(REGISTERED, MODULES.provider))

    expect(source.trim().split('\n')).toEqual([
      `import "/ws/foundations/theme/src/base.css"`,
      `import "/ws/components/library/src/keyframes.css"`,
      `export { default } from "/ws/foundations/theme/src/provider.tsx"`,
    ])
  })

  it('draws the story and nothing around it where no package registers a provider', () => {
    expect(sourceOf(NOTHING, MODULES.provider)).toContain('({ children }) => children')
  })

  it('carries what a toolbar may offer, so nothing lists it twice', () => {
    const source = String(sourceOf(REGISTERED, MODULES.offered))

    expect(source).toContain('"densities":["comfortable","compact"]')
    expect(source).toContain('"locales":["en","nl-BE"]')
    expect(source).toContain('"themes":["kalon"]')
  })

  it('answers empty modules for a workspace that registered nothing', () => {
    expect(String(sourceOf(NOTHING, MODULES.provider)).trim()).toBe(
      'export default ({ children }) => children',
    )
    expect(String(sourceOf(NOTHING, MODULES.themes))).toContain('export const themes = {')
  })
})
