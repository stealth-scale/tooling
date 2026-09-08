/**
 * @fileoverview Reads what the docgen plugin hung off a component, held to a schema at the
 * boundary. The record arrives as whatever the bundler injected, so it is checked rather than
 * assumed, and a component that carries none or carries something else reads as undocumented.
 */

import {
  array,
  boolean,
  exactOptional,
  looseObject,
  nullable,
  record,
  safeParse,
  type SchemaOf,
  string,
  unknown,
} from '@stealthscale/core-schema'

/**
 * Describes what react-docgen writes for one prop's type.
 */
export interface DocgenType {
  /**
   * Lists the members of a union, each in this same shape.
   */
  elements?: unknown[]

  /**
   * Names the type: `boolean`, `union`, `literal`, `signature`.
   */
  name: string

  /**
   * Carries the type as the source wrote it.
   */
  raw?: string

  /**
   * Carries a literal's value, quotes and all.
   */
  value?: string
}

/**
 * Describes the destructuring default react-docgen found.
 */
export interface DocgenDefault {
  /**
   * Carries the default as the source wrote it, quotes and all.
   */
  value: string
}

/**
 * Describes what react-docgen writes for one prop.
 */
export interface DocgenProp {
  /**
   * Carries the destructuring default the component applies, when it writes one.
   */
  defaultValue?: DocgenDefault | null

  /**
   * Carries the prop's docblock, tags and all.
   */
  description?: string

  /**
   * Marks a prop the component cannot do without.
   */
  required?: boolean

  /**
   * Carries the prop's type, in the shape `docgenType` reads.
   */
  tsType?: unknown
}

/**
 * Describes what the docgen plugin hangs off a component, in the members the preview reads.
 */
export interface Docgen {
  /**
   * Carries the component's own docblock, tags and all.
   */
  description?: string

  /**
   * Carries every prop, keyed by name.
   */
  props?: Record<string, DocgenProp>
}

/**
 * Accepts one prop's type as react-docgen writes it.
 */
const DOCGEN_TYPE: SchemaOf<DocgenType> = looseObject({
  elements: exactOptional(array(unknown())),
  name: string(),
  raw: exactOptional(string()),
  value: exactOptional(string()),
})

/**
 * Accepts one prop as react-docgen writes it.
 */
const DOCGEN_PROP: SchemaOf<DocgenProp> = looseObject({
  defaultValue: exactOptional(nullable(looseObject({ value: string() }))),
  description: exactOptional(string()),
  required: exactOptional(boolean()),
  tsType: exactOptional(unknown()),
})

/**
 * Accepts what the docgen plugin hangs off a component.
 */
const DOCGEN: SchemaOf<Docgen> = looseObject({
  description: exactOptional(string()),
  props: exactOptional(record(string(), DOCGEN_PROP)),
})

/**
 * Reads one prop's type, or one member of a union.
 *
 * @param {unknown} value - The type as react-docgen wrote it.
 * @returns {DocgenType | undefined} The type, or nothing where the value is not one.
 */
export function docgenType(value: unknown): DocgenType | undefined {
  const read = safeParse(DOCGEN_TYPE, value)
  return read.ok ? read.value : undefined
}

/**
 * Reads the record the docgen plugin hung off a component.
 *
 * @param {unknown} [component] - The story's component, as Storybook hands it over. A React
 *     component is a function, and the plugin writes the record onto it as a property.
 *     Default: nothing, which carries no record.
 * @returns {Docgen | undefined} The record, or nothing where the component carries none or
 *     carries something the schema refuses.
 */
export function documented(component?: unknown): Docgen | undefined {
  if (typeof component !== 'object' && typeof component !== 'function') return undefined
  if (component === null || !('__docgenInfo' in component)) return undefined

  const read = safeParse(DOCGEN, component.__docgenInfo)
  return read.ok ? read.value : undefined
}
