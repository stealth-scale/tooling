/**
 * @fileoverview Writes the range a published manifest carries where the workspace wrote the
 * `workspace:` protocol.
 *
 * Bun rewrites the protocol itself, but it takes the version from the lockfile, and nothing
 * updates the version a lockfile records for a workspace package: `changeset version` writes
 * the manifests alone, and `bun install`, `--force` and `--lockfile-only` all answer "no
 * changes". So bun ships the version from before the bump. A theme released at 0.1.0 asked
 * for `core-theme@^0.0.0`, and a caret on a `0.0.x` version excludes every later one, so no
 * consumer could install it.
 *
 * The release knows every version it is publishing, because it read the manifests to decide
 * what to publish. It writes the ranges from those rather than trusting the lockfile.
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
