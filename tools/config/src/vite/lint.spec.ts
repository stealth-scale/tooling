import { describe, expect, it } from 'vite-plus/test'

import { docblocksOff } from './docblock-rules.ts'
import { GENERATED } from './generated.ts'
import { MARKUP_RULES } from './lint-rules.ts'
import { lintConfig } from './lint.ts'

/** An override, as far as this spec reads it. */
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
    const [spec] = asOverrides(lintConfig().overrides)

    expect(spec?.files, 'a story and its fixtures are documented the same way').toEqual([
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/*.stories.ts',
      '**/*.stories.tsx',
      '**/*.fixtures.ts',
      '**/*.fixtures.tsx',
    ])
    expect(spec?.plugins, "a spec asserts, so vitest's own rules apply").toContain('vitest')
    expect(spec?.rules?.['no-script-url'], 'a spec that refuses input contains it').toBe('off')
  })

  it('turns every docblock rule off where the names are the documentation', () => {
    const [spec] = asOverrides(lintConfig().overrides)

    for (const [rule, setting] of Object.entries(docblocksOff())) {
      expect(spec?.rules?.[rule], rule).toBe(setting)
    }
  })

  it('draws no React rules in a repository that renders nothing', () => {
    const overrides = asOverrides(lintConfig().overrides)

    expect(overrides.flatMap((override) => override.plugins ?? [])).not.toContain('react')
    expect(overrides, 'only the specification override').toHaveLength(1)
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

  it("puts a repository's own overrides last, so they win", () => {
    const own = { files: ['legacy/**'] }
    const overrides = asOverrides(
      lintConfig({ node: ['tools/**'], overrides: [own], web: ['ui/**'] }).overrides,
    )

    expect(overrides, "web, node, spec, then this repository's own").toHaveLength(4)
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
