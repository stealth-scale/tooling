import { describe, expect, it } from 'vite-plus/test'

import { type Manifest, packageRoot, readManifest } from '@stealthscale/tool-workspace'

import { commandMeta, stealth } from './cli.ts'
import { releaseCommand } from './release/command.ts'

/** This package's own manifest, which the command reads itself off. */
const SELF = readManifest(packageRoot(import.meta.dirname))

describe('commandMeta', () => {
  it('names the command after what the manifest installs', () => {
    expect(commandMeta(SELF)).toEqual({
      description: SELF.description,
      name: 'stealth',
      version: SELF.version,
    })
  })

  it('falls back to the package for one that installs nothing and says nothing', () => {
    const bare = { ...SELF, bin: {}, description: undefined } satisfies Manifest

    expect(commandMeta(bare)).toEqual({
      description: '',
      name: SELF.name,
      version: SELF.version,
    })
  })
})

describe('stealth', () => {
  it('calls itself what this package installs, at the version it carries', () => {
    expect(stealth.meta).toEqual(commandMeta(SELF))
  })

  it('imports a subcommand only when it is asked for', async () => {
    const subCommands = stealth.subCommands as Record<string, () => Promise<unknown>>

    expect(Object.keys(subCommands)).toEqual(['release'])
    await expect(subCommands['release']?.()).resolves.toBe(releaseCommand)
  })
})
