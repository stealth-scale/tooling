/**
 * What a build writes rather than a person: neither formatted nor linted.
 *
 * A repository that generates something else — a catalogue's static build, compiled message
 * catalogues — passes those globs to `formatConfig` and `lintConfig`, which append them to
 * these rather than replacing them.
 */
export const GENERATED = [
  '**/dist/**',
  '**/coverage/**',
  '**/*.gen.*',
  // A declaration beside a config file: the pack step's dts build emits one whenever a spec
  // reaches the config, and nobody writes one by hand.
  '**/*.config.d.ts',
] as const

/**
 * The generated globs, plus whatever a repository adds.
 *
 * @param {readonly string[]} extra - Globs for what this repository generates and the base
 *     list does not name. Default: nothing, giving the shared list alone.
 * @returns {string[]} Every glob to ignore, the shared ones first, as a fresh array.
 */
export function generatedGlobs(extra: readonly string[] = []): string[] {
  return [...GENERATED, ...extra]
}
