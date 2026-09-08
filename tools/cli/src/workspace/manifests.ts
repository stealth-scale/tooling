/**
 * @fileoverview Reads the manifests of a workspace: which packages the root names, what each
 * declares, and the order their dependencies put them in.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import {
  array,
  boolean,
  type Infer,
  looseObject,
  optional,
  record,
  safeParse,
  string,
  union,
} from '@stealthscale/core-schema'

/**
 * Describes what the tool reads off a package's manifest.
 */
export interface Manifest {
  /**
   * Carries `publishConfig.access`, when the manifest states one. Npm reads it from the
   * tarball, so the tool never passes it.
   */
  access: string | undefined

  /**
   * Maps each command the package installs to the file that runs it. The string form of
   * `bin` names one command after the package, which is what npm does with it.
   */
  bin: Readonly<Record<string, string>>

  /**
   * Carries the `build` script, when the package has one.
   */
  build: string | undefined

  /**
   * Maps each dependency to its range. A tarball's manifest makes a consumer install these.
   */
  dependencies: Readonly<Record<string, string>>

  /**
   * Carries the one line that says what the package is for, when the manifest states it.
   */
  description: string | undefined

  /**
   * Names the package's directory, absolute.
   */
  directory: string

  /**
   * Lists the `files` a tarball carries, when the manifest declares them.
   */
  files: readonly string[] | undefined

  /**
   * Names the package.
   */
  name: string

  /**
   * Marks a package that refuses to be published.
   */
  private: boolean

  /**
   * Carries `publishConfig.registry`, when the manifest states one.
   */
  registry: string | undefined

  /**
   * Carries the version.
   */
  version: string
}

/**
 * Describes what the closure of some roots came to.
 */
export interface Closure {
  /**
   * Lists the roots that are not packages in the workspace.
   */
  missing: string[]

  /**
   * Lists every package reachable from a root, dependencies before their dependents.
   */
  ordered: Manifest[]
}

/**
 * Accepts what npm reads off `publishConfig` when it publishes: the access and the registry.
 */
const PUBLISH_CONFIG = looseObject({ access: optional(string()), registry: optional(string()) })

/**
 * Accepts `workspaces` in either form bun reads: a list of patterns, or an object naming them.
 */
const WORKSPACES = union([array(string()), looseObject({ packages: optional(array(string())) })])

/**
 * Accepts a manifest as it is on disk, in the fields the tool reads. Anything else passes
 * through unread.
 */
const RAW_MANIFEST = looseObject({
  bin: optional(union([record(string(), string()), string()])),
  dependencies: optional(record(string(), string())),
  description: optional(string()),
  files: optional(array(string())),
  name: optional(string()),
  private: optional(boolean()),
  publishConfig: optional(PUBLISH_CONFIG),
  scripts: optional(record(string(), string())),
  version: optional(string()),
  workspaces: optional(WORKSPACES),
})

/**
 * Describes the manifest as it is on disk, before the tool narrows it.
 */
type RawManifest = Infer<typeof RAW_MANIFEST>

/**
 * Parses one manifest file.
 *
 * @param {string} file - The manifest's path.
 * @returns {RawManifest} The manifest as written.
 * @throws {Error} When the file is not a manifest: a field the tool reads has the wrong shape.
 */
function read(file: string): RawManifest {
  const result = safeParse(RAW_MANIFEST, JSON.parse(readFileSync(file, 'utf8')))
  if (result.ok) return result.value
  const reasons = result.failure.map((issue) => `${issue.path}: ${issue.reason}`).join('; ')
  throw new Error(`${file} is not a manifest: ${reasons}`)
}

/**
 * Reads the commands a manifest installs. Npm names the one command of the string form
 * after the package, without its scope.
 *
 * @param {string} name - The package's name, scope and all.
 * @param {Readonly<Record<string, string>> | string} [bin] - The manifest's `bin`. Default:
 *     nothing, giving a package that installs no command.
 * @returns {Readonly<Record<string, string>>} Each command mapped to the file that runs it.
 */
function binOf(
  name: string,
  bin?: Readonly<Record<string, string>> | string,
): Readonly<Record<string, string>> {
  if (bin === undefined) return {}
  if (typeof bin === 'string') return { [name.slice(name.indexOf('/') + 1)]: bin }
  return bin
}

/**
 * Finds the workspace root: the nearest directory, from `start` upwards, whose manifest
 * names workspaces.
 *
 * @param {string} start - The directory to start from, absolute.
 * @returns {string} The root, absolute.
 * @throws {Error} When no manifest above `start` names workspaces.
 */
export function workspaceRoot(start: string): string {
  let directory = start
  while (true) {
    const file = join(directory, 'package.json')
    if (existsSync(file) && read(file).workspaces !== undefined) return directory
    const parent = dirname(directory)
    if (parent === directory) throw new Error(`No manifest above ${start} names workspaces`)
    directory = parent
  }
}

