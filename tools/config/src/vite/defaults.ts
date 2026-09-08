import { type UserConfig } from 'vite-plus'

import { formatConfig } from './format.ts'
import { lintConfig } from './lint.ts'
import { packConfig } from './pack.ts'
import { runConfig } from './run.ts'
import { serverSourceConditions, sourceConditions } from './source.ts'
import { stagedConfig } from './staged.ts'
import { testConfig } from './test.ts'

/**
 * Every block at its shared value, for a root config to spread.
 *
 * A repository that needs nothing of its own is `defineConfig({ ...stealthDefaults })`. One
 * that does spreads these and replaces the blocks it configures, calling that block's builder
 * with its options.
 *
 * ```ts
 * export default defineConfig({
 *   ...stealthDefaults,
 *   lint: lintConfig({ web: ['components/**'] }),
 *   test: testConfig({ dom: true }),
 * })
 * ```
 *
 * A replaced block is replaced whole rather than merged, which is why each builder returns a
 * complete block and takes the options instead.
 */
export const stealthDefaults: UserConfig = {
  fmt: formatConfig(),
  lint: lintConfig(),
  pack: packConfig(),
  resolve: { conditions: sourceConditions() },
  run: runConfig(),
  ssr: { resolve: { conditions: serverSourceConditions() } },
  staged: stagedConfig(),
  test: testConfig(),
}
