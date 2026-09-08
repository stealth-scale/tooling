import type { UserConfig } from 'vite-plus'

/**
 * The `test` block of a vite-plus config.
 */
type TestBlock = NonNullable<UserConfig['test']>

/**
 * One entry of the `test` block's `projects`.
 */
type TestProject = NonNullable<TestBlock['projects']>[number]

/**
 * What no project runs: what a build wrote, and what a package manager put on disk.
 */
const NEVER = ['**/node_modules/**', '**/dist/**']

/**
 * What coverage never counts: what a build wrote, what is a specification rather than its
 * subject, a story and the fixtures it draws from, which are data, and a declaration.
 */
const UNCOVERED = [
  '**/dist/**',
  '**/*.spec.*',
  '**/*.stories.tsx',
  '**/*.fixtures.*',
  '**/*.gen.*',
  '**/*.d.ts',
]

/**
 * What a repository may change about how its specifications run.
 */
export interface TestOptions {
  /**
   * Run a jsdom project for `.spec.tsx`. Off in a repository where nothing renders.
   */
  dom?: boolean | undefined

  /**
   * Globs no project runs, appended to the shared list — an `e2e` suite a browser driver owns.
   */
  exclude?: readonly string[] | undefined

  /**
   * Projects appended after the shared ones, for a repository that renders stories.
   */
  projects?: readonly TestProject[] | undefined

  /**
   * Files the jsdom project loads before a specification.
   */
  setupFiles?: readonly string[] | undefined

  /**
   * Paths coverage never counts, appended to the shared list.
   */
  uncovered?: readonly string[] | undefined
}

/**
 * How specifications run in every stealth repository.
 *
 * Two environments, split by what the specification is: a `.tsx` specification renders and
 * needs a document, a `.ts` specification does not and runs faster without one. The extension
 * is the honest signal — the tree a package sits in is not. Coverage is on by default,
 * because a floor nobody measures is a number in a config file.
 *
 * The timeout is longer than the five seconds Testing Library waits for an element, so a
 * query that never matches reports what it looked for instead of the test timing out on top
 * of it and saying nothing.
 *
 * @param {Readonly<TestOptions>} options - The settings this repository overrides; every
 *     member is documented on `TestOptions`, and anything absent takes the shared value.
 * @returns {TestBlock} The `test` block, ready to hand to `defineConfig`.
 */
export function testConfig(options: Readonly<TestOptions> = {}): TestBlock {
  const exclude = [...NEVER, ...(options.exclude ?? [])]

  const node: TestProject = {
    extends: true,
    test: { environment: 'node', exclude, include: ['**/*.spec.ts'], name: 'node' },
  }

  const dom: TestProject = {
    extends: true,
    test: {
      environment: 'jsdom',
      exclude,
      include: ['**/*.spec.tsx'],
      name: 'dom',
      ...(options.setupFiles ? { setupFiles: [...options.setupFiles] } : {}),
    },
  }

  return {
    coverage: {
      enabled: true,
      exclude: [...UNCOVERED, ...(options.uncovered ?? [])],
      include: ['**/src/**/*.{ts,tsx}'],
      provider: 'v8',
      reporter: ['text-summary', 'html', 'lcov'],
      thresholds: { 100: true },
    },
    projects: [node, ...(options.dom === true ? [dom] : []), ...(options.projects ?? [])],
    testTimeout: 15_000,
  }
}
