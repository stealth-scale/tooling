import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vite-plus/test'

import { serverSourceConditions, sourceConditions } from './tools/config/src/index.ts'
import { workspaceManifests, workspaceRoot } from './tools/workspace/src/index.ts'
import config from './vite.config.ts'

/**
 * Stands in for Storybook's plugin factory. The config calls the factory as it is built, and
 * the real one loads `.storybook/main.ts` through Storybook's own loader as soon as it runs
 * under vitest, which corrupts the coverage of every file that load touches.
 */
vi.mock('@storybook/addon-vitest/vitest-plugin', () => ({
  storybookTest: vi.fn<() => Promise<never[]>>(() => Promise.resolve([])),
}))

/**
 * Reads the condition a tsconfig turns on for the type checker.
 *
 * @param {string} file - The tsconfig's name, beside this file.
 * @returns {string} The one condition it names, and an empty string when it names none.
 */
function conditionIn(file: string): string {
  const parsed = JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8')) as {
    compilerOptions?: { customConditions?: string[] }
  }

  return parsed.compilerOptions?.customConditions?.[0] ?? ''
}

/**
 * Lists the condition keys a manifest's `exports` offers, beside `default`.
 *
 * @param {string} directory - The package's directory, absolute.
 * @returns {string[]} Every key that is not `default`, across every entry.
 */
function conditionsOffered(directory: string): string[] {
  const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8')) as {
    exports?: Readonly<Record<string, unknown>>
  }

  return Object.values(manifest.exports ?? {}).flatMap((entry) =>
    typeof entry === 'object' && entry !== null
      ? Object.keys(entry).filter((key) => key !== 'default')
      : [],
  )
}

const CONDITION = conditionIn('./tsconfig.base.json')

describe('the repository config', () => {
  it('resolves a workspace package to its source, in both resolvers', () => {
    expect(config.resolve?.conditions).toEqual(sourceConditions(CONDITION))
    expect(
      config.ssr?.resolve?.conditions,
      'a specification loads another package through the node resolver',
    ).toEqual(serverSourceConditions(CONDITION))
  })

  it('names a condition of its own, rather than one every repository shares', () => {
    expect(CONDITION).toBe('tooling-source')
  })

  it('turns on the same condition for the type checker as for the bundler', () => {
    expect(conditionIn('./tsconfig.react.json'), 'the base a rendering package extends').toBe(
      CONDITION,
    )
    expect(config.resolve?.conditions?.[0], 'and the bundler').toBe(CONDITION)
  })
})

describe('every manifest in the workspace', () => {
  it('offers its source under this repository condition alone', () => {
    const root = workspaceRoot(import.meta.dirname)
    const foreign = workspaceManifests(root).flatMap((manifest) =>
      conditionsOffered(manifest.directory)
        .filter((condition) => condition !== CONDITION)
        .map((condition) => `${manifest.name}: ${condition}`),
    )

    expect(
      foreign,
      'a condition another repository turns on would send it to a src the tarball omits',
    ).toEqual([])
  })
})
