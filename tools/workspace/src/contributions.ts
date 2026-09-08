/**
 * @fileoverview Reads one kind of contribution out of the `stealth` field of every manifest.
 * The caller names the key and hands over the schema for what it expects under it, so nothing
 * here learns what a theme, an appearance or a set of words is: it finds the field, checks it is
 * an object, and holds one key of it to somebody else's schema. A kind of contribution is
 * therefore added by the package that owns those words, and this module does not change.
 */

import { collect, type Collected, refused, succeeded } from '@stealthscale/core-result'
import {
  type FieldIssue,
  record,
  safeParse,
  type SchemaOf,
  string,
  unknown,
} from '@stealthscale/core-schema'

import { type Manifest } from './manifests.ts'

/**
 * Accepts the `stealth` field itself: an object keyed by the kind of contribution. Every
 * value stays unread, because the caller's schema reads the one key it asked for.
 */
const FIELD = record(string(), unknown())

/**
 * Holds one package's contribution beside the manifest that declared it.
 *
 * @template Value - What the caller's schema parses the contribution to.
 */
export interface Registered<Value> {
  /**
   * Carries the manifest of the package that registered it. Its `directory` is what turns a
   * path inside the contribution into an absolute one.
   */
  manifest: Manifest

  /**
   * Carries the contribution, as the caller's schema parsed it.
   */
  value: Value
}

/**
 * Points every issue at the field inside the package that wrote it, so a reading of the whole
 * workspace names both the package and the field.
 *
 * @param {readonly FieldIssue[]} issues - The refusals a schema reported.
 * @param {string} prefix - The path of the field being read: `@scope/pkg.stealth.theme`.
 * @returns {FieldIssue[]} The same refusals, each path prefixed. An issue on the field itself
 *     carries the prefix alone.
 */
function prefixed(issues: readonly FieldIssue[], prefix: string): FieldIssue[] {
  return issues.map((issue) => ({
    ...issue,
    path: issue.path === '' ? prefix : `${prefix}.${issue.path}`,
  }))
}

/**
 * Reads one package's contribution of one kind.
 *
 * @template Value - What the schema parses the contribution to.
 * @param {Manifest} manifest - The package's manifest.
 * @param {string} key - The key inside the `stealth` field: `theme`, `appearance`, `messages`.
 * @param {SchemaOf<Value>} schema - The schema for what sits under that key.
 * @returns {Collected<Registered<Value>, FieldIssue>} One entry when the package registered
 *     this kind, and none when it registered nothing or registered another kind. A `stealth`
 *     field that is not an object is a refusal, whatever key was asked for.
 */
function contributionOf<Value>(
  manifest: Manifest,
  key: string,
  schema: SchemaOf<Value>,
): Collected<Registered<Value>, FieldIssue> {
  if (manifest.contributions === undefined) return succeeded([])

  const field = safeParse(FIELD, manifest.contributions)
  if (!field.ok) return refused(prefixed(field.failure, `${manifest.name}.stealth`))

  const declared = field.value[key]
  if (declared === undefined) return succeeded([])

  const read = safeParse(schema, declared)
  if (!read.ok) return refused(prefixed(read.failure, `${manifest.name}.stealth.${key}`))
  return succeeded([{ manifest, value: read.value }])
}

/**
 * Reads one kind of contribution out of every manifest of a workspace.
 *
 * Every malformed field is reported at once rather than the first, because somebody fixing
 * manifests wants the whole list. A package that registers nothing, or registers only other
 * kinds, is absent from the result rather than being an entry with nothing in it.
 *
 * @template Value - What the schema parses the contribution to.
 * @param {readonly Manifest[]} manifests - The workspace's manifests, as `workspaceManifests`
 *     read them. Their order is the result's order.
 * @param {string} key - The key inside the `stealth` field: `theme`, `appearance`, `messages`.
 * @param {SchemaOf<Value>} schema - The schema for what sits under that key. It belongs to the
 *     package that owns those words.
 * @returns {Collected<Registered<Value>, FieldIssue>} Every package that registered this kind,
 *     in workspace order, or every refusal with the package on each path.
 */
export function contributions<Value>(
  manifests: readonly Manifest[],
  key: string,
  schema: SchemaOf<Value>,
): Collected<Registered<Value>, FieldIssue> {
  const read = collect(manifests.map((manifest) => contributionOf(manifest, key, schema)))
  if (!read.ok) return refused(read.failure.flat())
  return succeeded(read.value.flat())
}
