import { type UserConfig } from 'vite-plus'

/**
 * The `staged` block of a vite-plus config.
 */
type StagedBlock = NonNullable<UserConfig['staged']>

/**
 * The extensions `vp check --fix` runs over before a commit.
 */
const STAGED_EXTENSIONS = ['ts', 'tsx', 'js', 'mjs', 'cjs', 'json', 'css', 'md', 'yaml', 'yml']

/**
 * What a repository may change about its pre-commit pass.
 */
export interface StagedOptions {
  /**
   * Extensions to check, without dots. Defaults to every text format the repositories hold.
   */
  extensions?: readonly string[] | undefined
}

/**
 * What runs over staged files before a commit.
 *
 * One command, `vp check --fix`: the formatter and the linter in a single pass, applying what
 * they can fix and failing on what they cannot.
 *
 * @param {Readonly<StagedOptions>} options - The settings this repository overrides; every
 *     member is documented on `StagedOptions`, and anything absent takes the shared value.
 * @returns {StagedBlock} The `staged` block, ready to hand to `defineConfig`.
 */
export function stagedConfig(options: Readonly<StagedOptions> = {}): StagedBlock {
  const extensions = options.extensions ?? STAGED_EXTENSIONS

  return { [`*.{${extensions.join(',')}}`]: 'vp check --fix' }
}
