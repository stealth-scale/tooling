/**
 * @fileoverview Builds a scratch workspace in the temporary directory for a specification
 * that reads a tree: a guard, a generator, a release step. The spec writes the files it
 * needs, runs the code under test against the directory, and removes it.
 */

import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve, sep } from 'node:path'

/**
 * Maps a path relative to the workspace root to the content of the file at that path.
 */
export type ScratchFiles = Readonly<Record<string, string>>

/**
 * Lists every file below a directory.
 *
 * @param {string} directory - The directory to walk, absolute.
 * @param {string} prefix - The directory's path relative to the root. It ends in `/`, or is empty for the root.
 * @returns {string[]} The paths relative to the root, in directory order.
 */
function walk(directory: string, prefix: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? walk(join(directory, entry.name), `${prefix}${entry.name}/`)
      : [`${prefix}${entry.name}`],
  )
}

/**
 * Owns a temporary directory for a specification: writes into it, reads from it, lists it
 * and removes it. `scratchWorkspace` creates one.
 */
export class ScratchWorkspace {
  /**
   * Holds the absolute path of the directory.
   */
  readonly root: string

  /**
   * Wraps a directory that already exists. `scratchWorkspace` calls this; a specification
   * does not.
   *
   * @param {string} root - The absolute path of the directory.
   */
  constructor(root: string) {
    this.root = root
  }

  /**
   * Lists every file below the root as a path relative to it, with `/` as the separator.
   *
   * @returns {string[]} The paths, sorted.
   */
  files(): string[] {
    return walk(this.root, '').toSorted()
  }

  /**
   * Resolves a path relative to the root into an absolute one.
   *
   * @param {string} relative - The path to resolve.
   * @returns {string} The absolute path.
   * @throws {Error} When the path leaves the root.
   */
  path(relative: string): string {
    const target = resolve(this.root, relative)
    if (target !== this.root && !target.startsWith(this.root + sep)) {
      throw new Error(`${relative} leaves the scratch workspace`)
    }
    return target
  }

  /**
   * Reads a file as UTF-8 text.
   *
   * @param {string} relative - The path to read.
   * @returns {string} The file's content.
   * @throws {Error} When the file does not exist or the path leaves the root.
   */
  read(relative: string): string {
    return readFileSync(this.path(relative), 'utf8')
  }

  /**
   * Removes the directory and everything in it. A second call does nothing.
   */
  remove(): void {
    rmSync(this.root, { force: true, recursive: true })
  }

  /**
   * Writes files, creating the directories they sit in. An existing file is overwritten.
   *
   * @param {ScratchFiles} files - The content per path.
   * @throws {Error} When a path leaves the root.
   */
  write(files: ScratchFiles): void {
    for (const [relative, content] of Object.entries(files)) {
      const target = this.path(relative)
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, content)
    }
  }
}

/**
 * Creates a scratch workspace in the temporary directory and writes the files given.
 *
 * @param {ScratchFiles} [files] - The files to write first. Default: none.
 * @returns {ScratchWorkspace} The workspace. The caller removes it.
 */
export function scratchWorkspace(files: ScratchFiles = {}): ScratchWorkspace {
  const workspace = new ScratchWorkspace(mkdtempSync(join(tmpdir(), 'stealth-')))
  workspace.write(files)
  return workspace
}

/**
 * Runs a function against a scratch workspace and removes the workspace afterwards, whether
 * the function returned or threw.
 *
 * @template Result - The type the function returns.
 * @param {ScratchFiles} files - The files to write first.
 * @param {(workspace: ScratchWorkspace) => Result} run - The function to run.
 * @returns {Result} The function's return value.
 */
export function withScratchWorkspace<Result>(
  files: ScratchFiles,
  run: (workspace: ScratchWorkspace) => Result,
): Result {
  const workspace = scratchWorkspace(files)
  try {
    return run(workspace)
  } finally {
    workspace.remove()
  }
}

/**
 * Runs an asynchronous function against a scratch workspace and removes the workspace after
 * it settles, whether it resolved or rejected.
 *
 * @template Result - The type the function resolves to.
 * @param {ScratchFiles} files - The files to write first.
 * @param {(workspace: ScratchWorkspace) => Promise<Result>} run - The function to run.
 * @returns {Promise<Result>} The value the function resolved to.
 */
export async function withScratchWorkspaceAsync<Result>(
  files: ScratchFiles,
  run: (workspace: ScratchWorkspace) => Promise<Result>,
): Promise<Result> {
  const workspace = scratchWorkspace(files)
  try {
    return await run(workspace)
  } finally {
    workspace.remove()
  }
}
