/**
 * @fileoverview The rules every stealth repository is linted by, grouped by what they are
 * about: size, safety, markup and sorting. The docblock standard is its own module.
 */

import { type UserConfig } from 'vite-plus'

/**
 * A rule name mapped to what the linter should do about it.
 *
 * Loose on purpose: the docblock and sorting rules come from `jsPlugins`, so oxlint's own
 * rule map does not know their names and cannot type them.
 */
type Rules = Record<string, unknown>

/**
 * Oxlint's own rule map, which names every built-in rule and the shape of its options.
 *
 * A record of rules that holds only built-in names takes this instead of {@link Rules}, and
 * the compiler then checks each rule's options rather than taking `unknown`.
 */
type BuiltinRules = NonNullable<
  NonNullable<NonNullable<UserConfig['lint']>['overrides']>[number]['rules']
>

/**
 * Size limits, as a proxy for whether a thing does one thing.
 *
 * A file that needs more than this is two files, and a function that needs more is two
 * functions. The numbers are the ones the repositories have settled on; a package raises one
 * in its own override and says why.
 */
export const SIZE_RULES: Rules = {
  complexity: ['error', 10],
  'max-depth': ['error', 4],
  'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
  'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true }],
  'max-params': ['error', 4],
}

/**
 * What is refused everywhere, whatever the package does.
 *
 * `eval` and the `Function` constructor are already refused by `no-eval` and
 * `no-implied-eval`; a `javascript:` URL is the same thing wearing a href, and nothing else
 * stops it.
 */
export const SAFETY_RULES: Rules = {
  'no-console': ['error', { allow: ['error', 'warn'] }],
  'no-script-url': 'error',

  // Deep readonly is unreachable through any type we do not own: React's `ReactNode` contains
  // arrays, and a toolchain's own config types are mutable, so a parameter carrying one never
  // satisfies the rule however it is written and the finding says nothing about the code.
  // Parameters are still written `Readonly<…>`; that is a convention here, not a rule.
  'typescript/prefer-readonly-parameter-types': 'off',
}

/**
 * The spelling this toolchain picks where the language allows two.
 *
 * Each of these settles a choice that would otherwise be made per file and argued in review.
 * A property signature is checked contravariantly where a method signature is checked both
 * ways, so the stricter spelling is the one worth having.
 */
export const STYLE_RULES: Rules = {
  'catch-error-name': 'error',
  'consistent-type-specifier-style': ['error', 'prefer-inline'],
  'explicit-function-return-type': 'error',
  'method-signature-style': 'error',
  'no-default-export': 'error',
  'no-inferrable-types': 'error',
  'prefer-string-raw': 'error',
}

/**
 * What a package that renders may not do.
 *
 * Assigning a string to one of these parses it as markup, which is the shortest path from a
 * value to an XSS hole. A package whose job is to render untrusted text sanitises first and
 * argues for the exception in its own override.
 */
export const MARKUP_RULES: BuiltinRules = {
  // Every tsconfig sets `jsx: react-jsx`, so JSX compiles without React in scope. The rule
  // describes the classic runtime, which nothing uses.
  'react/react-in-jsx-scope': 'off',

  'react/jsx-no-target-blank': 'error',
  'react/no-danger': 'error',
  'react/no-danger-with-children': 'error',

  'no-restricted-properties': [
    'error',
    {
      message: 'Assigning markup parses it. Render it, or sanitise it where that is the job.',
      property: 'innerHTML',
    },
    {
      message: 'Assigning markup parses it. Render it, or sanitise it where that is the job.',
      property: 'outerHTML',
    },
    {
      message: 'Parses whatever it is given. Build the element instead.',
      property: 'insertAdjacentHTML',
    },
    {
      message: 'Cookies are the session. Go through the package that owns authentication.',
      object: 'document',
      property: 'cookie',
    },
  ],

  'unicorn/no-document-cookie': 'error',
}

/**
 * Everything sortable is sorted, so a diff shows a change rather than a reordering.
 *
 * A blank line starts a new block, which is what keeps a deliberate grouping — a manifest's
 * `name` before its `version`, a union's happy case before its failures — from being
 * alphabetised away. A type's own members are the exception: the docblock standard puts a
 * blank line between every one of them, so partitioning there would turn the rule off.
 *
 * @param {string} internalScope - The npm scope whose imports group as internal, as a
 *     regular expression source: `^@stealthscale/.*`.
 * @returns {Rules} The sorting rules, with the import grouping set to that scope.
 */
export function sortRules(internalScope: string): Rules {
  const partitioned = { partitionByNewLine: true, type: 'alphabetical' } as const

  const sorted = { partitionByNewLine: false, type: 'alphabetical' } as const

  return {
    'perfectionist/sort-exports': ['error', partitioned],
    'perfectionist/sort-imports': [
      'error',
      {
        customGroups: [{ elementNamePattern: ['^react$', '^react-dom'], groupName: 'react' }],
        groups: ['react', ['builtin', 'external'], 'internal', ['parent', 'sibling', 'index']],
        internalPattern: [internalScope],
        newlinesBetween: 1,
        type: 'alphabetical',
      },
    ],
    'perfectionist/sort-interfaces': ['error', sorted],
    'perfectionist/sort-jsx-props': ['error', partitioned],
    'perfectionist/sort-named-exports': ['error', { type: 'alphabetical' }],
    'perfectionist/sort-named-imports': ['error', { type: 'alphabetical' }],
    'perfectionist/sort-object-types': ['error', sorted],
    'perfectionist/sort-objects': ['error', partitioned],
    'perfectionist/sort-union-types': ['error', partitioned],
  }
}
