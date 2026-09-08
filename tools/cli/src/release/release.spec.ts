import { join } from 'node:path'
import { describe, expect, it } from 'vite-plus/test'

import { recordingShell } from '../shell/shell.fixtures.ts'
import {
  CONFIGURED_REGISTRY,
  packing,
  registryWith,
  releaseWorkspace,
  THEME_REGISTRY,
} from './release.fixtures.ts'
import { release, releaseSet } from './release.ts'

/** This repository. */
const HERE = join(import.meta.dirname, '..', '..', '..', '..')

/** The run's registry, as the report names it. */
const REGISTRY = `${CONFIGURED_REGISTRY}/`

describe('releaseSet', () => {
  it('is every public package and what it depends on, dependencies first', () => {
    const scratch = releaseWorkspace()

    const set = releaseSet(scratch.root)

    expect(set.hidden).toEqual([])
    expect(set.ordered.map((manifest) => manifest.name)).toEqual([
      '@t/utils',
      '@t/theme-base',
      '@t/ui',
      '@t/unbuilt',
    ])
    expect(set.ordered[0]).toMatchObject({
      directory: scratch.path('packages/utils'),
      version: '0.1.0',
    })
    scratch.remove()
  })

  it('names a private package the set depends on', () => {
    const scratch = releaseWorkspace({ hidden: true })

    const set = releaseSet(scratch.root)

    expect(set.hidden).toEqual(['@t/testing'])
    expect(set.ordered.map((manifest) => manifest.name)).toContain('@t/composite')
    scratch.remove()
  })

  it('in this repository is every package, with nothing private in the way', () => {
    const set = releaseSet(HERE)

    expect(set.hidden).toEqual([])
    expect(set.ordered.map((manifest) => manifest.name)).toContain('@stealthscale/tool-cli')
    expect(set.ordered.every((manifest) => !manifest.private)).toBe(true)
  })
})

