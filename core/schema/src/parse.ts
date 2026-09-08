/**
 * @fileoverview Parses a value at a boundary. Every refusal takes one shape whatever rule
 * refused, and a schema applies in three ways: by result, by exception and by narrowing. The
 * result is `@stealthscale/core-result`'s, so a parse joins a chain of steps as it stands.
 */

import * as v from 'valibot'

import { refused, type Result, succeeded } from '@stealthscale/core-result'

import { type Infer, type InputOf, type Schema } from './builders.ts'

/**
 * Describes one refusal of one field, in the shape a form renders and a log records.
 */
export interface FieldIssue {
  /**
   * Names the rule that refused. The code is valibot's name for the rule: `min_length`,
   * `calendar_day`. A catalogue translates it into what a person reads.
   */
  code: string

  /**
   * Carries the rule's scalars for the translation: `received` always, `expected` when the
   * rule states one, and `requirement` when it is a boolean, a number or a string.
   */
  params: Readonly<Record<string, boolean | number | string>>

  /**
   * Points at the field with a dotted path from the root. The root itself has an empty path.
   */
  path: string

  /**
   * Repeats the rule's own English text for a log. A person never sees it.
   */
  reason: string
}

/**
 * Reports a value that failed its schema. `parse` throws it; a form renders `issues`; a log
 * prints `message`.
 */
export class InvalidValueError extends Error {
  /**
   * Lists every refusal in the order the schema reported them.
   */
  readonly issues: readonly FieldIssue[]

  /**
   * Creates the error `parse` throws for one refused value.
   *
   * @param {readonly FieldIssue[]} issues - The issues the schema reported.
   * @param {string} summary - One line that names every failing path.
   */
  constructor(issues: readonly FieldIssue[], summary: string) {
    super(summary)
    this.name = 'InvalidValueError'
    this.issues = issues
  }
}

/**
 * Returns `true` when a catalogue can interpolate the value as it is.
 *
 * @param {unknown} value - A rule's `expected` or `requirement`.
 * @returns {boolean} `true` for a boolean, a number or a string.
 */
function isScalar(value: unknown): value is boolean | number | string {
  return typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string'
}

/**
 * Collects the scalars of an issue that a catalogue may interpolate.
 *
 * @param {v.BaseIssue<unknown>} issue - The issue valibot reported.
 * @returns {Readonly<Record<string, boolean | number | string>>} `received` always, `expected` when the rule states one, and `requirement` when it is a scalar.
 */
function parametersOf(
  issue: v.BaseIssue<unknown>,
): Readonly<Record<string, boolean | number | string>> {
  const params: Record<string, boolean | number | string> = { received: issue.received }
  if (issue.expected !== null) params.expected = issue.expected
  if (isScalar(issue.requirement)) params.requirement = issue.requirement
  return params
}

/**
 * Converts valibot's issues into the shape a form and a catalogue read.
 *
 * @param {readonly v.BaseIssue<unknown>[]} issues - The issues valibot reported.
 * @returns {FieldIssue[]} One entry per issue. The order is the schema's.
 */
export function fieldIssuesOf(issues: readonly v.BaseIssue<unknown>[]): FieldIssue[] {
  return issues.map((issue) => ({
    code: issue.type,
    params: parametersOf(issue),
    path: v.getDotPath(issue) ?? '',
    reason: issue.message,
  }))
}

/**
 * Parses a value against a schema and reports the outcome instead of throwing.
 *
 * Use it where a person sees the refusal, such as a form or a command's argument. Use
 * `parse` where an invalid value is a programming error.
 *
 * @template {Schema} S - The schema type.
 * @param {S} schema - The schema to check the value against.
 * @param {unknown} value - The value to check. It comes from a boundary: a request body, a
 *     parsed manifest, an environment variable.
 * @returns {Result<Infer<S>, readonly FieldIssue[]>} The parsed value under `value`, or every
 *     refusal under `failure`, in the order the schema reported them.
 */
export function safeParse<S extends Schema>(
  schema: S,
  value: unknown,
): Result<Infer<S>, readonly FieldIssue[]> {
  const result = v.safeParse(schema, value)
  if (result.success) return succeeded(result.output)
  return refused(fieldIssuesOf(result.issues))
}

/**
 * Parses a value against a schema and throws when the schema refuses it.
 *
 * Use it where an invalid value is a programming error, such as a config this repository
 * wrote. Use `safeParse` where a person sees the refusal.
 *
 * @template {Schema} S - The schema type.
 * @param {S} schema - The schema to check the value against.
 * @param {unknown} value - The value to check. It comes from a boundary: a request body, a
 *     parsed manifest, an environment variable.
 * @returns {Infer<S>} The parsed value. Every transform in the schema has run.
 * @throws {InvalidValueError} When the schema refuses the value. `issues` lists every refusal.
 */
export function parse<S extends Schema>(schema: S, value: unknown): Infer<S> {
  const result = v.safeParse(schema, value)
  if (result.success) return result.output
  throw new InvalidValueError(fieldIssuesOf(result.issues), v.summarize(result.issues))
}

/**
 * Returns `true` when the schema accepts the value, and narrows the value to the schema's
 * input type.
 *
 * The guard narrows to the input type and not the output. No transform has run on the value
 * the caller holds.
 *
 * @template {Schema} S - The schema type.
 * @param {S} schema - The schema to check the value against.
 * @param {unknown} value - The value to check.
 * @returns {boolean} `true` when the schema accepts the value. The value then has the type `InputOf<S>`.
 */
export function matches<S extends Schema>(schema: S, value: unknown): value is InputOf<S> {
  return v.is(schema, value)
}
