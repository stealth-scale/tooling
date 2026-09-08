import { type UserConfig } from 'vite-plus'

import { generatedGlobs } from './generated.ts'

/**
 * The `fmt` block of a vite-plus config.
 */
type FormatBlock = NonNullable<UserConfig['fmt']>

/**
 * What a repository may change about how its files are formatted.
 */
export interface FormatOptions {
  /**
   * Globs for what this repository generates, appended to the shared list.
   */
  ignore?: readonly string[] | undefined

  /**
   * Columns to wrap at. Defaults to 100, which is the width the docblock rules assume.
   */
  printWidth?: number | undefined
}

/**
 * How every stealth repository formats its files.
 *
 * Taste is settled here so no repository argues it again: no semicolons, single quotes, one
 * hundred columns, and manifests sorted. The formatter does not wrap comments, so a docblock
 * is wrapped by hand to the same width.
 *
 * @param {Readonly<FormatOptions>} options - The settings this repository overrides; every
 *     member is documented on `FormatOptions`, and anything absent takes the shared value.
 * @returns {FormatBlock} The `fmt` block, ready to hand to `defineConfig`.
 */
export function formatConfig(options: Readonly<FormatOptions> = {}): FormatBlock {
  return {
    ignorePatterns: generatedGlobs(options.ignore),
    printWidth: options.printWidth ?? 100,
    semi: false,
    singleQuote: true,
    sortPackageJson: true,
  }
}