describe('release', () => {
  it('publishes what the registry lacks, in order, skips what it has, and refuses what was never built', async () => {
    const scratch = releaseWorkspace()
    const tarballs = scratch.path('tarballs')
    const fake = recordingShell(packing)

    const report = await release(
      {
        dryRun: false,
        fetch: registryWith({ '@t/theme-base': ['0.1.0'] }),
        provenance: false,
        registry: REGISTRY,
        root: scratch.root,
        tarballs,
        userconfig: '/run/npmrc',
      },
      fake.shell,
    )

    expect(report.steps).toEqual([
      { detail: `4 packages to ${REGISTRY}`, name: 'release set', ok: true },
      { detail: 'New tag: @t/utils@0.1.0', name: 'publish @t/utils@0.1.0', ok: true },
      { detail: 'already on the registry', name: 'publish @t/theme-base@0.1.0', ok: true },
      { detail: 'New tag: @t/ui@0.1.0', name: 'publish @t/ui@0.1.0', ok: true },
      { detail: 'not built: dist missing', name: 'publish @t/unbuilt@0.1.0', ok: false },
    ])
    expect(fake.asked.map((asked) => asked.command)).toEqual([
      `bun pm pack --destination ${tarballs} --quiet`,
      `npm publish ${join(tarballs, 'utils.tgz')}`,
      `bun pm pack --destination ${tarballs} --quiet`,
      `npm publish ${join(tarballs, 'ui.tgz')}`,
    ])
    expect(fake.asked[1]?.env).toEqual({ NPM_CONFIG_USERCONFIG: '/run/npmrc' })
    scratch.remove()
  })

  it("asks the registry a manifest names for that package, and the run's registry for the rest", async () => {
    const scratch = releaseWorkspace()
    const asked = registryWith({})

    await release(
      {
        dryRun: true,
        fetch: asked,
        provenance: false,
        registry: CONFIGURED_REGISTRY,
        root: scratch.root,
        tarballs: scratch.path('tarballs'),
      },
      recordingShell(packing).shell,
    )

    expect(asked).toHaveBeenCalledWith(`${REGISTRY}@t%2Futils`)
    expect(asked).toHaveBeenCalledWith(`${THEME_REGISTRY}/@t%2Ftheme-base`)
    scratch.remove()
  })

  it('asks npm for the registry when the run names none', async () => {
    const scratch = releaseWorkspace()
    const fake = recordingShell(packing)
    const asked = registryWith({})

    const report = await release(
      {
        dryRun: true,
        fetch: asked,
        provenance: false,
        root: scratch.root,
        tarballs: scratch.path('tarballs'),
      },
      fake.shell,
    )

    expect(report.steps[0]?.detail).toBe(`4 packages to ${REGISTRY}`)
    expect(fake.asked[0], 'asked where the publish will run, not in the workspace').toEqual({
      command: 'npm config get registry',
      cwd: scratch.path('tarballs'),
      env: undefined,
    })
    expect(asked).toHaveBeenCalledWith(`${REGISTRY}@t%2Futils`)
    scratch.remove()
  })

  it('stops at the first failure, so no dependent is published without its dependency', async () => {
    const scratch = releaseWorkspace()
    const fake = recordingShell((command, cwd) =>
      command.startsWith('npm publish') && command.includes('utils.tgz')
        ? { code: 1, stderr: 'npm error code E403' }
        : packing(command, cwd),
    )

    const report = await release(
      {
        dryRun: true,
        fetch: registryWith({}),
        provenance: true,
        registry: REGISTRY,
        root: scratch.root,
        tarballs: scratch.path('tarballs'),
      },
      fake.shell,
    )

    expect(report.steps.map((step) => [step.name, step.ok, step.detail])).toEqual([
      ['release set', true, `4 packages to ${REGISTRY}`],
      ['publish @t/utils@0.1.0', false, 'npm error code E403'],
      ['publish @t/theme-base@0.1.0', false, 'not attempted: an earlier publish failed'],
      ['publish @t/ui@0.1.0', false, 'not attempted: an earlier publish failed'],
      ['publish @t/unbuilt@0.1.0', false, 'not attempted: an earlier publish failed'],
    ])
    expect(fake.asked[1]?.command).toContain('--dry-run --provenance')
    scratch.remove()
  })

  it('reports a dry run as such instead of a tag', async () => {
    const scratch = releaseWorkspace()

    const report = await release(
      {
        dryRun: true,
        fetch: registryWith({}),
        provenance: false,
        registry: REGISTRY,
        root: scratch.root,
        tarballs: scratch.path('tarballs'),
      },
      recordingShell(packing).shell,
    )

    expect(report.steps[1]).toEqual({
      detail: 'dry run',
      name: 'publish @t/utils@0.1.0',
      ok: true,
    })
    scratch.remove()
  })

  it('refuses the whole set when it depends on a private package, and packs nothing', async () => {
    const scratch = releaseWorkspace({ hidden: true })
    const fake = recordingShell(packing)

    const report = await release(
      {
        dryRun: false,
        fetch: registryWith({}),
        provenance: false,
        registry: REGISTRY,
        root: scratch.root,
        tarballs: scratch.path('tarballs'),
      },
      fake.shell,
    )

    expect(report.steps).toEqual([
      {
        detail: 'private, so nothing that depends on them can be installed: @t/testing',
        name: 'release set',
        ok: false,
      },
    ])
    expect(fake.asked).toEqual([])
    scratch.remove()
  })

  it('fails the package whose tarball could not be made, and stops there', async () => {
    const scratch = releaseWorkspace()
    const fake = recordingShell((command, cwd) =>
      command.startsWith('bun pm pack') && cwd.endsWith('/utils')
        ? { code: 1, stderr: 'error: nothing to pack' }
        : packing(command, cwd),
    )

    const report = await release(
      {
        dryRun: false,
        fetch: registryWith({}),
        provenance: false,
        registry: REGISTRY,
        root: scratch.root,
        tarballs: scratch.path('tarballs'),
      },
      fake.shell,
    )

    expect(report.steps[1]).toEqual({
      detail: 'error: nothing to pack',
      name: 'pack @t/utils',
      ok: false,
    })
    expect(report.steps.slice(2).every((step) => !step.ok)).toBe(true)
    scratch.remove()
  })
})
