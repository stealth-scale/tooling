/**
 * @fileoverview Publishes every public package of a workspace the registry does not have
 * yet, in dependency order, from a workspace that is already built.
 */

import { mkdirSync } from 'node:fs'

import { failed, lastLines, passed, type Report, type Step } from '../report/report.ts'
import type { Shell } from '../shell/shell.ts'
import { dependencyClosure, type Manifest, workspaceManifests } from '../workspace/manifests.ts'
import { missingFiles, pack, type PublishOptions, publishTarball } from './packages.ts'
import { configuredRegistry, registryHasVersion, withTrailingSlash } from './registry.ts'

/**
 * Prefixes the line changesets/action reads to create a GitHub release. The format is
 * theirs: a line that starts with this, then `<name>@<version>`.
 */
const TAG_LINE_PREFIX = 'New tag: '

/**
 * Describes what the release set came to.
 */
export interface ReleaseSet {
  /**
   * Lists the private packages the set depends on, which a consumer could never install.
   */
  hidden: string[]

  /**
   * Lists the public packages, dependencies before their dependents.
   */
  ordered: Manifest[]
}

/**
 * Describes what a release run is told.
 */
export interface ReleaseOptions extends PublishOptions {
  /**
   * Asks the registry whether it has a version already.
   */
  fetch: typeof fetch

  /**
   * Names the registry to ask, with or without its trailing slash. Leave it out to ask npm,
   * in the directory the publish runs in, for the registry it is configured for. A manifest's
   * `publishConfig.registry` wins for that package.
   */
  registry?: string | undefined

  /**
   * Names the workspace root.
   */
  root: string

  /**
   * Names the directory the tarballs go into.
   */
  tarballs: string
}

/**
 * Collects the release set: every public package of the workspace and every workspace
 * package it depends on, dependencies before dependents.
 *
 * @param {string} root - The workspace root.
 * @returns {ReleaseSet} The set, and the private packages it would need and cannot have.
 */
export function releaseSet(root: string): ReleaseSet {
  const manifests = workspaceManifests(root)
  const roots = manifests.filter((manifest) => !manifest.private).map((manifest) => manifest.name)
  const { ordered } = dependencyClosure(roots, manifests)
  return {
    hidden: ordered.filter((manifest) => manifest.private).map((manifest) => manifest.name),
    ordered: ordered.filter((manifest) => !manifest.private),
  }
}

/**
 * Releases one package: skips it when the registry has the version, refuses it when a path
 * its `files` names is missing, and packs and publishes it otherwise.
 *
 * @param {Manifest} manifest - The package to release.
 * @param {string} registry - The registry to ask, unless the manifest names its own.
 * @param {ReleaseOptions} options - How to publish, and where the tarballs go.
 * @param {Shell} shell - The shell that runs bun and npm.
 * @returns {Promise<Step>} The step, with the tag line, the reason for skipping, or the failure.
 */
async function releaseOne(
  manifest: Manifest,
  registry: string,
  options: ReleaseOptions,
  shell: Shell,
): Promise<Step> {
  const name = `publish ${manifest.name}@${manifest.version}`
  const target = manifest.registry === undefined ? registry : withTrailingSlash(manifest.registry)
  if (await registryHasVersion(target, manifest, options.fetch)) {
    return passed(name, 'already on the registry')
  }
  const missing = missingFiles(manifest)
  if (missing.length > 0) return failed(name, `not built: ${missing.join(', ')} missing`)
  const { packed, step } = await pack(manifest, options.tarballs, shell)
  if (packed === undefined) return step
  const outcome = await publishTarball(packed.tarball, options.tarballs, options, shell)
  if (outcome.code !== 0) return failed(name, lastLines(`${outcome.stdout}\n${outcome.stderr}`))
  return passed(
    name,
    options.dryRun ? 'dry run' : `${TAG_LINE_PREFIX}${manifest.name}@${manifest.version}`,
  )
}

/**
 * Releases the packages one after another, dependencies first, and stops at the first
 * failure: a dependent published without its dependency is a package nobody can install.
 *
 * @param {readonly Manifest[]} ordered - The packages, dependencies first.
 * @param {string} registry - The registry to ask, unless a manifest names its own.
 * @param {ReleaseOptions} options - How to publish, and where the tarballs go.
 * @param {Shell} shell - The shell that runs bun and npm.
 * @returns {Promise<Step[]>} One step per package.
 */
function releaseAll(
  ordered: readonly Manifest[],
  registry: string,
  options: ReleaseOptions,
  shell: Shell,
): Promise<Step[]> {
  return ordered.reduce<Promise<Step[]>>(async (before, manifest) => {
    const steps = await before
    if (steps.some((step) => !step.ok)) {
      return [
        ...steps,
        failed(
          `publish ${manifest.name}@${manifest.version}`,
          'not attempted: an earlier publish failed',
        ),
      ]
    }
    return [...steps, await releaseOne(manifest, registry, options, shell)]
  }, Promise.resolve([]))
}

/**
 * Releases every package of the set the registry does not have yet, packed and published in
 * dependency order. It refuses the whole set when the set depends on a private package.
 *
 * @param {ReleaseOptions} options - The registry, how to publish, the workspace and where
 *     the tarballs go.
 * @param {Shell} shell - The shell that runs bun and npm.
 * @returns {Promise<Report>} Every step, in order.
 */
export async function release(options: ReleaseOptions, shell: Shell): Promise<Report> {
  const { hidden, ordered } = releaseSet(options.root)
  if (hidden.length > 0) {
    const detail = `private, so nothing that depends on them can be installed: ${hidden.join(', ')}`
    return { steps: [failed('release set', detail)], workdir: options.tarballs }
  }
  mkdirSync(options.tarballs, { recursive: true })
  const registry =
    options.registry === undefined
      ? await configuredRegistry(shell, options.tarballs)
      : withTrailingSlash(options.registry)
  const steps = await releaseAll(ordered, registry, options, shell)
  return {
    steps: [passed('release set', `${ordered.length} packages to ${registry}`), ...steps],
    workdir: options.tarballs,
  }
}
