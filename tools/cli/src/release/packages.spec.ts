import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vite-plus/test'

import { packageFiles, scratchWorkspace } from '@stealthscale/tool-testing'
import { type Manifest } from '@stealthscale/tool-workspace'

import { recordingShell } from '#shell/shell.fixtures.ts'

import { missingFiles, pack, publishTarball } from './packages.ts'

/** A manifest with the fields that matter here. */
function manifest(name: string, fields: Partial<Manifest> = {}): Manifest {
  return {
    access: 'public',
    bin: {},
    build: 'vp pack',
    contributions: undefined,
    dependencies: {},
    description: undefined,
    directory: `/ws/${name.replace('@t/', '')}`,
    exports: undefined,
    files: ['dist'],
    name,
    private: false,
    registry: undefined,
    version: '0.0.0',
    ...fields,
  }
}

describe('missingFiles', () => {
  it('lists the paths the manifest ships that are not there, and skips a glob', () => {
    const workspace = scratchWorkspace({
      ...packageFiles('packages/a', { files: ['dist', 'source.css', 'src/*.css'], name: '@t/a' }),
      'packages/a/dist/index.mjs': 'export {}\n',
    })

    expect(
      missingFiles(
        manifest('@t/a', {
          directory: workspace.path('packages/a'),
          files: ['dist', 'source.css', 'src/*.css'],
        }),
      ),
    ).toEqual(['source.css'])
    workspace.remove()
  })

  it('names nothing for a manifest without files, or with every file in place', () => {
    const workspace = scratchWorkspace({ 'packages/a/dist/index.mjs': 'export {}\n' })

    expect(
      missingFiles(manifest('@t/a', { directory: workspace.path('packages/a'), files: undefined })),
    ).toEqual([])
    expect(missingFiles(manifest('@t/a', { directory: workspace.path('packages/a') }))).toEqual([])
    workspace.remove()
  })
})

describe('pack', () => {
  it('asks bun for a quiet tarball in the destination and reads its path off the last line', async () => {
    const fake = recordingShell(() => ({
      stdout: '[0.01ms] ".env"\n/run/tarballs/t-a-0.0.0.tgz\n',
    }))

    const result = await pack(manifest('@t/a'), '/run/tarballs', fake.shell)

    expect(fake.asked).toEqual([
      { command: 'bun pm pack --destination /run/tarballs --quiet', cwd: '/ws/a', env: undefined },
    ])
    expect(result.packed?.tarball).toBe('/run/tarballs/t-a-0.0.0.tgz')
    expect(result.step).toEqual({
      detail: '/run/tarballs/t-a-0.0.0.tgz',
      name: 'pack @t/a',
      ok: true,
    })
  })

  it('resolves a relative tarball name against the destination', async () => {
    const fake = recordingShell(() => ({ stdout: 't-a-0.0.0.tgz\n' }))

    const result = await pack(manifest('@t/a'), '/run/tarballs', fake.shell)

    expect(result.packed?.tarball).toBe('/run/tarballs/t-a-0.0.0.tgz')
  })

  it('fails when bun does, or when bun named no tarball', async () => {
    const refused = recordingShell(() => ({ code: 1, stderr: 'error: no files' }))
    await expect(pack(manifest('@t/a'), '/run/tarballs', refused.shell)).resolves.toEqual({
      step: { detail: 'error: no files', name: 'pack @t/a', ok: false },
    })

    const silent = recordingShell(() => ({ stdout: 'nothing here\n' }))
    const result = await pack(manifest('@t/a'), '/run/tarballs', silent.shell)
    expect(result.packed).toBeUndefined()
    expect(result.step.ok).toBe(false)
  })
})

describe('publishTarball', () => {
  it('uploads with npm and leaves the access to the manifest npm reads', async () => {
    const fake = recordingShell()

    await publishTarball(
      '/run/t.tgz',
      '/run',
      { dryRun: false, provenance: false, userconfig: '/run/npmrc' },
      fake.shell,
    )

    expect(fake.asked).toEqual([
      {
        command: 'npm publish /run/t.tgz',
        cwd: '/run',
        env: { NPM_CONFIG_USERCONFIG: '/run/npmrc' },
      },
    ])
  })

  it("asks for a dry run and for provenance when told, and leaves npm's own config alone without a token", async () => {
    const fake = recordingShell()

    await publishTarball('/run/t.tgz', '/run', { dryRun: true, provenance: true }, fake.shell)

    expect(fake.asked[0]?.command).toBe('npm publish /run/t.tgz --dry-run --provenance')
    expect(fake.asked[0]?.env).toBeUndefined()
  })

  it('uploads to the registry the run names, rather than the one npm is configured for', async () => {
    const fake = recordingShell()

    await publishTarball(
      '/run/t.tgz',
      '/run',
      { dryRun: false, provenance: false, registry: 'http://127.0.0.1:4873/' },
      fake.shell,
    )

    expect(fake.asked[0]?.command).toBe('npm publish /run/t.tgz --registry http://127.0.0.1:4873/')
  })

  it('names no registry when the run names none, so npm reads its own configuration', async () => {
    const fake = recordingShell()

    await publishTarball(
      '/run/t.tgz',
      '/run',
      { dryRun: false, provenance: false, registry: undefined },
      fake.shell,
    )

    expect(fake.asked[0]?.command).not.toContain('--registry')
  })
})

describe('pack, writing the ranges', () => {
  it('publishes the version going out, not the one the lockfile remembers', async () => {
    const declared = { dependencies: { '@t/b': 'workspace:^' }, name: '@t/a', version: '0.1.0' }
    const workspace = scratchWorkspace({ 'packages/a/package.json': JSON.stringify(declared) })
    const directory = workspace.path('packages/a')
    const seen: string[] = []
    const { shell } = recordingShell(() => {
      seen.push(readFileSync(join(directory, 'package.json'), 'utf8'))
      return { stdout: 'a-0.1.0.tgz\n' }
    })

    await pack(manifest('@t/a', { directory }), '/out', shell, new Map([['@t/b', '0.1.0']]))

    expect(seen[0], 'what bun packed').toContain('"@t/b": "^0.1.0"')
    expect(
      readFileSync(join(directory, 'package.json'), 'utf8'),
      'and the file it was packed from, put back',
    ).toBe(JSON.stringify(declared))
  })

  it('puts the manifest back when bun fails, so a broken run leaves no edit behind', async () => {
    const declared = { dependencies: { '@t/b': 'workspace:^' }, name: '@t/a', version: '0.1.0' }
    const workspace = scratchWorkspace({ 'packages/a/package.json': JSON.stringify(declared) })
    const directory = workspace.path('packages/a')
    const { shell } = recordingShell(() => {
      throw new Error('bun died')
    })

    await expect(
      pack(manifest('@t/a', { directory }), '/out', shell, new Map([['@t/b', '0.1.0']])),
    ).rejects.toThrow(/bun died/u)
    expect(readFileSync(join(directory, 'package.json'), 'utf8')).toBe(JSON.stringify(declared))
  })

  it('refuses a manifest that is not an object rather than writing an empty one over it', async () => {
    const workspace = scratchWorkspace({ 'packages/a/package.json': '"not a manifest"' })
    const directory = workspace.path('packages/a')
    const { shell } = recordingShell()

    await expect(
      pack(manifest('@t/a', { directory }), '/out', shell, new Map([['@t/b', '0.1.0']])),
    ).rejects.toThrow(/parsed to string/u)
    expect(
      readFileSync(join(directory, 'package.json'), 'utf8'),
      'and it threw before anything was written',
    ).toBe('"not a manifest"')
  })
})
