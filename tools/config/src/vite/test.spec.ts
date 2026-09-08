import { describe, expect, it } from 'vite-plus/test'

import { testConfig } from './test.ts'

/**
 * Describes a project entry, as far as this spec reads it.
 */
interface Project {
  test?: { environment?: string; exclude?: string[]; name?: string; setupFiles?: string[] }
}

/**
 * The projects a config carries, typed for reading.
 *
 * @param projects - What `testConfig` put in its `projects` field.
 * @returns Each project, in the order the runner takes them.
 */
function asProjects(projects: unknown): Project[] {
  return (projects ?? []) as Project[]
}

/**
 * The names of a config's projects.
 *
 * @param projects - What `testConfig` put in its `projects` field.
 * @returns Each project's name, in order.
 */
function namesOf(projects: unknown): (string | undefined)[] {
  return asProjects(projects).map((project) => project.test?.name)
}

describe('testConfig', () => {
  it('runs one environment where nothing renders', () => {
    expect(namesOf(testConfig().projects)).toEqual(['node'])
  })

  it('splits the environments by what the specification is, not where it sits', () => {
    const projects = asProjects(testConfig({ dom: true }).projects)

    expect(namesOf(testConfig({ dom: true }).projects)).toEqual(['node', 'dom'])
    expect(projects[0]?.test?.environment, 'a .spec.ts needs no document').toBe('node')
    expect(projects[1]?.test?.environment, 'a .spec.tsx renders').toBe('jsdom')
  })

  it('holds every file to a floor nobody has to remember to measure', () => {
    const { coverage } = testConfig()

    expect(coverage?.enabled, 'on by default').toBe(true)
    expect(coverage?.thresholds, 'per file, so a covered module cannot carry a bare one').toEqual({
      100: true,
      perFile: true,
    })
  })

  it('never counts what a person did not write, or what is data for a story', () => {
    expect(testConfig().coverage?.exclude).toContain('**/*.gen.*')
    expect(testConfig().coverage?.exclude, 'a fixture has no spec').toContain('**/*.fixtures.*')
    expect(testConfig({ uncovered: ['**/emit.ts'] }).coverage?.exclude).toContain('**/emit.ts')
  })

  it('waits longer than Testing Library does, so a failure names what it looked for', () => {
    expect(testConfig().testTimeout).toBeGreaterThan(5000)
  })

  it('leaves a suite a browser driver owns to that driver', () => {
    const [node] = asProjects(testConfig({ exclude: ['**/e2e/**'] }).projects)

    expect(node?.test?.exclude).toContain('**/e2e/**')
    expect(node?.test?.exclude, 'the shared exclusions survive').toContain('**/dist/**')
  })

  it('loads a document setup only where one was asked for', () => {
    const withSetup = asProjects(testConfig({ dom: true, setupFiles: ['./setup.ts'] }).projects)
    const without = asProjects(testConfig({ dom: true }).projects)

    expect(withSetup[1]?.test?.setupFiles).toEqual(['./setup.ts'])

    // Read the project out before asserting on it: `expect(undefined).not.toHaveProperty(…)`
    // passes whether or not the project is there, which would prove nothing.
    const dom = without[1]?.test

    expect(dom, 'the jsdom project is there to assert about').toBeDefined()
    expect(dom, 'no empty setupFiles key to argue with').not.toHaveProperty('setupFiles')
  })

  it('takes a project a repository builds itself, such as one that renders stories', () => {
    const stories = { test: { name: 'storybook' } }

    expect(namesOf(testConfig({ projects: [stories] }).projects)).toEqual(['node', 'storybook'])
  })
})
