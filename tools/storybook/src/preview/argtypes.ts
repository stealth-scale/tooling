/**
 * @fileoverview Builds the props table off a component's own docblocks. Storybook's built-in
 * extractor reads the type and the description and stops there, so a `@category` and a
 * `@default` the source states would be printed as running text in the middle of the
 * description.
 * This reads them into the columns the table shows them in, which is what lets a prop be
 * documented once, in the source, and nowhere else.
 */

import { type SBType, type StrictArgTypes, type StrictInputType } from 'storybook/internal/types'

import { prose, tagOf } from './description.ts'
import { type DocgenProp, docgenType, type DocgenType, documented } from './documented.ts'

/**
 * Lists the union members that stand for a value not being there.
 */
const ABSENT = new Set(['null', 'undefined'])

/**
 * Lists the docgen names for something callable, which no control can express.
 */
const FUNCTIONS = new Set(['function', 'signature'])

/**
 * Takes the quotes off a literal as docgen writes it: `'default'`, `"sm"`, `42`.
 *
 * @param {string} value - The literal as written.
 * @returns {string} The value between the quotes, or the literal as it was.
 */
function unquoted(value: string): string {
  return /^['"].*['"]$/u.test(value) ? value.slice(1, -1) : value
}

/**
 * Reads a name as one of the three primitives Storybook names the same way, or nothing.
 *
 * @param {string} name - The docgen name.
 * @returns {SBType | undefined} The scalar type, or nothing for any other name.
 */
function primitiveOf(name: string): SBType | undefined {
  if (name === 'boolean' || name === 'number' || name === 'string') return { name }
  return undefined
}

/**
 * Returns `true` for a union member that is a type and stands for a value being there.
 *
 * @param {DocgenType | undefined} member - One member, read.
 * @returns {boolean} `true` for a type other than `null` or `undefined`.
 */
function present(member: DocgenType | undefined): member is DocgenType {
  return member !== undefined && !ABSENT.has(member.name)
}

/**
 * Describes a union member a select can offer: a literal docgen wrote a value for.
 */
interface Choice extends DocgenType {
  /**
   * Carries the literal's value, quotes and all.
   */
  value: string
}

/**
 * Returns `true` for a union member a select can offer.
 *
 * @param {DocgenType} member - One member, read.
 * @returns {boolean} `true` for a literal with a value.
 */
function choice(member: DocgenType): member is Choice {
  return member.name === 'literal' && member.value !== undefined
}

/**
 * Reads a union: a set of choices when every member is a literal, and a union otherwise.
 *
 * `undefined` and `null` are dropped first. Every optional prop is written `T | undefined`,
 * because `exactOptionalPropertyTypes` requires it, and reading that as a two-member union
 * would leave `boolean | undefined` with no checkbox and an enum with no select. A literal
 * without a value is no choice, so a union holding one stays a union rather than a select
 * with a blank entry.
 *
 * @param {readonly unknown[]} members - The members as docgen wrote them.
 * @returns {SBType} The Storybook type.
 */
function unionOf(members: readonly unknown[]): SBType {
  const values = members.map((member) => docgenType(member)).filter((read) => present(read))
  const [only] = values

  if (only !== undefined && values.length === 1) return sbTypeOf(only)
  if (values.length > 0 && values.every((member) => choice(member))) {
    return { name: 'enum', value: values.map((member) => unquoted(member.value)) }
  }
  return { name: 'union', value: values.map((member) => sbTypeOf(member)) }
}

/**
 * Reads the Storybook type for a docgen type, which is what decides the control.
 *
 * An enum becomes a select of exactly the members the union declares, so the panel can never
 * offer a variant the component does not have. Anything with a call signature is left as a
 * function, which Storybook renders without a control.
 *
 * @param {DocgenType} [type] - The type as docgen read it off the annotation.
 * @returns {SBType} The Storybook type. `other` with `unknown` where docgen read nothing.
 */
export function sbTypeOf(type?: DocgenType): SBType {
  if (type === undefined) return { name: 'other', value: 'unknown' }
  const primitive = primitiveOf(type.name)
  if (primitive !== undefined) return primitive
  if (FUNCTIONS.has(type.name)) return { name: 'function' }
  if (type.name === 'union') return unionOf(type.elements ?? [])
  return { name: 'other', value: type.raw ?? type.name }
}

/**
 * Writes a prop's type as the table shows it: the source text, on one line.
 *
 * A type long enough to wrap is written across lines in the source, and the formatter leaves
 * a trailing comma and an indent on each. Collapsing the newlines alone shows those as
 * `( row: Row, column: Column, ) => ReactNode`, so the punctuation a line break allowed is
 * taken back out with it.
 *
 * @param {DocgenType} [type] - The type as docgen read it off the annotation.
 * @returns {string} The type as written, or `unknown` where docgen read nothing.
 */
function summaryOf(type?: DocgenType): string {
  if (type === undefined) return 'unknown'
  return (type.raw ?? type.name)
    .replaceAll(/\s*\n\s*/gu, ' ')
    .replaceAll(/,\s*(?=[)\]}])/gu, '')
    .replaceAll(/([([{])\s+/gu, '$1')
    .replaceAll(/\s+([)\]}])/gu, '$1')
    .replace(/^\|\s*/u, '')
}

