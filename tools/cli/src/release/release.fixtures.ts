import { vi } from 'vite-plus/test'

import {
  type ManifestFields,
  packageFiles,
  type ScratchFiles,
  type ScratchWorkspace,
  scratchWorkspace,
  workspaceFiles,
} from '@stealthscale/tool-testing'

import { type Answer } from '#shell/shell.fixtures.ts'

/**
 * Names the registry the fixture shell's npm is configured for.
 */
export const CONFIGURED_REGISTRY = 'http://127.0.0.1:1'

/**
 * Names the registry the theme's manifest points at, which is not the configured one.
 */
export const THEME_REGISTRY = 'http://127.0.0.1:2'

/**
 * Writes a built package: its manifest, and the `dist` its files name.
 *
 * @param {string} directory - The package's directory, relative to the workspace root.
 * @param {ManifestFields} fields - The manifest's fields.
 * @returns {ScratchFiles} The files to write.
 */
export function built(directory: string, fields: ManifestFields): ScratchFiles {
  return packageFiles(
    directory,
    { files: ['dist'], publishConfig: { access: 'public' }, version: '0.1.0', ...fields },
    { 'dist/index.mjs': 'export {}\n' },
  )
}

/**
 * Builds a scratch workspace: a leaf, a theme on a registry of its own, an umbrella
 * depending on the leaf, a library that was never built, a private tool nothing depends on,
 * and, when asked, a composite depending on that tool.
 *
 * @param {{ hidden?: boolean }} options - Whether to add the composite that depends on the private tool.
 * @returns {ScratchWorkspace} The workspace, to remove after the case.
 */
export function releaseWorkspace({ hidden = false } = {}): ScratchWorkspace {
  return scratchWorkspace({
    ...workspaceFiles(['packages/*', 'themes/*', 'tools/*', 'ui/*']),
    ...built('packages/utils', { name: '@t/utils', scripts: { build: 'vp pack' } }),
    ...built('themes/base', {
      name: '@t/theme-base',
      publishConfig: { access: 'public', registry: THEME_REGISTRY },
      scripts: { build: 'node ./emit.ts && vp pack' },
    }),
    ...built('ui/ui', {
      dependencies: { '@t/utils': 'workspace:^' },
      name: '@t/ui',
      scripts: { build: 'vp pack' },
    }),
    ...packageFiles('ui/unbuilt', {
      files: ['dist'],
      name: '@t/unbuilt',
      scripts: { build: 'vp pack' },
      version: '0.1.0',
    }),
    ...packageFiles('tools/testing', { name: '@t/testing', private: true }),
    ...(hidden
      ? packageFiles('ui/composite', {
          dependencies: { '@t/testing': 'workspace:^' },
          name: '@t/composite',
          version: '0.1.0',
        })
      : {}),
  })
}

/**
 * Builds a registry that answers one package's versions, or a 404, and records what it was
 * asked.
 *
 * @param {Record<string, string[]>} versions - Each package's published versions.
 * @returns {typeof fetch} The fetch, as a mock that records its calls.
 */
export function registryWith(versions: Record<string, string[]>): typeof fetch {
  return vi.fn<typeof fetch>((input) => {
    const name = decodeURIComponent(new Request(input).url.split('/').at(-1) ?? '')
    const known = versions[name]
    return Promise.resolve(
      known === undefined
        ? new Response('{"error":"not found"}', { status: 404 })
        : new Response(JSON.stringify({ versions: Object.fromEntries(known.map((v) => [v, {}])) })),
    )
  })
}

/**
 * Answers a recording shell: `bun pm pack` names a tarball after the package directory, and
 * npm knows its configured registry.
 *
 * @param {string} command - The command line asked.
 * @param {string} cwd - The directory it was asked in.
 * @returns {ReturnType<Answer>} The output that command wrote, and how it exited.
 */
export const packing: Answer = (command, cwd) => {
  if (command.startsWith('bun pm pack')) return { stdout: `${cwd.split('/').at(-1)}.tgz\n` }
  if (command === 'npm config get registry') return { stdout: `${CONFIGURED_REGISTRY}\n` }
  return {}
}
