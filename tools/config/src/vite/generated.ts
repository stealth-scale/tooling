/**
 * @fileoverview Names what a build writes rather than a person, which the formatter and the
 * linter both skip, and appends whatever else a repository generates.
 */

/**
 * Lists what a build writes rather than a person. Neither the formatter nor the linter
 * touches these.
 *
 * A repository that generates something else, such as compiled message catalogues, passes
 * those globs to `formatConfig` and `lintConfig`, which append them to these rather than
 * replacing them.
 */
export const GENERATED = [
  '**/dist/**',
  '**/coverage/**',
  '**/storybook-static/**',
  // Working notes and throwaway output. A catalogue built into it writes an index.html, and
  // Vite reloads every client for any HTML written under the root.
  '**/.scratch/**',
  '**/*.gen.*',
  // A declaration beside a config file, which only a tsconfig that includes its own config
  // would produce. No package's tsconfig does, and nobody writes one by hand.
  '**/*.config.d.ts',
] as const

/**
 * Lists the generated globs, plus whatever a repository adds.
 *
 * @param {readonly string[]} extra - Globs for what this repository generates and the base
 *     list does not name. Default: nothing, giving the shared list alone.
 * @returns {string[]} Every glob to ignore, the shared ones first, as a fresh array.
 */
export function generatedGlobs(extra: readonly string[] = []): string[] {
  return [...GENERATED, ...extra]
}
