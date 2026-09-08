/**
 * @fileoverview The `lint` block: the plugins, the rules and the overrides a repository is
 * linted by, assembled from the rule sets beside this file.
 */

import type { UserConfig } from 'vite-plus'

import { DOC_RULES, docblocksOff } from './docblock-rules.ts'
import { generatedGlobs } from './generated.ts'
import { MARKUP_RULES, SAFETY_RULES, SIZE_RULES, sortRules } from './lint-rules.ts'

/**
 * The `lint` block of a vite-plus config.
 */
type LintBlock = NonNullable<UserConfig['lint']>

/**
 * One entry of the `lint` block's `overrides`.
 */
type LintOverride = NonNullable<LintBlock['overrides']>[number]

/**
 * The plugin names oxlint knows: a closed union, not an open list of strings.
 */
type LintPlugins = NonNullable<LintBlock['plugins']>

/**
 * The plugins every package is held to, whatever it does.
 */
const BASE_PLUGINS: LintPlugins = ['typescript', 'unicorn', 'oxc', 'import', 'promise']

/**
 * What carries no docblocks: a specification, a story and the fixtures either draws from.
 *
 * The test names and the scene captions are the documentation, so the docblock rules are off
 * here and the rest of the rules still apply.
 */
const UNDOCUMENTED_FILES = [
  '**/*.spec.ts',
  '**/*.spec.tsx',
  '**/*.stories.ts',
  '**/*.stories.tsx',
  '**/*.fixtures.ts',
  '**/*.fixtures.tsx',
]

/**
 * What a repository may change about what its linter enforces.
 */
export interface LintOptions {
  /**
   * Globs for what this repository generates, appended to the shared list.
   */
  ignore?: readonly string[] | undefined

  /**
   * The npm scope whose imports group as internal, as a regular expression source.
   */
  internalScope?: string | undefined

  /**
   * Globs that run in Node, where the console is the interface rather than a leftover.
   */
  node?: readonly string[] | undefined

  /**
   * Overrides appended after the shared ones, so a repository's own win.
   */
  overrides?: readonly LintOverride[] | undefined

  /**
   * Rules merged over the shared ones.
   */
  rules?: Readonly<Record<string, unknown>> | undefined

  /**
   * Globs that render, which the React and accessibility rules apply to.
   */
  web?: readonly string[] | undefined
}

/**
 * The overrides every repository gets: Node's console where output is the interface, and the
 * relaxations a specification needs.
 *
 * A `describe` block is a container rather than a unit of logic, so its length is the number
 * of cases and splitting it scatters what a reader came for. An assertion is not I/O, so
 * `await expect(...)` in a loop reports the first case that is wrong rather than whichever
 * settled first. And a specification for something that refuses dangerous input has to
 * contain the input it refuses.
 *
 * @param {readonly string[]} node - Globs that run in Node.
 * @returns {LintOverride[]} The overrides, in the order the linter applies them.
 */
function sharedOverrides(node: readonly string[]): LintOverride[] {
  const overrides: LintOverride[] = []

  if (node.length > 0) {
    overrides.push({ env: { node: true }, files: [...node], rules: { 'no-console': 'off' } })
  }

  overrides.push({
    files: UNDOCUMENTED_FILES,
    plugins: [...BASE_PLUGINS, 'vitest'],
    rules: {
      ...docblocksOff(),
      'eslint/max-lines-per-function': 'off',
      'eslint/no-await-in-loop': 'off',
      'no-script-url': 'off',
      'typescript/no-non-null-assertion': 'off',
      // A spec narrows a builder's output from a union the toolchain never narrows for the
      // caller. Shipped code keeps the rule, where an assertion does hide something.
      'typescript/no-unsafe-type-assertion': 'off',
    },
  })

  return overrides
}

/**
 * The override a repository that renders gets: the React and accessibility plugins, and the
 * rules that keep a string from being parsed as markup.
 *
 * @param {readonly string[]} web - Globs that render.
 * @returns {LintOverride[]} The override, or nothing when this repository draws no markup.
 */
function webOverrides(web: readonly string[]): LintOverride[] {
  if (web.length === 0) return []

  return [{ files: [...web], plugins: [...BASE_PLUGINS, 'react', 'jsx-a11y'], rules: MARKUP_RULES }]
}

/**
 * What the linter enforces in every stealth repository.
 *
 * One pass reports lint findings and type errors together, which is the whole point of
 * running oxlint with the type-aware engine. Three plugins come from npm because oxlint has
 * no native equivalent: the toolchain's own, the docblock rules, and the sorter. `jsdoc` is
 * taken by oxlint's partial implementation, which has no `require-jsdoc`, so the alias
 * `jsdoc-js` is what the rules are named under.
 *
 * @param {Readonly<LintOptions>} options - The settings this repository overrides; every
 *     member is documented on `LintOptions`, and anything absent takes the shared value.
 * @returns {LintBlock} The `lint` block, ready to hand to `defineConfig`.
 */
export function lintConfig(options: Readonly<LintOptions> = {}): LintBlock {
  return {
    // Everything oxlint calls a defect, plus the two categories that catch the mistakes
    // reviewers keep finding. Taste is left to the formatter.
    categories: { correctness: 'error', pedantic: 'error', perf: 'error', suspicious: 'error' },
    ignorePatterns: generatedGlobs(options.ignore),
    jsPlugins: [
      { name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' },
      { name: 'jsdoc-js', specifier: 'eslint-plugin-jsdoc' },
      { name: 'perfectionist', specifier: 'eslint-plugin-perfectionist' },
    ],
    options: { typeAware: true, typeCheck: true },
    overrides: [
      ...webOverrides(options.web ?? []),
      ...sharedOverrides(options.node ?? []),
      ...(options.overrides ?? []),
    ],
    plugins: BASE_PLUGINS,
    rules: {
      ...SIZE_RULES,
      ...SAFETY_RULES,
      ...DOC_RULES,
      ...sortRules(options.internalScope ?? '^@stealthscale/.*'),
      'vite-plus/prefer-vite-plus-imports': 'error',
      ...options.rules,
    },
    // The plugin rewrites `@fileoverview` to `@file` unless told which spelling is wanted,
    // and the standard names `@fileoverview`.
    settings: { jsdoc: { tagNamePreference: { file: 'fileoverview' } } },
  }
}
