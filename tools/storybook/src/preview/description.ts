/**
 * @fileoverview Reads the description a component's page shows out of its docblock. A
 * docblock is written for two readers: an editor and the lint rule want `@param`,
 * `@returns`, `@category` and `@default`, and the page wants the sentences. Docgen hands over
 * the whole comment, so the tags are taken out here.
 */

import { documented } from './documented.ts'

/**
 * Matches a line that opens a block tag.
 */
const TAG = /^\s*@\w+/u

/**
 * Reads a tag's value out of a docblock that carries it on its own line.
 *
 * @param {string} description - The docblock, as docgen read it.
 * @param {string} name - The tag's name without the `@`: `category`, `default`.
 * @returns {string | undefined} The text after the tag, trimmed, or nothing where the docblock
 *     carries no such tag.
 */
export function tagOf(description: string, name: string): string | undefined {
  return new RegExp(`@${name}\\s+(.+)`, 'u').exec(description)?.[1]?.trim()
}

/**
 * Reads the prose out of a docblock, with the block tags taken out of it.
 *
 * A tag continues until the next tag or a blank line, so a wrapped `@param` takes its
 * continuation lines with it.
 *
 * @param {string} description - The docblock, as docgen read it.
 * @returns {string} The sentences, with every tag gone.
 */
export function prose(description: string): string {
  const kept: string[] = []
  let tagged = false

  for (const line of description.split('\n')) {
    if (TAG.test(line)) {
      tagged = true
      continue
    }
    if (tagged && line.trim() !== '') continue
    tagged = false
    kept.push(line)
  }

  return kept.join('\n').trim()
}

/**
 * Reads the description a component's page shows.
 *
 * Registered as `parameters.docs.extractComponentDescription`, which the `Description` block
 * and the sidebar summary read. Without it the page prints the docblock's tags as running
 * text.
 *
 * @param {unknown} [component] - The story's component, as Storybook hands it over.
 * @returns {null | string} The description, or `null` when the component carries no docgen or
 *     its docblock holds nothing but tags.
 */
export function extractComponentDescription(component?: unknown): null | string {
  const description = documented(component)?.description
  if (description === undefined) return null
  const described = prose(description)
  return described === '' ? null : described
}
