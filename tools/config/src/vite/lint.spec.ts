import { describe, expect, it } from 'vite-plus/test'

import { docblocksOff } from './docblock-rules.ts'
import { GENERATED } from './generated.ts'
import { MARKUP_RULES } from './lint-rules.ts'
import { lintConfig } from './lint.ts'

/**
 * Describes an override, as far as this spec reads it.
 */
interface Override {
  env?: { node?: boolean }
  files?: string[]
  plugins?: string[]
  rules?: Record<string, unknown>
}

/**
 * The overrides a config carries, typed for reading.
 *
 * @param overrides - What `lintConfig` put in its `overrides` field.
 * @returns Each override, in the order the linter applies them.
 */
function asOverrides(overrides: unknown): Override[] {
  return (overrides ?? []) as Override[]
}

/**
 * The override that relaxes a specification, found by what it applies to.
 *
 * @param overrides - Every override a config carries.
 * @returns The specification override.
 */
function specOverride(overrides: Override[]): Override | undefined {
  return overrides.find((override) => override.files?.includes('**/*.spec.ts') === true)
}

/**
 * The rules a config carries, typed for reading.
 *
 * @param rules - What `lintConfig` put in its `rules` field.
 * @returns Each rule by name.
 */
function asRules(rules: unknown): Record<string, unknown> {
  return (rules ?? {}) as Record<string, unknown>
}

describe('lintConfig', () => {
  it('reports lint findings and type errors in one pass', () => {
    expect(lintConfig().options).toEqual({ typeAware: true, typeCheck: true })
  })

  it('takes the three plugins from npm that oxlint has no native equivalent for', () => {
    const names = (lintConfig().jsPlugins ?? []).map((plugin) =>
      typeof plugin === 'string' ? plugin : plugin.name,
    )

    expect(names, "jsdoc is taken by oxlint's own partial implementation").toEqual([
      'vite-plus',
      'jsdoc-js',
      'perfectionist',
    ])
  })

  it('relaxes a specification without relaxing anything else', () => {
    const spec = specOverride(asOverrides(lintConfig().overrides))

    expect(spec?.files, 'a fixture is documented like anything else').toEqual([
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/*.stories.ts',
      '**/*.stories.tsx',
    ])
    expect(spec?.plugins, "a spec asserts, so vitest's own rules apply").toContain('vitest')
    expect(
      Object.keys(spec?.rules ?? {}).filter((rule) => !rule.startsWith('jsdoc-js/')),
      'two relaxations, and a repository argues for anything more in its own override',
    ).toEqual(['eslint/max-lines-per-function', 'typescript/no-unsafe-type-assertion'])
  })

  it('turns every docblock rule off where the names are the documentation', () => {
    const spec = specOverride(asOverrides(lintConfig().overrides))

    for (const [rule, setting] of Object.entries(docblocksOff())) {
      expect(spec?.rules?.[rule], rule).toBe(setting)
    }
  })

  it('draws no React rules in a repository that renders nothing', () => {
    const overrides = asOverrides(lintConfig().overrides)

    expect(overrides.flatMap((override) => override.plugins ?? [])).not.toContain('react')
    expect(
      overrides.map((override) => override.files),
      'a config and a specification',
    ).toEqual([
      ['**/*.config.ts'],
      ['**/*.spec.ts', '**/*.spec.tsx', '**/*.stories.ts', '**/*.stories.tsx'],
    ])
  })

  it('applies the markup rules exactly where a repository says it renders', () => {
    const [web] = asOverrides(lintConfig({ web: ['components/**'] }).overrides)

    expect(web?.files).toEqual(['components/**'])
    expect(web?.plugins).toContain('jsx-a11y')
    expect(web?.rules).toEqual(MARKUP_RULES)
  })

  it('leaves the console to the globs that run in Node', () => {
    const [node] = asOverrides(lintConfig({ node: ['tools/**'] }).overrides)

    expect(node?.env).toEqual({ node: true })
    expect(node?.files).toEqual(['tools/**'])
    expect(node?.rules).toEqual({ 'no-console': 'off' })
  })

  it('stops a tier importing what sits above it, and says why where it fires', () => {
    const layer = {
      because: 'a core package is what a tool builds on',
      files: ['core/**'],
      forbid: ['@stealthscale/tool-*'],
    }

    const [core] = asOverrides(lintConfig({ layers: [layer] }).overrides)

    expect(core?.files).toEqual(['core/**'])
    expect(core?.rules?.['no-restricted-imports']).toEqual([
      'error',
      { patterns: [{ group: ['@stealthscale/tool-*'], message: layer.because }] },
    ])
  })

  it('names what a tier may import anyway, so no rule is turned off for every spec', () => {
    const overrides = asOverrides(
      lintConfig({
        layers: [
          {
            because: 'why',
            except: ['@stealthscale/tool-testing'],
            files: ['core/**'],
            forbid: ['@stealthscale/tool-*'],
          },
        ],
      }).overrides,
    )
    const [core] = overrides

    expect(core?.rules?.['no-restricted-imports']).toEqual([
      'error',
      {
        patterns: [
          { group: ['@stealthscale/tool-*', '!@stealthscale/tool-testing'], message: 'why' },
        ],
      },
    ])
  })

  it('constrains no tier when a repository names none', () => {
    const restricted = asOverrides(lintConfig().overrides).filter(
      (override) => override.rules?.['no-restricted-imports'] !== undefined,
    )

    expect(restricted).toEqual([])
  })

  it("puts a repository's own overrides last, so they win", () => {
    const own = { files: ['legacy/**'] }
    const overrides = asOverrides(
      lintConfig({ node: ['tools/**'], overrides: [own], web: ['ui/**'] }).overrides,
    )

    expect(overrides, "web, node, config, spec, then this repository's own").toHaveLength(5)
    expect(overrides.at(-1)).toEqual(own)
  })

  it('groups the scope a repository publishes under as internal', () => {
    const rules = asRules(lintConfig({ internalScope: '^@acme/.*' }).rules)
    const imports = rules['perfectionist/sort-imports'] as [string, { internalPattern: string[] }]

    expect(imports[1].internalPattern).toEqual(['^@acme/.*'])
  })

  it('lets a repository overrule a shared rule by name', () => {
    const rules = asRules(lintConfig({ rules: { complexity: 'off' } }).rules)

    expect(rules['complexity'], 'merged last').toBe('off')
    expect(rules['max-params'], 'and the rest still apply').toEqual(['error', 4])
  })

  it('adds a repository own generated paths to the shared ones', () => {
    expect(lintConfig({ ignore: ['**/storybook-static/**'] }).ignorePatterns).toEqual([
      ...GENERATED,
      '**/storybook-static/**',
    ])
  })
})