/**
 * Finds the package a file belongs to: the nearest directory, from `start` upwards, that
 * holds a manifest. A module reads its own package's version this way, whatever depth the
 * build emitted it at.
 *
 * @param {string} start - The directory to start from, absolute.
 * @returns {string} The package's directory, absolute.
 * @throws {Error} When no directory above `start` holds a manifest.
 */
export function packageRoot(start: string): string {
  let directory = start
  while (true) {
    if (existsSync(join(directory, 'package.json'))) return directory
    const parent = dirname(directory)
    if (parent === directory) throw new Error(`No directory above ${start} holds a manifest`)
    directory = parent
  }
}

/**
 * Reads the workspace patterns the root manifest names, in either form bun accepts.
 *
 * @param {string} root - The directory whose manifest names them.
 * @returns {readonly string[]} The patterns. Empty when the manifest names no workspaces.
 */
export function workspacePatterns(root: string): readonly string[] {
  const { workspaces } = read(join(root, 'package.json'))
  if (Array.isArray(workspaces)) return workspaces
  return workspaces?.packages ?? []
}

/**
 * Lists the subdirectories of a directory.
 *
 * @param {string} directory - The directory to list.
 * @returns {string[]} The names, sorted. Empty when the directory does not exist.
 */
function subdirectories(directory: string): string[] {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .toSorted()
}

/**
 * Expands a workspace pattern into the directories it names. A segment is a literal or `*`,
 * which stands for every subdirectory. A literal that does not exist is still returned, so
 * the caller decides what a missing directory means.
 *
 * @param {string} root - The directory the pattern is relative to.
 * @param {string} pattern - The pattern: `core/*`, `plugins/*\/*`, `lone`.
 * @returns {string[]} The directories, absolute.
 */
export function expandWorkspacePattern(root: string, pattern: string): string[] {
  return pattern
    .split('/')
    .reduce<string[]>(
      (directories, segment) =>
        directories.flatMap((directory) =>
          segment === '*'
            ? subdirectories(directory).map((name) => join(directory, name))
            : [join(directory, segment)],
        ),
      [root],
    )
}

/**
 * Reads a package's manifest from its directory.
 *
 * @param {string} directory - The package's directory, absolute.
 * @returns {Manifest} The fields the tool reads, with the directory beside them.
 * @throws {Error} When the manifest has no name or no version. Nothing can be packed from it.
 */
export function readManifest(directory: string): Manifest {
  const raw = read(join(directory, 'package.json'))
  if (raw.name === undefined || raw.version === undefined) {
    throw new Error(`${join(directory, 'package.json')} has no name or no version`)
  }
  return {
    access: raw.publishConfig?.access,
    bin: binOf(raw.name, raw.bin),
    build: raw.scripts?.['build'],
    dependencies: raw.dependencies ?? {},
    description: raw.description,
    directory,
    files: raw.files,
    name: raw.name,
    private: raw.private === true,
    registry: raw.publishConfig?.registry,
    version: raw.version,
  }
}

/**
 * Lists every package in the workspace: each directory a pattern names that holds a
 * manifest.
 *
 * @param {string} root - The directory whose manifest names the patterns.
 * @returns {Manifest[]} The manifests, in pattern order.
 */
export function workspaceManifests(root: string): Manifest[] {
  return workspacePatterns(root)
    .flatMap((pattern) => expandWorkspacePattern(root, pattern))
    .filter((directory) => existsSync(join(directory, 'package.json')))
    .map((directory) => readManifest(directory))
}

/**
 * Collects each root and every workspace package reachable from it through `dependencies`,
 * dependencies before their dependents, so a list walked front to back never meets a
 * package before what it needs. A dependency outside the workspace is the registry's
 * business and stays out.
 *
 * @param {readonly string[]} roots - The package names to start from.
 * @param {readonly Manifest[]} manifests - The workspace's manifests.
 * @returns {Closure} The ordered closure, and the roots the workspace does not have.
 */
export function dependencyClosure(
  roots: readonly string[],
  manifests: readonly Manifest[],
): Closure {
  const byName = new Map(manifests.map((manifest) => [manifest.name, manifest]))
  const found: Closure = { missing: [], ordered: [] }
  const seen = new Set<string>()
  /**
   * Adds a package after everything it depends on, once.
   *
   * @param {Manifest} manifest - The package to add.
   */
  const visit = (manifest: Manifest): void => {
    if (seen.has(manifest.name)) return
    seen.add(manifest.name)
    for (const name of Object.keys(manifest.dependencies)) {
      const dependency = byName.get(name)
      if (dependency !== undefined) visit(dependency)
    }
    found.ordered.push(manifest)
  }
  for (const root of roots) {
    const manifest = byName.get(root)
    if (manifest === undefined) found.missing.push(root)
    else visit(manifest)
  }
  return found
}
