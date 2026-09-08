/**
 * @fileoverview Tells changesets/action what a run published. The action hands the publish
 * script a file path and reads JSON lines back from it, one per tag, and creates the git tag
 * and the GitHub release from each. It reads nothing the script prints.
 */

import { writeFileSync } from 'node:fs'

import { type Manifest } from '@stealthscale/tool-workspace'

/**
 * Describes one published package, in the shape changesets/action reads. Every field is
 * theirs, `type` included, and an entry it does not recognise it skips.
 */
export interface TagEvent {
  /**
   * Names the package the tag belongs to.
   */
  packageName: string

  /**
   * Names the tag to create: `<name>@<version>`, which is what changesets tags a package
   * in a workspace of several.
   */
  tag: string

  /**
   * Marks the entry as a tag. It is the only kind the action reads.
   */
  type: 'git-tag'
}

/**
 * Builds the entry for one published package.
 *
 * @param {Manifest} manifest - The package that went out.
 * @returns {TagEvent} The entry, naming the package and its tag.
 */
export function tagEvent(manifest: Manifest): TagEvent {
  return {
    packageName: manifest.name,
    tag: `${manifest.name}@${manifest.version}`,
    type: 'git-tag',
  }
}

/**
 * Writes the entries where changesets/action reads them, one JSON object per line.
 *
 * A run that published nothing still writes the file, empty. The action reports a file it
 * cannot read as a warning and then creates no tag for anything, so an empty file and a
 * missing one differ.
 *
 * @param {string} file - The path the action handed the run, from `CHANGESETS_OUTPUT`.
 * @param {readonly TagEvent[]} events - One entry per published package.
 */
export function writeTagEvents(file: string, events: readonly TagEvent[]): void {
  writeFileSync(file, events.map((event) => `${JSON.stringify(event)}\n`).join(''))
}
