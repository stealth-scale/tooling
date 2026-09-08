/**
 * @fileoverview Decides what every story entry of the sidebar is called and which of them the
 * sidebar shows. Storybook reads a story file without evaluating it, so neither can be a value
 * a story imports: a title reached through a spread never arrives. Both are derived here, from
 * where the file sits and from what the export is called.
 */

import { type StorybookConfig } from '@storybook/react-vite'
import { dirname } from 'node:path'

import { packageRoot } from '@stealthscale/tool-workspace'

import { titleOf } from './title.ts'

/**
 * Names the story every component's page opens with, which is the one the sidebar shows.
 */
const PLAYGROUND = 'Playground'

/**
 * Marks a story the sidebar leaves out. The test run still plays it, which is the point: an
 * example is documentation on its page and a test in the runner, and neither is a sidebar
 * entry a reader has to walk past.
 */
const HIDDEN = '!dev'

/**
 * Names what Storybook accepts for its indexers: a list, or a function over the list it has.
 */
type Indexers = NonNullable<StorybookConfig['experimental_indexers']>

/**
 * Names one indexer, out of the list Storybook hands the configuration.
 */
export type Indexer = Extract<Indexers, readonly unknown[]>[number]

/**
 * Names one entry an indexer reports: a story or a docs page.
 */
export type Entry = Awaited<ReturnType<Indexer['createIndex']>>[number]

/**
 * Reads the tags an entry carries in the sidebar.
 *
 * Every story but the Playground is an example: its page shows it under the section that
 * argues for it, and the runner plays it, so a second sidebar entry says nothing. A docs page
 * is left alone, and so is an entry that already asked to be hidden.
 *
 * @param {Entry} entry - The entry as the indexer reported it.
 * @returns {string[]} The tags to write, which are the entry's own plus the hidden mark.
 */
export function tagsOf(entry: Entry): string[] {
  const tags = [...(entry.tags ?? [])]
  const shown = entry.type === 'docs' || entry.exportName === PLAYGROUND
  return shown || tags.includes(HIDDEN) ? tags : [...tags, HIDDEN]
}

/**
 * Rewrites one entry with the title the tree gives it and the tags it should carry.
 *
 * @param {Entry} entry - The entry as the indexer reported it.
 * @param {string | undefined} title - The title derived from the file's place, or `undefined`
 *     where the file sits somewhere the taxonomy does not describe.
 * @returns {Entry} The entry. It keeps the indexer's own title when there is none to derive.
 */
export function rewritten(entry: Entry, title: string | undefined): Entry {
  const tags = tagsOf(entry)
  if (title === undefined) return { ...entry, tags }

  // Storybook lets an indexer override the id it derives from the title, and it derived this
  // one from the title being replaced. Dropping it makes Storybook derive the id from the
  // title the sidebar shows, so the URL matches the sidebar.
  const { __id, ...rest } = entry
  return { ...rest, tags, title }
}

/**
 * Refuses a story file that exports no Playground.
 *
 * The sidebar shows the Playground and nothing else, so a file without one would vanish from
 * the sidebar without a word. Refusing it at index time puts the file's name in the error
 * Storybook shows, and fails the test run the same way.
 *
 * @param {readonly Entry[]} entries - The entries the indexer reported for one file.
 * @param {string} file - The file they came from, absolute.
 * @returns {readonly Entry[]} The same entries.
 * @throws {Error} When the file holds a story and none of them is the Playground.
 */
export function withPlayground(entries: readonly Entry[], file: string): readonly Entry[] {
  const stories = entries.filter((entry) => entry.type === 'story')
  if (stories.length > 0 && !stories.some((entry) => entry.exportName === PLAYGROUND)) {
    throw new Error(
      `${file} exports no ${PLAYGROUND}. Every story file opens with one, and the sidebar shows nothing else.`,
    )
  }
  return entries
}

/**
 * Wraps an indexer so every entry it reports is titled from the tree and tagged by what it is.
 *
 * @param {Indexer} indexer - The indexer Storybook already has.
 * @param {string} root - The workspace root, absolute.
 * @returns {Indexer} The same indexer, with the entries rewritten.
 */
function derived(indexer: Indexer, root: string): Indexer {
  return {
    ...indexer,
    /**
     * Indexes one file and rewrites what it reported.
     *
     * @param {string} file - The story file being indexed, absolute.
     * @param {Parameters<Indexer['createIndex']>[1]} indexing - The indexing options Storybook
     *     passes through untouched.
     * @returns {Promise<Entry[]>} The entries, titled from the tree and tagged by what each is.
     */
    createIndex: async (file, indexing) => {
      const entries = withPlayground(await indexer.createIndex(file, indexing), file)
      const title = titleOf(file, packageRoot(dirname(file)), root)

      return entries.map((entry) => rewritten(entry, title))
    },
  }
}

/**
 * Wraps every story indexer Storybook has. A page written in MDX is indexed by Storybook
 * itself and titled after its file, so nothing here touches one.
 *
 * @param {string} root - The workspace root, absolute.
 * @returns {(existing: unknown) => Indexer[]} The function a configuration hands Storybook.
 */
export function derivedIndexers(root: string): (existing: unknown) => Indexer[] {
  return (existing) =>
    (Array.isArray(existing) ? existing : []).map((indexer: Indexer) => derived(indexer, root))
}
