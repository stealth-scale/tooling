import { describe, expect, it } from 'vite-plus/test'

import { DOC_RULES, docblocksOff } from './docblock-rules.ts'

describe('DOC_RULES', () => {
  it('asks for a docblock on everything with a name, exported or not', () => {
    const [, options] = DOC_RULES['jsdoc-js/require-jsdoc'] as [string, { publicOnly?: unknown }]

    expect(options.publicOnly, 'not only what is exported').toBeUndefined()
    expect(options).toMatchObject({ exemptOverloadedImplementations: true })
  })

  it('reaches the declarations `require` cannot name, including a module constant', () => {
    const [, options] = DOC_RULES['jsdoc-js/require-jsdoc'] as [string, { contexts: string[] }]

    expect(options.contexts).toContain('TSInterfaceDeclaration')
    expect(options.contexts).toContain('TSPropertySignature')
    expect(options.contexts, 'an overload signature').toContain('TSDeclareFunction')
    expect(options.contexts, 'a top-level constant').toContain('Program > VariableDeclaration')
    expect(
      options.contexts,
      'the export statement, because the block sits above `export const`',
    ).toContain('ExportNamedDeclaration[declaration.type="VariableDeclaration"]')
  })

  it('documents a destructured object as one param, typed as its interface', () => {
    expect(DOC_RULES['jsdoc-js/require-param']).toEqual(['error', { checkDestructured: false }])
    expect(DOC_RULES['jsdoc-js/check-param-names']).toEqual(['error', { checkDestructured: false }])
  })

  it('keeps the type on every tag, which the standard asks for and tsc ignores', () => {
    expect(DOC_RULES['jsdoc-js/require-param-type']).toBe('error')
    expect(DOC_RULES['jsdoc-js/require-returns-type']).toBe('error')
    expect(DOC_RULES['jsdoc-js/require-throws-type'], 'the signature cannot say it').toBe('error')
    expect(DOC_RULES['jsdoc-js/no-types'], 'the opposite rule is not set').toBeUndefined()
  })

  it('holds a type to one that parses, spells it in TypeScript, and knows the name', () => {
    expect(DOC_RULES['jsdoc-js/valid-types'], 'a type that does not parse').toBe('error')
    expect(DOC_RULES['jsdoc-js/check-types'], 'a Closure spelling').toBe('error')
    const [level, options] = DOC_RULES['jsdoc-js/no-undefined-types'] as [
      string,
      { definedTypes: string[] },
    ]

    expect(level, 'a name the file does not know').toBe('error')
    expect(
      options.definedTypes,
      'except the DOM library, which the plugin cannot resolve for itself',
    ).toContain('HTMLElement')
  })

  it('refuses the single-line form, on anything', () => {
    expect(DOC_RULES['jsdoc-js/multiline-blocks']).toEqual(['error', { noSingleLineBlocks: true }])
  })

  it('refuses a docblock that repeats the name back', () => {
    expect(DOC_RULES['jsdoc-js/informative-docs']).toBe('error')
  })

  it('refuses the openers that describe nothing', () => {
    const [, options] = DOC_RULES['jsdoc-js/match-description'] as [
      string,
      { tags: Record<string, string> },
    ]
    const pattern = new RegExp(options.tags['param'] ?? '', 'u')

    expect(pattern.test('What the value should be.'), 'the opener the standard names').toBe(false)
    expect(pattern.test('The package name as published, with its scope.')).toBe(true)
  })

  it('fixes the tag order rather than leaving it to whoever writes the block', () => {
    const [, options] = DOC_RULES['jsdoc-js/sort-tags'] as [
      string,
      { tagSequence: { tags: string[] }[] },
    ]

    expect(options.tagSequence[0]?.tags).toEqual([
      'fileoverview',
      'template',
      'param',
      'returns',
      'throws',
      'example',
      'see',
      'deprecated',
      'category',
      'default',
    ])
  })

  it('lets one rule own the blank line before the tags, so the two cannot disagree', () => {
    const [, position, options] = DOC_RULES['jsdoc-js/tag-lines'] as [
      string,
      string,
      { startLines: number },
    ]
    const [, sort] = DOC_RULES['jsdoc-js/sort-tags'] as [string, { reportTagGroupSpacing: boolean }]

    expect(position, 'no blank lines between tags').toBe('never')
    expect(options.startLines, 'exactly one before the first').toBe(1)
    expect(sort.reportTagGroupSpacing, 'sort-tags leaves spacing alone').toBe(false)
  })

  it('excludes the tags whose continuation lines the standard indents', () => {
    const [, indentation] = DOC_RULES['jsdoc-js/check-indentation'] as [
      string,
      { excludeTags: string[] },
    ]

    expect(indentation.excludeTags, 'or it would fight the wrap indent').toContain('param')
    expect(DOC_RULES['jsdoc-js/check-line-alignment']).toEqual([
      'error',
      'never',
      { wrapIndent: '    ' },
    ])
  })

  it("allows the props table's own tag and no other beyond the standard set", () => {
    expect(DOC_RULES['jsdoc-js/check-tag-names']).toEqual(['error', { definedTags: ['category'] }])
  })
})

describe('docblocksOff', () => {
  it('turns off every rule the standard sets, and nothing else', () => {
    expect(Object.keys(docblocksOff()).toSorted()).toEqual(Object.keys(DOC_RULES).toSorted())
    expect(new Set(Object.values(docblocksOff()))).toEqual(new Set(['off']))
  })

  it('is derived, so a rule added to the standard is off in a spec without a second edit', () => {
    const off = docblocksOff()

    for (const rule of Object.keys(DOC_RULES)) {
      expect(off[rule], rule).toBe('off')
    }
  })
})
