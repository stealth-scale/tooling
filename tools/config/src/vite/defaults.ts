/**
 * @fileoverview Holds every block of a vite-plus config at its shared value, so a root config
 * spreads one object rather than calling eight builders.
 */

import { type UserConfig } from 'vite-plus'

import { formatConfig } from './format.ts'
import { lintConfig } from './lint.ts'
import { packConfig } from './pack.ts'
import { runConfig } from './run.ts'
import { serverSourceConditions, sourceConditions } from './source.ts'
import { stagedConfig } from './staged.ts'
import { testConfig } from './test.ts'

/**
 * Describes what a root config has to tell the shared blocks about its repository.
 */
export interface DefaultOptions {
  /**
   * Names this repository's source condition, such as `tooling-source`. `sourceConditions`
   * documents why it is named after the repository rather than shared between them.
   */
  sourceCondition: string
}

/**
 * Builds every block at its shared value, for a root config to spread.
 *
 * A repository that needs nothing else of its own spreads this and nothing more. One that
 * does spreads it and replaces the blocks it configures, calling that block's builder with
 * its options.
 *
 * A replaced block is replaced whole rather than merged, which is why each builder returns a
 * complete block and takes the options instead.
 *
 * @param {Readonly<DefaultOptions>} options - The settings the shared blocks need from this
 *     repository; every member is documented on `DefaultOptions`.
 * @returns {UserConfig} Every block at its shared value.
 * @example
 * ```ts
 * export default defineConfig({
 *   ...stealthDefaults({ sourceCondition: 'ui-source' }),
 *   lint: lintConfig({ web: ['components/**'] }),
 *   test: testConfig({ dom: true }),
 * })
 * ```
 */
export function stealthDefaults(options: Readonly<DefaultOptions>): UserConfig {
  const { sourceCondition } = options

  return {
    fmt: formatConfig(),
    lint: lintConfig(),
    pack: packConfig({ sourceCondition }),
    resolve: { conditions: sourceConditions(sourceCondition) },
    run: runConfig(),
    ssr: { resolve: { conditions: serverSourceConditions(sourceCondition) } },
    staged: stagedConfig(),
    test: testConfig(),
  }
}
