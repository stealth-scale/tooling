/**
 * @fileoverview Asks a registry what it has: which registry npm is configured for, and
 * whether it already holds a version of a package.
 */

import { looseObject, optional, parse, record, string, unknown } from '@stealthscale/core-schema'

import { lastLines } from '../report/report.ts'
import type { Shell } from '../shell/shell.ts'
import type { Manifest } from '../workspace/manifests.ts'

/**
 * Accepts the document a registry answers for a package, in the one field the tool reads.
 */
const PACKUMENT = looseObject({ versions: optional(record(string(), unknown())) })

/**
 * Ends a registry URL with the slash bun and npm write.
 *
 * @param {string} url - The registry as npm or a manifest names it.
 * @returns {string} The URL with exactly one trailing slash.
 */
export function withTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`
}

/**
 * Asks npm for the registry it is configured to publish to.
 *
 * Ask this in the directory the publish will run in. Npm reads its configuration, and the
 * manifest beside it, from where it runs, so asking anywhere else can name a registry the
 * publish will not use, and asking in a workspace whose manifest names another package
 * manager makes npm refuse outright.
 *
 * @param {Shell} shell - The shell that runs npm.
 * @param {string} cwd - The directory the publish will run in.
 * @returns {Promise<string>} The registry, with its trailing slash.
 * @throws {Error} When npm names no registry.
 */
export async function configuredRegistry(shell: Shell, cwd: string): Promise<string> {
  const outcome = await shell.run('npm', ['config', 'get', 'registry'], { cwd })
  const url = outcome.stdout.trim()
  if (outcome.code !== 0 || url === '') {
    throw new Error(`npm names no registry: ${lastLines(`${outcome.stdout}\n${outcome.stderr}`)}`)
  }
  return withTrailingSlash(url)
}

/**
 * Returns `true` when the registry already holds this version of the package.
 *
 * @param {string} registry - The registry, with its trailing slash.
 * @param {Manifest} manifest - The package to ask about.
 * @param {typeof fetch} fetchImpl - The fetch that asks the registry.
 * @returns {Promise<boolean>} `true` when that exact version is there.
 * @throws {Error} When the registry answers with anything but the package or a 404.
 */
export async function registryHasVersion(
  registry: string,
  manifest: Manifest,
  fetchImpl: typeof fetch,
): Promise<boolean> {
  const response = await fetchImpl(`${registry}${manifest.name.replace('/', '%2F')}`)
  if (response.status === 404) return false
  if (!response.ok) throw new Error(`${registry} answered ${response.status} for ${manifest.name}`)
  const { versions } = parse(PACKUMENT, await response.json())
  return manifest.version in (versions ?? {})
}
