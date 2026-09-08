import { type UserConfig } from 'vite-plus'

/**
 * The `run` block of a vite-plus config.
 */
type RunBlock = NonNullable<UserConfig['run']>

/**
 * What `vp run ci` does in a repository that only builds libraries.
 *
 * The tree comes first, before anything is built out of it: the lockfile has to be the one
 * that was reviewed, and nothing in it may carry a known advisory. Both are cheap and both
 * fail closed. Then the build, so every package packs and its declarations resolve, and only
 * then the checks and the specifications. `vp check` lints, so there is no lint task of its
 * own.
 */
const CI_COMMAND = [
  'bun install --frozen-lockfile',
  'bun audit',
  'vp run -r build',
  'vp check',
  'vp test',
]

/**
 * What a repository may change about its tasks.
 */
export interface RunOptions {
  /**
   * The `ci` task's commands, in order. Defaults to the library repository's.
   */
  ci?: readonly string[] | undefined

  /**
   * Tasks beside `ci`, merged in.
   */
  tasks?: RunBlock['tasks'] | undefined
}

/**
 * The task graph every stealth repository runs.
 *
 * A `package.json` script is cached on the same terms as a task: both are fingerprinted from
 * their inputs, so a second run is free. `ci` is not cached, because its point is to prove
 * the tree from nothing.
 *
 * @param {Readonly<RunOptions>} options - The settings this repository overrides; every
 *     member is documented on `RunOptions`, and anything absent takes the shared value.
 * @returns {RunBlock} The `run` block, ready to hand to `defineConfig`.
 */
export function runConfig(options: Readonly<RunOptions> = {}): RunBlock {
  return {
    cache: { scripts: true, tasks: true },
    tasks: {
      ci: { cache: false, command: [...(options.ci ?? CI_COMMAND)] },
      ...options.tasks,
    },
  }
}
