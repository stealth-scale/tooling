import { describe, expect, it } from 'vite-plus/test'

import { runConfig } from './run.ts'

/**
 * Reads the commands a task runs.
 */
function commandOf(tasks: ReturnType<typeof runConfig>['tasks'], name: string): string[] {
  const task = tasks?.[name] as { command: string | string[] } | undefined
  return [task?.command ?? []].flat()
}

describe('runConfig', () => {
  it('caches a script on the same terms as a task, so a second run is free', () => {
    expect(runConfig().cache).toEqual({ scripts: true, tasks: true })
  })

  it('never caches ci, whose point is to prove the tree from nothing', () => {
    expect(runConfig().tasks?.['ci']).toMatchObject({ cache: false })
  })

  it('proves the tree before it builds anything out of it', () => {
    const command = commandOf(runConfig().tasks, 'ci')

    expect(command.slice(0, 2)).toEqual(['bun install --frozen-lockfile', 'bun audit'])
    expect(command.indexOf('vp run -r build')).toBeLessThan(command.indexOf('vp test'))
  })

  it('lets a repository say what its own ci does', () => {
    expect(commandOf(runConfig({ ci: ['vp check'] }).tasks, 'ci')).toEqual(['vp check'])
  })

  it('keeps ci beside whatever else a repository runs', () => {
    const tasks = runConfig({ tasks: { smoke: { cache: false, command: 'stealth smoke' } } }).tasks

    expect(Object.keys(tasks ?? {}).toSorted()).toEqual(['ci', 'smoke'])
  })

  it('gives a repository with no Storybook no task to serve or build one', () => {
    expect(Object.keys(runConfig().tasks ?? {})).toEqual(['ci'])
  })

  it("serves and builds a Storybook on Storybook's own defaults, and builds it in ci last", () => {
    const { tasks } = runConfig({ storybook: true })

    expect(commandOf(tasks, 'storybook')).toEqual(['storybook dev'])
    expect(tasks?.['storybook']).toMatchObject({ cache: false })
    expect(commandOf(tasks, 'storybook:build')).toEqual(['storybook build'])
    expect(commandOf(tasks, 'ci').at(-1)).toBe('vp run storybook:build')
  })

  it("keeps the Storybook build's own output out of its cache key", () => {
    const build = runConfig({ storybook: true }).tasks?.['storybook:build'] as {
      input: unknown[]
      output: string[]
    }

    expect(build.output).toEqual(['storybook-static/**'])
    expect(build.input).toContain('!storybook-static/**')
  })

  it("leaves a repository's own ci list alone, Storybook or not", () => {
    expect(commandOf(runConfig({ ci: ['vp check'], storybook: true }).tasks, 'ci')).toEqual([
      'vp check',
    ])
  })
})
