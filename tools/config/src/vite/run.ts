/**
 * @fileoverview Holds the task graph every stealth repository runs, and what `vp run ci` does
 * in one that only builds libraries.
 */

import { type UserConfig } from 'vite-plus'

/**
 * Names the `run` block of a vite-plus config.
 */
type RunBlock = NonNullable<UserConfig['run']>

/**
 * Lists what `vp run ci` does in a repository that only builds libraries.
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
 * Names the task that serves a repository's Storybook.
 */
const STORYBOOK_TASK = 'storybook'

/**
 * Names the task that builds a repository's Storybook into a static site.
 */
const STORYBOOK_BUILD_TASK = 'storybook:build'

/**
 * Names the directory Storybook writes a static build into, which is what the build task
 * produces and what its cache key leaves out.
 */
const STORYBOOK_OUTPUT = 'storybook-static/**'

/**
 * Holds the two tasks a repository with a Storybook runs.
 *
 * Storybook's own defaults name the configuration directory, the port and the output
 * directory, so neither command restates them. The server is never cached, because there is
 * nothing to cache about a process that stays up; the build is, keyed on everything but its
 * own output.
 */
const STORYBOOK_TASKS: RunBlock['tasks'] = {
  [STORYBOOK_BUILD_TASK]: {
    command: 'storybook build',
    input: [{ auto: true }, `!${STORYBOOK_OUTPUT}`],
    output: [STORYBOOK_OUTPUT],
  },
  [STORYBOOK_TASK]: { cache: false, command: 'storybook dev' },
}

/**
 * Describes what a repository may change about its tasks.
 */
export interface RunOptions {
  /**
   * Lists the `ci` task's commands, in order. Default: the library repository's, plus the
   * Storybook build where the repository ships one.
   */
  ci?: readonly string[] | undefined

  /**
   * Marks a repository that ships a Storybook. It gains a `storybook` task that serves it and
   * a `storybook:build` task that builds it, and `ci` builds it after the specifications
   * pass. Default: no Storybook.
   */
  storybook?: boolean

  /**
   * Holds tasks beside `ci`, merged in.
   */
  tasks?: RunBlock['tasks'] | undefined
}

/**
 * Lists what `ci` runs, from the shared list or the repository's own.
 *
 * @param {Readonly<RunOptions>} options - The repository's settings.
 * @returns {string[]} The commands, in order.
 */
function ciCommand(options: Readonly<RunOptions>): string[] {
  if (options.ci !== undefined) return [...options.ci]
  return [...CI_COMMAND, ...(options.storybook === true ? [`vp run ${STORYBOOK_BUILD_TASK}`] : [])]
}

/**
 * Builds the task graph every stealth repository runs.
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
      ...(options.storybook === true ? STORYBOOK_TASKS : {}),
      ci: { cache: false, command: ciCommand(options) },
      ...options.tasks,
    },
  }
}
