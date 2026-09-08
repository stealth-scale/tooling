/**
 * @fileoverview The docblock standard, as rules a linter can check. One entry per row of the
 * reference's enforcement table, plus the switch that turns the whole set off where a
 * docblock is not wanted.
 */

/**
 * A rule name mapped to what the linter should do about it.
 */
type Rules = Record<string, unknown>

/**
 * The order a docblock's tags are written in.
 *
 * One group, so the tags stay contiguous and `tag-lines` alone decides the blank line before
 * them. A prop's `@category` and `@default` come last, where the props table reads them.
 */
const TAG_ORDER = [
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
]

/**
 * The openers that say nothing, refused wherever a tag describes something.
 *
 * A pure negative lookahead: this is about how a sentence starts, and whether it is a
 * sentence at all is `require-description-complete-sentence`'s job.
 */
const NO_VAGUE_OPENER = String.raw`^(?!(?:What|Whatever|Something|Anything|Stuff)\b)`

/**
 * Where a docblock is required beyond the declarations `require` already names: the
 * type-level declarations, and a constant at the top of a module.
 *
 * A constant inside a function is deliberately absent. The standard documents what a reader
 * outside the body can name, and a local is not that. An overload signature is a
 * `TSDeclareFunction`, which `require` does not reach, and the standard wants a docblock on
 * each one while the implementation is exempt. The last selector matches the export statement
 * rather than the declaration inside it, because a docblock above `export const` attaches to
 * the export and a selector reaching past it reports a block that is there.
 */
const DOCUMENTED_CONTEXTS = [
  'TSInterfaceDeclaration',
  'TSTypeAliasDeclaration',
  'TSPropertySignature',
  'TSMethodSignature',
  'TSDeclareFunction',
  'PropertyDefinition',
  'Program > VariableDeclaration',
  'ExportNamedDeclaration[declaration.type="VariableDeclaration"]',
  'VariableDeclarator > ArrowFunctionExpression',
]

/**
 * A destructured object parameter is documented as one `@param` typed as its interface; the
 * members are documented on the interface, where the editor and the props table read them.
 * The plugin would otherwise demand one line per destructured member, which is every React
 * component's props written twice.
 */
const ONE_PARAM_PER_OBJECT = { checkDestructured: false }

/**
 * The docblock standard, rule by rule.
 *
 * Everything with a name carries one, exported or not, in the multi-line form, with a
 * summary that is a sentence and does not restate the name. Every tag carries the type the
 * signature declares, written in TypeScript syntax: the compiler reads a tag's type only in
 * a JavaScript file, so the type is there for the reader and the reviewer, and a type the
 * file does not know still fails lint.
 */
export const DOC_RULES: Rules = {
  'jsdoc-js/check-line-alignment': ['error', 'never', { wrapIndent: '    ' }],
  'jsdoc-js/check-param-names': ['error', ONE_PARAM_PER_OBJECT],
  'jsdoc-js/check-tag-names': ['error', { definedTags: ['category'] }],
  'jsdoc-js/check-template-names': 'error',
  'jsdoc-js/check-types': 'error',
  'jsdoc-js/informative-docs': 'error',
  'jsdoc-js/multiline-blocks': ['error', { noSingleLineBlocks: true }],
  'jsdoc-js/no-bad-blocks': 'error',
  'jsdoc-js/no-blank-blocks': 'error',
  'jsdoc-js/no-defaults': 'error',
  'jsdoc-js/no-undefined-types': 'error',
  'jsdoc-js/require-asterisk-prefix': 'error',
  'jsdoc-js/require-description': 'error',
  'jsdoc-js/require-hyphen-before-param-description': 'error',
  'jsdoc-js/require-param': ['error', ONE_PARAM_PER_OBJECT],
  'jsdoc-js/require-param-description': 'error',
  'jsdoc-js/require-param-name': 'error',
  'jsdoc-js/require-param-type': 'error',
  'jsdoc-js/require-returns': 'error',
  'jsdoc-js/require-returns-check': 'error',
  'jsdoc-js/require-returns-description': 'error',
  'jsdoc-js/require-returns-type': 'error',
  'jsdoc-js/require-template': 'error',
  'jsdoc-js/require-throws': 'error',
  'jsdoc-js/require-throws-type': 'error',
  'jsdoc-js/tag-lines': ['error', 'never', { startLines: 1 }],
  'jsdoc-js/valid-types': 'error',

  // The summary and the body sit flush against the asterisk; a tag's continuation lines are
  // the one indented thing, so they are excluded here and `check-line-alignment` sets them.
  'jsdoc-js/check-indentation': ['error', { excludeTags: TAG_ORDER }],

  'jsdoc-js/match-description': [
    'error',
    {
      mainDescription: false,
      tags: { param: NO_VAGUE_OPENER, returns: NO_VAGUE_OPENER, throws: NO_VAGUE_OPENER },
    },
  ],
  'jsdoc-js/require-description-complete-sentence': [
    'error',
    { tags: ['param', 'returns', 'template', 'throws'] },
  ],
  'jsdoc-js/require-jsdoc': [
    'error',
    {
      checkGetters: true,
      checkSetters: true,
      contexts: DOCUMENTED_CONTEXTS,
      exemptOverloadedImplementations: true,
      require: {
        ClassDeclaration: true,
        ClassExpression: true,
        FunctionDeclaration: true,
        FunctionExpression: true,
        MethodDefinition: true,
      },
    },
  ],

  // `sort-tags` would set the blank line before the tags too, and the two disagree.
  'jsdoc-js/sort-tags': [
    'error',
    { linesBetween: 0, reportTagGroupSpacing: false, tagSequence: [{ tags: TAG_ORDER }] },
  ],
}

/**
 * The same rules, off.
 *
 * A spec, a story and a fixtures file carry no docblocks: the test names and the scene
 * captions are the documentation. Derived from {@link DOC_RULES} rather than listed, so a
 * rule added above is turned off here without anyone remembering to.
 *
 * @returns {Rules} Every docblock rule, each set to `off`.
 */
export function docblocksOff(): Rules {
  return Object.fromEntries(Object.keys(DOC_RULES).map((rule) => [rule, 'off']))
}
