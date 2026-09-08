/**
 * @fileoverview Holds how every stealth repository formats its files: the width, the quotes,
 * and what a build wrote.
 */

import { type UserConfig } from 'vite-plus'

import { generatedGlobs } from './generated.ts'

/**
 * Names the `fmt` block of a vite-plus config.
 */
type FormatBlock = NonNullable<UserConfig['fmt']>

/**
 * Describes what a repository may change about how its files are formatted.
 */
export interface FormatOptions {
  /**
   * Lists globs for what this repository generates, appended to the shared list.
   */
  ignore?: readonly string[] | undefined

  /**
   * Sets the columns to wrap at. Default: 100, which is the width the docblock rules assume.
   */
  printWidth?: number | undefined
}

/**
 * Builds the `fmt` block every stealth repository formats its files with.
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
