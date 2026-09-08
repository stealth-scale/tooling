import { runCommand } from 'citty'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vite-plus/test'

import { type RecordedCommand, recordingShell } from '../shell/shell.fixtures.ts'
import { releaseCommand, releaseCommandWith, type ReleaseDeps } from './command.ts'
import { CONFIGURED_REGISTRY, packing, registryWith, releaseWorkspace } from './release.fixtures.ts'

/** The command, its dependencies, and what it wrote. */
function commandFor(
  cwd: string,
  versions: Record<string, string[]> = {},
  changesets?: string,
): {
  asked: RecordedCommand[]
  command: ReturnType<typeof releaseCommandWith>
  deps: ReleaseDeps
  written: string[]
} {
  const fake = recordingShell(packing)
  const written: string[] = []
  const deps: ReleaseDeps = {
    changesetsOutput: changesets,
    cwd,
    fetch: registryWith(versions),
    log: (text) => {
      written.push(text)
    },
    shell: fake.shell,
  }
  return { asked: fake.asked, command: releaseCommandWith(deps), deps, written }
}

describe('releaseCommandWith', () => {
  const exitCode = process.exitCode

  afterEach(() => {
    process.exitCode = exitCode
  })

  it('names itself and every argument it takes', () => {
    const { command } = commandFor(tmpdir())

    expect(command.meta).toMatchObject({ name: 'release' })
    expect(Object.keys(command.args ?? {})).toEqual([
      'dry-run',
      'provenance',
      'registry',
      'tarballs',
      'userconfig',
    ])
  })

  it('releases the workspace the run was started in, and writes the report', async () => {
    const scratch = releaseWorkspace()
    const { asked, command, written } = commandFor(scratch.path('packages/utils'))

    await runCommand(command, {
      rawArgs: ['--dry-run', '--registry', CONFIGURED_REGISTRY, '--tarballs', scratch.path('t')],
    })

    expect(written.join('')).toContain(`4 packages to ${CONFIGURED_REGISTRY}/`)
    expect(written.join('')).toContain('publish @t/utils@0.1.0')
    expect(asked[1]?.command).toContain('--dry-run')
    expect(asked[1]?.command).not.toContain('--provenance')
    scratch.remove()
  })

  it('leaves the registry and the token to npm when the run names neither', async () => {
    const scratch = releaseWorkspace()
    const { asked, command } = commandFor(scratch.root)

    await runCommand(command, {
      rawArgs: ['--dry-run', '--provenance', '--tarballs', scratch.path('t')],
    })

    expect(asked[0]?.command).toBe('npm config get registry')
    expect(asked[2]?.command).toContain('--provenance')
    expect(asked[2]?.env).toBeUndefined()
    scratch.remove()
  })

  it('reads the token from the file it is pointed at', async () => {
    const scratch = releaseWorkspace()
    const { asked, command } = commandFor(scratch.root)

    await runCommand(command, {
      rawArgs: ['--tarballs', scratch.path('t'), '--userconfig', scratch.path('npmrc')],
    })

    expect(asked[2]?.env).toEqual({ NPM_CONFIG_USERCONFIG: scratch.path('npmrc') })
    scratch.remove()
  })

  it('writes the tarballs to a new temporary directory when the run names none', async () => {
    const scratch = releaseWorkspace()
    const { asked, command } = commandFor(scratch.root)

    await runCommand(command, { rawArgs: ['--dry-run'] })

    const destination = asked[1]?.command.split(' ').at(-2) ?? ''
    expect(destination.startsWith(tmpdir())).toBe(true)
    expect(existsSync(destination)).toBe(true)
    expect(readdirSync(destination)).toEqual([])
    scratch.remove()
  })

  it('fails the process when a package could not be published', async () => {
    const scratch = releaseWorkspace()
    const { command, written } = commandFor(scratch.root)

    await runCommand(command, { rawArgs: ['--dry-run', '--tarballs', scratch.path('t')] })

    expect(written.join('')).toContain('not built: dist missing')
    expect(process.exitCode).toBe(1)
    scratch.remove()
  })

  it('leaves the exit code alone when every package went out', async () => {
    const scratch = releaseWorkspace()
    const versions = { '@t/unbuilt': ['0.1.0'] }
    const { command, written } = commandFor(scratch.root, versions)

    await runCommand(command, { rawArgs: ['--dry-run', '--tarballs', scratch.path('t')] })

    expect(written.join('')).toContain('5 steps, all passed')
    expect(process.exitCode).toBe(exitCode)
    scratch.remove()
  })
})

describe('releaseCommand with a changesets output', () => {
  it('writes the tags where the action reads them', async () => {
    const scratch = releaseWorkspace()
    const output = scratch.path('changesets.ndjson')
    const { command } = commandFor(scratch.root, { '@t/unbuilt': ['0.1.0'] }, output)

    await runCommand(command, { rawArgs: ['--tarballs', scratch.path('t')] })

    expect(readFileSync(output, 'utf8').trim().split('\n')).toHaveLength(3)
    scratch.remove()
  })
})

describe('releaseCommand', () => {
  it('is the same command, built against this process and the real registry', () => {
    expect(releaseCommand.meta).toMatchObject({ name: 'release' })
    expect(Object.keys(releaseCommand.args ?? {})).toContain('registry')
  })
})
