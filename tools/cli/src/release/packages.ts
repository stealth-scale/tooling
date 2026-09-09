/**
 * @fileoverview Packs a built package into a tarball with bun and publishes the tarball
 * with npm. The tarball comes from bun, because bun rewrites `workspace:^` and `catalog:`
 * into ranges; the upload goes through npm, because npm can attest provenance and bun
 * cannot. The access comes from the manifest's `publishConfig`, which npm reads from the
 * tarball, and so does the registry when the manifest names one.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { type Manifest } from '@stealthscale/tool-workspace'

import { type Declared, publishedManifest } from '#release/published.ts'
import { failed, lastLines, passed, type Step } from '#report/report.ts'
import { type CommandOutcome, type Shell } from '#shell/shell.ts'

/**
 * Describes a package that was packed, and where its tarball is.
 */
export interface Packed {
  /**
   * Carries the package's manifest.
   */
  manifest: Manifest

  /**
   * Names the tarball, absolute.
   */
  tarball: string
}

/**
 * Describes how one tarball is published.
 */
export interface PublishOptions {
  /**
   * Says what would be published, and publishes nothing.
   */
  dryRun: boolean

  /**
   * Attests provenance through the CI job's OIDC token. Npm refuses it outside a CI it
   * knows.
   */
  provenance: boolean

  /**
   * Names the registry to ask and to publish to, with or without its trailing slash. Left
   * out, npm is asked in the directory the publish runs in for the registry it is configured
   * for. A manifest's `publishConfig.registry` wins over both, because npm reads it from the
   * tarball.
   */
  registry?: string | undefined

  /**
   * Names an npm user config that holds the registry's token. Without one, npm uses its own
   * login or the CI's OIDC token.
   */
  userconfig?: string | undefined
}

/**
 * Describes what packing one package came to.
 */
export interface PackResult {
  /**
   * Carries the tarball, when bun wrote one.
   */
  packed?: Packed | undefined

  /**
   * Carries the step, with the tarball's path or bun's last lines as its detail.
   */
  step: Step
}

/**
 * Matches a glob character in a `files` entry, which names more than one path.
 */
const GLOB = /[*?[{]/u

/**
 * Joins everything a command wrote on both streams.
 *
 * @param {CommandOutcome} outcome - The command's exit code and both streams.
 * @returns {string} Stdout, then stderr.
 */
function outputOf(outcome: CommandOutcome): string {
  return `${outcome.stdout}\n${outcome.stderr}`
}

/**
 * Lists the paths a manifest's `files` names that are missing from the package. A glob
 * entry names no one path and is not checked; a manifest without `files` names nothing.
 *
 * @param {Manifest} manifest - The package to check.
 * @returns {string[]} The missing paths, relative to the package, in `files` order.
 */
export function missingFiles(manifest: Manifest): string[] {
  return (manifest.files ?? []).filter(
    (file) => !GLOB.test(file) && !existsSync(join(manifest.directory, file)),
  )
}

/**
 * Reads a manifest's text as the object the rewrite works on.
 *
 * It refuses anything that is not an object rather than answering an empty one, because the
 * answer is written back over the file: a manifest this could not read would be replaced by
 * `{}`. It throws before anything is written, so the package is left as it was found.
 *
 * @param {string} text - The manifest as it is written on disk.
 * @returns {Declared} The manifest.
 * @throws {Error} When the text parses to anything but an object.
 */
function declaredIn(text: string): Declared {
  const parsed: unknown = JSON.parse(text)
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error(`a manifest is an object, and this one parsed to ${typeof parsed}`)
  }
  return Object.fromEntries(Object.entries<unknown>({ ...parsed }))
}

/**
 * Runs one step with the package's manifest in the form that ships, and writes back what was
 * there however the step ended.
 *
 * The manifest is written rather than the tarball patched, because bun packs what is on disk.
 * The original text goes back byte for byte, so a manifest a person formatted stays as they
 * wrote it, and the workspace keeps resolving a package to its source the moment the pack is
 * over. A caller naming no versions has nothing to write, and the file is left alone.
 *
 * @template Result - The value the step answers with.
 * @param {Manifest} manifest - The package being packed.
 * @param {ReadonlyMap<string, string>} versions - Each workspace package mapped to the
 *     version it is being published at.
 * @param {() => Promise<Result>} step - The work to run while the published form is written.
 * @returns {Promise<Result>} The step's own answer, unchanged.
 */
async function written<Result>(
  manifest: Manifest,
  versions: ReadonlyMap<string, string>,
  step: () => Promise<Result>,
): Promise<Result> {
  if (versions.size === 0) return step()

  const path = join(manifest.directory, 'package.json')
  const before = readFileSync(path, 'utf8')
  const after = publishedManifest(declaredIn(before), versions)

  writeFileSync(path, `${JSON.stringify(after, undefined, 2)}\n`)
  try {
    return await step()
  } finally {
    writeFileSync(path, before)
  }
}

/**
 * Packs one built package into the destination directory.
 *
 * @param {Manifest} manifest - The package to pack.
 * @param {string} destination - The directory the tarball goes into.
 * @param {Shell} shell - The shell that runs bun.
 * @param {ReadonlyMap<string, string>} [versions] - Each workspace package mapped to the
 *     version it is being published at. Default: none, leaving every range as written.
 * @returns {Promise<PackResult>} The step, and the tarball when there is one.
 */
export async function pack(
  manifest: Manifest,
  destination: string,
  shell: Shell,
  versions: ReadonlyMap<string, string> = new Map(),
): Promise<PackResult> {
  const name = `pack ${manifest.name}`
  const outcome = await written(manifest, versions, () =>
    shell.run('bun', ['pm', 'pack', '--destination', destination, '--quiet'], {
      cwd: manifest.directory,
    }),
  )
  const tarball = outcome.stdout
    .split('\n')
    .map((line) => line.trim())
    .findLast((line) => line.endsWith('.tgz'))
  if (outcome.code !== 0 || tarball === undefined) {
    return { step: failed(name, lastLines(outputOf(outcome))) }
  }
  return {
    packed: { manifest, tarball: resolve(destination, tarball) },
    step: passed(name, tarball),
  }
}

/**
 * Publishes one tarball with npm. The token, when there is one, travels in a user config
 * file npm is pointed at, so nothing else npm reads is touched.
 *
 * The run's registry is passed on the command line rather than the manifest's. Npm reads
 * `publishConfig.registry` out of the tarball and lets it win over the flag, which is the
 * rule the asking side applies as well.
 *
 * @param {string} tarball - The tarball to publish, absolute.
 * @param {string} cwd - The directory npm runs in.
 * @param {PublishOptions} options - How to publish. `PublishOptions` documents every member.
 * @param {Shell} shell - The shell that runs npm.
 * @returns {Promise<CommandOutcome>} Npm's exit code and both streams.
 */
export function publishTarball(
  tarball: string,
  cwd: string,
  options: PublishOptions,
  shell: Shell,
): Promise<CommandOutcome> {
  const args = ['publish', tarball]
  if (options.dryRun) args.push('--dry-run')
  if (options.provenance) args.push('--provenance')
  if (options.registry !== undefined) args.push('--registry', options.registry)
  return shell.run('npm', args, {
    cwd,
    env:
      options.userconfig === undefined ? undefined : { NPM_CONFIG_USERCONFIG: options.userconfig },
  })
}