/**
 * Decides the control a prop gets, where Storybook's own inference gets it wrong.
 *
 * A `ReactNode` is inferred as an object and gets a JSON editor, which is a poor way to type
 * the word "Save". A prop that can be a callback has nothing to type at all unless a plain
 * string is also allowed.
 *
 * @param {SBType} type - The type the table shows.
 * @param {string} summary - The type as written.
 * @returns {'text' | false | undefined} A control, `false` for none, or `undefined` to leave
 *     the inference alone.
 */
export function controlFor(type: SBType, summary: string): 'text' | false | undefined {
  if (summary.includes('ReactNode')) return 'text'
  if (type.name === 'function') return false

  // A parenthesised function type, `((event: E) => void) | undefined`, reaches here as
  // `unknown`, so the written type is the only thing left to read it off.
  if (type.name === 'other' && summary.includes('=>')) return false
  if (type.name === 'union') {
    return type.value.some((member) => member.name === 'string') ? 'text' : false
  }
  return undefined
}

/**
 * Builds one row of the table.
 *
 * The `@default` tag wins over the destructuring default docgen found, because a component
 * that documents a default is documenting the one its library applies.
 *
 * @param {string} name - The prop.
 * @param {DocgenProp} prop - The prop as docgen read it.
 * @returns {StrictInputType} The row.
 */
function argTypeFor(name: string, prop: DocgenProp): StrictInputType {
  const description = prop.description ?? ''
  const read = docgenType(prop.tsType)
  const type = sbTypeOf(read)
  const summary = summaryOf(read)
  const control = controlFor(type, summary)
  const category = tagOf(description, 'category')
  const fallback = tagOf(description, 'default') ?? prop.defaultValue?.value

  return {
    description: prose(description),
    name,
    type: { ...type, required: prop.required ?? false },
    ...(control === undefined ? {} : { control }),
    table: {
      ...(category === undefined ? {} : { category }),
      ...(fallback === undefined ? {} : { defaultValue: { summary: unquoted(fallback) } }),
      type: { summary },
    },
  }
}

/**
 * Builds the props table off the component's own docblocks.
 *
 * Registered as `parameters.docs.extractArgTypes`, so it feeds the docs table and the
 * controls panel alike.
 *
 * @param {unknown} [component] - The story's component, as Storybook hands it over.
 * @returns {null | StrictArgTypes} One row per documented prop, or `null` when the component
 *     carries no docgen.
 */
export function extractArgTypes(component?: unknown): null | StrictArgTypes {
  const props = documented(component)?.props
  if (props === undefined) return null

  const argTypes: Record<string, StrictInputType> = {}
  for (const [name, prop] of Object.entries(props)) argTypes[name] = argTypeFor(name, prop)
  return argTypes
}
