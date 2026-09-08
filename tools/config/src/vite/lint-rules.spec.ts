import { describe, expect, it } from 'vite-plus/test'

import { MARKUP_RULES, SAFETY_RULES, SIZE_RULES, sortRules, STYLE_RULES } from './lint-rules.ts'

describe('SIZE_RULES', () => {
  it('bounds a file and a function, because size is a proxy for doing one thing', () => {
    expect(SIZE_RULES['max-lines']).toEqual([
      'error',
      { max: 300, skipBlankLines: true, skipComments: true },
    ])
    expect(SIZE_RULES['max-lines-per-function']).toEqual([
      'error',
      { max: 60, skipBlankLines: true, skipComments: true },
    ])
    expect(SIZE_RULES['complexity']).toEqual(['error', 10])
    expect(SIZE_RULES['max-params']).toEqual(['error', 4])
  })
})

describe('SAFETY_RULES', () => {
  it('refuses a javascript: URL, which no-eval and no-implied-eval do not reach', () => {
    expect(SAFETY_RULES['no-script-url']).toBe('error')
  })

  it('leaves the console to a package that says it runs in Node', () => {
    expect(SAFETY_RULES['no-console']).toEqual(['error', { allow: ['error', 'warn'] }])
  })

  it('turns off the rule no parameter carrying a foreign type can satisfy', () => {
    expect(SAFETY_RULES['typescript/prefer-readonly-parameter-types']).toBe('off')
  })
})

describe('STYLE_RULES', () => {
  it('settles each spelling the language leaves open, so no file argues it again', () => {
    expect(Object.keys(STYLE_RULES)).toEqual([
      'catch-error-name',
      'consistent-type-specifier-style',
      'explicit-function-return-type',
      'method-signature-style',
      'no-default-export',
      'no-inferrable-types',
      'no-relative-parent-imports',
      'prefer-string-raw',
    ])
  })

  it('takes the stricter of two signatures, which a property is over a method', () => {
    expect(STYLE_RULES['method-signature-style']).toBe('error')
  })

  it('keeps a type import beside the values it arrives with', () => {
    expect(STYLE_RULES['consistent-type-specifier-style']).toEqual(['error', 'prefer-inline'])
  })

  it('sends a cross-directory import through the package subpath rather than up the tree', () => {
    expect(STYLE_RULES['no-relative-parent-imports']).toBe('error')
  })
})

describe('MARKUP_RULES', () => {
  it('names every way a string becomes markup, not only the obvious one', () => {
    const restricted = MARKUP_RULES['no-restricted-properties'] as unknown[]
    const properties = restricted
      .filter(
        (entry): entry is { property: string } =>
          typeof entry === 'object' && entry !== null && 'property' in entry,
      )
      .map((entry) => entry.property)

    expect(properties).toEqual(['innerHTML', 'outerHTML', 'insertAdjacentHTML', 'cookie'])
  })

  it('holds the automatic JSX runtime the tsconfigs set', () => {
    expect(MARKUP_RULES['react/react-in-jsx-scope']).toBe('off')
  })

  it('refuses a _blank link that hands over an opener', () => {
    expect(MARKUP_RULES['react/jsx-no-target-blank']).toBe('error')
  })
})

describe('sortRules', () => {
  it("groups a repository's own scope as internal rather than as a stranger", () => {
    const imports = sortRules('^@acme/.*')['perfectionist/sort-imports'] as [
      string,
      { internalPattern: string[] },
    ]

    expect(imports[1].internalPattern).toEqual(['^@acme/.*'])
  })

  it('starts a new block at a blank line, so a deliberate grouping survives', () => {
    const rules = sortRules('^@stealthscale/.*')

    expect(rules['perfectionist/sort-objects']).toEqual([
      'error',
      { partitionByNewLine: true, type: 'alphabetical' },
    ])
  })

  it('sorts everything a diff would otherwise show as a reordering', () => {
    expect(Object.keys(sortRules('^@stealthscale/.*'))).toEqual([
      'perfectionist/sort-exports',
      'perfectionist/sort-imports',
      'perfectionist/sort-interfaces',
      'perfectionist/sort-jsx-props',
      'perfectionist/sort-named-exports',
      'perfectionist/sort-named-imports',
      'perfectionist/sort-object-types',
      'perfectionist/sort-objects',
      'perfectionist/sort-union-types',
    ])
  })
})
