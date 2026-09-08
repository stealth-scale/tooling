/**
 * @fileoverview Re-exports the valibot builders every stealth tier writes schemas with, so
 * no other package installs valibot. It also names the four types a signature uses.
 */

import type * as v from 'valibot'

export {
  array,
  boolean,
  check,
  custom,
  email,
  getMetadata,
  integer,
  isoDate,
  isoTimestamp,
  literal,
  looseObject,
  maxLength,
  maxValue,
  metadata,
  minLength,
  minValue,
  nonEmpty,
  nullable,
  number,
  object,
  optional,
  picklist,
  pipe,
  record,
  regex,
  string,
  transform,
  union,
  unknown,
  url,
  uuid,
} from 'valibot'

/**
 * Names any synchronous schema. This package's helpers accept it whatever its input, output
 * and issue types are.
 */
export type Schema = v.GenericSchema

/**
 * Names a schema that parses to `Output`. A signature uses it to promise what it returns.
 *
 * @template Output - The type `parse` returns when the schema accepts a value.
 */
export type SchemaOf<Output> = v.GenericSchema<unknown, Output>

/**
 * Names the type a schema parses to. `parse` returns it, and `safeParse` carries it as
 * `value`.
 *
 * @template S - The schema type.
 */
export type Infer<S extends Schema> = v.InferOutput<S>

/**
 * Names the type a schema accepts before any transform runs. `matches` narrows to it.
 *
 * @template S - The schema type.
 */
export type InputOf<S extends Schema> = v.InferInput<S>
