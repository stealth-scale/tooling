import { describe, expect, it } from 'vite-plus/test'

import { runConfig } from './run.ts'

describe('runConfig', () => {
  it('caches a script on the same terms as a task, so a second run is free', () => {
    expect(runConfig().cache).toEqual({ scripts: true, tasks: true })
  })

  it('never caches ci, whose point is to prove the tree from nothing', () => {
    expect(runConfig().tasks?.['ci']).toMatchObject({ cache: false })
  })

  it('proves the tree before it builds anything out of it', () => {
    const command = runConfig().tasks?.['ci'] as { command: string[] }

    expect(command.command.slice(0, 2)).toEqual(['bun install --frozen-lockfile', 'bun audit'])
    expect(command.command.indexOf('vp run -r build')).toBeLessThan(
      command.command.indexOf('vp test'),
    )
  })

  it('lets a repository say what its own ci does', () => {
    const command = runConfig({ ci: ['vp check'] }).tasks?.['ci'] as { command: string[] }

    expect(command.command).toEqual(['vp check'])
  })

  it('keeps ci beside whatever else a repository runs', () => {
    const tasks = runConfig({ tasks: { smoke: { cache: false, command: 'stealth smoke' } } }).tasks

    expect(Object.keys(tasks ?? {}).toSorted()).toEqual(['ci', 'smoke'])
  })
})
