/**
 * @fileoverview Packs a built package into a tarball with bun and publishes the tarball
 * with npm. The tarball comes from bun, because bun rewrites `workspace:^` and `catalog:`
 * into ranges; the upload goes through npm, because npm can attest provenance and bun
 * cannot. The access and the registry come from the manifest's `publishConfig`, which npm
 * reads from the tarball.
 */

import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { failed, lastLines, passed, type Step } from '../report/report.ts'
import type { CommandOutcome, Shell } from '../shell/shell.ts'
import type { Manifest } from '../workspace/manifests.ts'

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
 * Packs one built package into the destination directory.
 *
 * @param {Manifest} manifest - The package to pack.
 * @param {string} destination - The directory the tarball goes into.
 * @param {Shell} shell - The shell that runs bun.
 * @returns {Promise<PackResult>} The step, and the tarball when there is one.
 */
export async function pack(
  manifest: Manifest,
  destination: string,
  shell: Shell,
): Promise<PackResult> {
  const name = `pack ${manifest.name}`
  const outcome = await shell.run('bun', ['pm', 'pack', '--destination', destination, '--quiet'], {
    cwd: manifest.directory,
  })
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
 * @param {string} tarball - The tarball to publish, absolute.
 * @param {string} cwd - The directory npm runs in.
 * @param {PublishOptions} options - How to publish.
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
  return shell.run('npm', args, {
    cwd,
    env:
      options.userconfig === undefined ? undefined : { NPM_CONFIG_USERCONFIG: options.userconfig },
  })
}
