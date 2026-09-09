/**
 * @fileoverview Turns the manifest a contributor works against into the one that ships.
 *
 * The workspace manifest names the source: `exports` carries the repository's own condition
 * so a package resolves to `src` for whoever asks for it, and `bin` names the file a
 * contributor edits. That is the point of the condition and it stays. None of it can ship,
 * because no tarball carries `src`, and Node cannot execute TypeScript.
 *
 * The built form of both is already written, under `publishConfig`, where tsdown puts it. It
 * is a pnpm convention and pnpm applies it at pack time; npm and bun do not, and those are
 * what pack and publish here, so the first release shipped the working manifest. A `bin`
 * naming `src/bin/stealth.ts` cannot run under `npx`, and every `exports` named a directory
 * the tarball does not hold.
 *
 * So the release applies it. This is the one place the two forms meet, and it is the same
 * place the `workspace:` protocol is resolved, for the same reason: the release knows what it
 * is publishing and the manifest on disk describes something else.
 */

/**
 * Names the blocks a manifest declares dependencies in.
 */
export const DEPENDENCY_BLOCKS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
] as const

/**
 * Names what `publishConfig` holds for npm rather than for the manifest.
 *
 * Npm reads these off the tarball when it publishes, so they stay where they are. Everything
 * else in the block is a field npm expects to find at the top level.
 */
export const PUBLISH_DIRECTIVES = new Set(['access', 'provenance', 'registry', 'tag'])

/**
 * Reads the workspace protocol and the range written after it.
 */
const WORKSPACE = /^workspace:(?<written>.*)$/u

/**
 * Names a manifest as it is read off disk, in the parts this rewrites.
 */
export type Declared = Record<string, unknown>

/**
 * Writes the range that stands in for one workspace protocol.
 *
 * `*` pins the version exactly, which is what a package asking for whatever the workspace
 * holds means once the workspace is not there. `^` and `~` take that operator. Anything else
 * is a range somebody wrote by hand, and it is published as written.
 *
 * @param {string} written - The text after `workspace:`: `*`, `^`, `~` or a range.
 * @param {string} version - The version the depended-on package is being published at.
 * @returns {string} The range to publish.
 */
export function rangeFor(written: string, version: string): string {
  if (written === '*' || written === '') return version
  if (written === '^' || written === '~') return `${written}${version}`
  return written
}

/**
 * Lays every field `publishConfig` overrides over the manifest.
 *
 * The block itself stays, because npm reads `access` out of the tarball to decide whether the
 * package is public, and a field it keeps for npm is not a field the manifest wants.
 *
 * @param {Declared} declared - The manifest, as it is written on disk.
 * @returns {Declared} The manifest, with the published form of every field it overrides.
 */
export function overridden(declared: Declared): Declared {
  const config = declared['publishConfig']
  if (typeof config !== 'object' || config === null) return { ...declared }

  const fields = Object.entries(config).filter(([field]) => !PUBLISH_DIRECTIVES.has(field))
  return { ...declared, ...Object.fromEntries(fields) }
}

/**
 * Rewrites every workspace protocol in one manifest against the versions being published.
 *
 * A dependency the workspace does not hold is left as it was written, because inventing a
 * range for it would publish a manifest nobody can explain. Packing then fails on the
 * protocol, which is the loud answer.
 *
 * @param {Declared} declared - The manifest, as it is written on disk.
 * @param {ReadonlyMap<string, string>} versions - Each workspace package mapped to the
 *     version it is being published at.
 * @returns {Declared} The manifest, with every protocol it could resolve written as a range.
 */
export function resolvedRanges(
  declared: Declared,
  versions: ReadonlyMap<string, string>,
): Declared {
  const rewritten: Declared = { ...declared }

  for (const block of DEPENDENCY_BLOCKS) {
    const entries = declared[block]
    if (typeof entries !== 'object' || entries === null) continue

    rewritten[block] = Object.fromEntries(
      Object.entries(entries).map(([name, range]) => {
        const version = versions.get(name)
        const protocol = typeof range === 'string' ? WORKSPACE.exec(range) : null
        if (version === undefined || protocol?.groups === undefined) return [name, range]

        return [name, rangeFor(String(protocol.groups['written']), version)]
      }),
    )
  }

  return rewritten
}

/**
 * Builds the manifest a tarball carries from the one the workspace works against.
 *
 * @param {Declared} declared - The manifest, as it is written on disk.
 * @param {ReadonlyMap<string, string>} versions - Each workspace package mapped to the
 *     version it is being published at.
 * @returns {Declared} The manifest to pack: the published form of every overridden field,
 *     and a real range wherever the workspace protocol was.
 */
export function publishedManifest(
  declared: Declared,
  versions: ReadonlyMap<string, string>,
): Declared {
  return resolvedRanges(overridden(declared), versions)
}
