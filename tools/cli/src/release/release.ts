/**
 * @fileoverview Publishes every public package of a workspace the registry does not have
 * yet, in dependency order, from a workspace that is already built.
 */

import { mkdirSync } from 'node:fs'

import { failed, lastLines, passed, type Report, type Step } from '#report/report.ts'
import { type Shell } from '#shell/shell.ts'
import { dependencyClosure, type Manifest, workspaceManifests } from '#workspace/manifests.ts'

import { type TagEvent, tagEvent, writeTagEvents } from './changesets.ts'
import { missingFiles, pack, type PublishOptions, publishTarball } from './packages.ts'
import { configuredRegistry, registryHasVersion, withTrailingSlash } from './registry.ts'

/**
 * Describes what releasing one package came to.
 */
interface Released {
  /**
   * Carries the step, for the report.
   */
  step: Step

  /**
   * Carries the tag entry, when the package went out. A package that was skipped, refused or
   * only rehearsed has none.
   */
  tag?: TagEvent | undefined
}

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
   * Names the file changesets/action reads the published tags from, as it handed it over in
   * `CHANGESETS_OUTPUT`. Left out, a run tells nothing and no tag is created.
   */
  changesetsOutput?: string | undefined

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
 * @returns {Promise<Released>} The step, and the tag entry when the package went out.
 */
async function releaseOne(
  manifest: Manifest,
  registry: string,
  options: ReleaseOptions,
  shell: Shell,
): Promise<Released> {
  const name = `publish ${manifest.name}@${manifest.version}`
  const target = manifest.registry === undefined ? registry : withTrailingSlash(manifest.registry)
  if (await registryHasVersion(target, manifest, options.fetch)) {
    return { step: passed(name, 'already on the registry') }
  }
  const missing = missingFiles(manifest)
  if (missing.length > 0) return { step: failed(name, `not built: ${missing.join(', ')} missing`) }
  const { packed, step } = await pack(manifest, options.tarballs, shell)
  if (packed === undefined) return { step }
  const outcome = await publishTarball(packed.tarball, options.tarballs, options, shell)
  if (outcome.code !== 0) {
    return { step: failed(name, lastLines(`${outcome.stdout}\n${outcome.stderr}`)) }
  }
  if (options.dryRun) return { step: passed(name, 'dry run') }
  return { step: passed(name, 'published'), tag: tagEvent(manifest) }
}

/**
 * Releases the packages one after another, dependencies first, and stops at the first
 * failure: a dependent published without its dependency is a package nobody can install.
 *
 * @param {readonly Manifest[]} ordered - The packages, dependencies first.
 * @param {string} registry - The registry to ask, unless a manifest names its own.
 * @param {ReleaseOptions} options - How to publish, and where the tarballs go.
 * @param {Shell} shell - The shell that runs bun and npm.
 * @returns {Promise<Released[]>} One entry per package, in the order they were tried.
 */
function releaseAll(
  ordered: readonly Manifest[],
  registry: string,
  options: ReleaseOptions,
  shell: Shell,
): Promise<Released[]> {
  return ordered.reduce<Promise<Released[]>>(async (before, manifest) => {
    const done = await before
    if (done.some(({ step }) => !step.ok)) {
      const name = `publish ${manifest.name}@${manifest.version}`
      return [...done, { step: failed(name, 'not attempted: an earlier publish failed') }]
    }
    return [...done, await releaseOne(manifest, registry, options, shell)]
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
  const released = await releaseAll(ordered, registry, options, shell)
  if (options.changesetsOutput !== undefined) {
    writeTagEvents(
      options.changesetsOutput,
      released.flatMap(({ tag }) => (tag === undefined ? [] : [tag])),
    )
  }
  return {
    steps: [
      passed('release set', `${ordered.length} packages to ${registry}`),
      ...released.map(({ step }) => step),
    ],
    workdir: options.tarballs,
  }
}
