import { describe, expect, it, vi } from 'vite-plus/test'

import { recordingShell } from '../shell/shell.fixtures.ts'
import { type Manifest } from '../workspace/manifests.ts'
import { configuredRegistry, registryHasVersion, withTrailingSlash } from './registry.ts'
import { registryWith } from './release.fixtures.ts'

describe('withTrailingSlash', () => {
  it('adds the slash once', () => {
    expect(withTrailingSlash('https://registry.example.test')).toBe(
      'https://registry.example.test/',
    )
    expect(withTrailingSlash('https://registry.example.test/')).toBe(
      'https://registry.example.test/',
    )
  })
})

describe('configuredRegistry', () => {
  it('asks npm for its registry and ends it with a slash', async () => {
    const fake = recordingShell(() => ({ stdout: 'https://registry.example.test\n' }))

    await expect(configuredRegistry(fake.shell, '/ws')).resolves.toBe(
      'https://registry.example.test/',
    )
    expect(fake.asked).toEqual([{ command: 'npm config get registry', cwd: '/ws', env: undefined }])
  })

  it('throws when npm names no registry, with what npm wrote', async () => {
    const silent = recordingShell(() => ({ stdout: '\n' }))
    await expect(configuredRegistry(silent.shell, '/ws')).rejects.toThrow('npm names no registry')

    const broken = recordingShell(() => ({ code: 1, stderr: 'npm error unknown config' }))
    await expect(configuredRegistry(broken.shell, '/ws')).rejects.toThrow(
      'npm error unknown config',
    )
  })
})

describe('registryHasVersion', () => {
  const manifest = { name: '@t/ui', version: '0.1.0' } as Manifest

  it('reads the versions the registry lists for the package, encoding the slash', async () => {
    const asked = registryWith({ '@t/ui': ['0.0.0', '0.1.0'] })

    await expect(registryHasVersion('http://127.0.0.1:1/', manifest, asked)).resolves.toBe(true)
    expect(asked).toHaveBeenCalledWith('http://127.0.0.1:1/@t%2Fui')
    await expect(
      registryHasVersion('http://127.0.0.1:1/', { ...manifest, version: '0.2.0' }, asked),
    ).resolves.toBe(false)
  })

  it('answers no for a package the registry has never seen, or a document without versions', async () => {
    await expect(
      registryHasVersion('http://127.0.0.1:1/', manifest, registryWith({})),
    ).resolves.toBe(false)

    const bare = vi.fn<typeof fetch>(() => Promise.resolve(new Response('{}')))
    await expect(registryHasVersion('http://127.0.0.1:1/', manifest, bare)).resolves.toBe(false)
  })

  it('throws on any other answer, or a document that is not a packument', async () => {
    const broken = vi.fn<typeof fetch>(() => Promise.resolve(new Response('', { status: 500 })))
    await expect(registryHasVersion('http://127.0.0.1:1/', manifest, broken)).rejects.toThrow(
      'answered 500 for @t/ui',
    )

    const odd = vi.fn<typeof fetch>(() => Promise.resolve(new Response('{"versions":"0.1.0"}')))
    await expect(registryHasVersion('http://127.0.0.1:1/', manifest, odd)).rejects.toThrow()
  })
})
