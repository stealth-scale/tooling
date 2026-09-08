import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'

import { storiesProject } from './project.ts'

/**
 * Stands in for Storybook's plugin factory. The real one loads `.storybook/main.ts` through
 * Storybook's own loader as soon as it runs under vitest, which corrupts the coverage of
 * every file that load touches, so no case here calls it.
 */
vi.mock('@storybook/addon-vitest/vitest-plugin', () => ({
  storybookTest: vi.fn<() => Promise<never[]>>(() => Promise.resolve([])),
}))

/** Describes the fields of the project these cases read. */
interface Project {
  extends?: boolean
  plugins?: unknown[]
  test: {
    browser: { enabled?: boolean; headless?: boolean; instances?: { browser: string }[] }
    name?: string
  }
}

/**
 * Reads the options the project handed Storybook's plugin factory on its last call.
 */
function handed(): unknown {
  return vi.mocked(storybookTest).mock.calls.at(-1)?.[0]
}

describe('storiesProject', () => {
  beforeEach(() => {
    vi.mocked(storybookTest).mockClear()
  })

  it('plays the stories in one headless browser, inheriting the repository config', () => {
    const project = storiesProject() as Project

    expect(project.extends, 'the coverage floor and the excludes come from the root').toBe(true)
    expect(project.test.name).toBe('stories')
    expect(project.test.browser.enabled).toBe(true)
    expect(project.test.browser.headless).toBe(true)
    expect(project.test.browser.instances).toEqual([{ browser: 'chromium' }])
    expect(project.plugins, "Storybook's plugin, and nothing else").toHaveLength(1)
  })

  it("points Storybook at the repository's own .storybook when none is named", () => {
    void storiesProject()

    expect(handed()).toEqual({ configDir: '.storybook' })
  })

  it('points Storybook at the directory a repository names', () => {
    void storiesProject({ configDir: 'tools/storybook/.storybook' })

    expect(handed()).toEqual({ configDir: 'tools/storybook/.storybook' })
  })

  it('pins a toolbar global for the whole project when a repository asks, and copies it', () => {
    const initialGlobals = { mode: 'dark' }

    void storiesProject({ initialGlobals })

    expect(handed()).toEqual({ configDir: '.storybook', initialGlobals: { mode: 'dark' } })
    expect((handed() as { initialGlobals: unknown }).initialGlobals).not.toBe(initialGlobals)
  })
})
