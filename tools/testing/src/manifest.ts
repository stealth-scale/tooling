/**
 * @fileoverview Writes the manifests a scratch workspace needs: a root with its workspace
 * globs, and a package with its fields, so a specification builds a tree in a few lines and
 * reads as the tree it describes.
 */

import { type ScratchFiles } from './scratch.ts'

/**
 * Holds the fields of a scratch manifest. Beyond the name, a field is whatever the
 * specification needs the code under test to read.
 */
export interface ManifestFields {
  /**
   * Names the package.
   */
  readonly name: string

  readonly [field: string]: unknown
}

/**
 * Serialises a manifest the way a package manager writes one: two-space indentation and a
 * final newline.
 *
 * @param {ManifestFields} fields - The fields to write. `version` defaults to `0.0.0`.
 * @returns {string} The JSON text.
 */
export function manifest(fields: ManifestFields): string {
  return `${JSON.stringify({ version: '0.0.0', ...fields }, null, 2)}\n`
}

/**
 * Builds the files of one package under a directory: its manifest, and any other files at
 * paths relative to that directory.
 *
 * @param {string} directory - The package's directory, relative to the workspace root.
 * @param {ManifestFields} fields - The fields to write into the manifest.
 * @param {ScratchFiles} [files] - Other files of the package, relative to its directory. Default: none.
 * @returns {ScratchFiles} Every file of the package, keyed relative to the workspace root.
 */
export function packageFiles(
  directory: string,
  fields: ManifestFields,
  files: ScratchFiles = {},
): ScratchFiles {
  const entries: [string, string][] = [
    [`${directory}/package.json`, manifest(fields)],
    ...Object.entries(files).map(([path, content]): [string, string] => [
      `${directory}/${path}`,
      content,
    ]),
  ]
  return Object.fromEntries(entries)
}

/**
 * Builds the root manifest of a workspace: private, named `root`, with the globs given.
 *
 * @param {readonly string[]} workspaces - The workspace globs: `core/*`, `tools/*`.
 * @param {Readonly<Record<string, unknown>>} [fields] - Other root fields, such as a catalog or devDependencies. Default: none.
 * @returns {ScratchFiles} The root `package.json`.
 */
export function workspaceFiles(
  workspaces: readonly string[],
  fields: Readonly<Record<string, unknown>> = {},
): ScratchFiles {
  return {
    'package.json': manifest({
      name: 'root',
      private: true,
      workspaces: [...workspaces],
      ...fields,
    }),
  }
}
