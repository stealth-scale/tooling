import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test'

import {
  packageFiles,
  type ScratchWorkspace,
  scratchWorkspace,
  workspaceFiles,
} from '@stealthscale/tool-testing'

import {
  dependencyClosure,
  dependencyManifests,
  expandWorkspacePattern,
  packageRoot,
  readManifest,
  workspaceManifests,
  workspacePatterns,
  workspaceRoot,
} from './manifests.ts'

/** This repository, whose manifests the real-tree cases read. */
const HERE = join(import.meta.dirname, '..', '..', '..')

describe('manifests', () => {
  let workspace: ScratchWorkspace
  let installs: ScratchWorkspace

  beforeAll(() => {
    workspace = scratchWorkspace({
      ...workspaceFiles(['packages/*', 'ui/*/*', 'lone', 'absent/*']),
      ...packageFiles('packages/a', {
        name: '@t/a',
        scripts: { build: 'vp pack' },
        version: '1.0.0',
      }),
      ...packageFiles('packages/b', {
        bin: { 'b-tool': './dist/b.mjs' },
        dependencies: { '@t/a': 'workspace:^', react: '^19' },
        description: 'The second package.',
        files: ['dist'],
        name: '@t/b',
        publishConfig: { access: 'public', registry: 'https://registry.example.test' },
        version: '1.0.0',
      }),
      ...packageFiles('ui/primitives/p', { name: '@t/p', private: true }),
      ...packageFiles('ui/composites/c', {
        dependencies: { '@t/b': 'workspace:^', '@t/p': 'workspace:^' },
        name: '@t/c',
      }),
      ...packageFiles('lone', { bin: './run.mjs', name: 'lone', version: '2.0.0' }),
      'packages/no-manifest/README.md': '',
    })

    installs = scratchWorkspace({
      ...workspaceFiles(['packages/*'], {
        dependencies: { '@t/gone': '^1', '@t/runtime': '^1' },
        devDependencies: { '@t/dev': '^1', '@t/odd': '^1', '@t/runtime': '^1' },
      }),
      ...packageFiles('node_modules/@t/runtime', {
        name: '@t/runtime',
        stealth: { theme: { name: 'kalon', title: 'Kalon' } },
      }),
      ...packageFiles('node_modules/@t/dev', { name: '@t/dev' }),
      ...packageFiles('node_modules/@t/odd', { files: 'dist', name: '@t/odd' }),
    })
  })

  afterAll(() => {
    workspace.remove()
    installs.remove()
  })

  describe('workspaceRoot', () => {
    it('finds the nearest manifest above a directory that names workspaces', () => {
      expect(workspaceRoot(workspace.path('packages/a'))).toBe(workspace.root)
      expect(workspaceRoot(workspace.path('ui/composites/c'))).toBe(workspace.root)
      expect(workspaceRoot(workspace.root)).toBe(workspace.root)
    })

    it('throws when no manifest above the directory names workspaces', () => {
      const alone = scratchWorkspace({ 'package.json': '{ "name": "alone" }' })

      expect(() => workspaceRoot(alone.root)).toThrow('names workspaces')
      alone.remove()
    })
  })

  describe('packageRoot', () => {
    it('finds the nearest manifest above a directory, whether or not it names workspaces', () => {
      expect(packageRoot(workspace.path('packages/a'))).toBe(workspace.path('packages/a'))
      expect(packageRoot(workspace.path('packages/no-manifest'))).toBe(workspace.root)
      expect(packageRoot(import.meta.dirname)).toBe(join(HERE, 'tools', 'workspace'))
    })

    it('throws when no directory above it holds one', () => {
      expect(() => packageRoot('/')).toThrow('holds a manifest')
    })
  })

  describe('workspacePatterns', () => {
    it('reads the object form and the array form, and answers none for neither', () => {
      expect(workspacePatterns(workspace.root)).toEqual([
        'packages/*',
        'ui/*/*',
        'lone',
        'absent/*',
      ])

      const other = scratchWorkspace({
        'package.json': '{ "workspaces": { "packages": ["apps/*"] } }',
      })
      expect(workspacePatterns(other.root)).toEqual(['apps/*'])
      other.write({ 'package.json': '{ "name": "not-a-workspace" }' })
      expect(workspacePatterns(other.root)).toEqual([])
      other.write({ 'package.json': '{ "workspaces": {} }' })
      expect(workspacePatterns(other.root)).toEqual([])
      other.remove()
    })
  })

  describe('expandWorkspacePattern', () => {
    it('walks every subdirectory for a star and keeps a literal even when it is missing', () => {
      const root = workspace.root

      expect(expandWorkspacePattern(root, 'ui/*/*').toSorted()).toEqual([
        join(root, 'ui/composites/c'),
        join(root, 'ui/primitives/p'),
      ])
      expect(expandWorkspacePattern(root, 'packages/*').toSorted()).toEqual([
        join(root, 'packages/a'),
        join(root, 'packages/b'),
        join(root, 'packages/no-manifest'),
      ])
      expect(expandWorkspacePattern(root, 'lone')).toEqual([join(root, 'lone')])
      expect(expandWorkspacePattern(root, 'absent/*')).toEqual([])
      expect(expandWorkspacePattern(root, 'nowhere')).toEqual([join(root, 'nowhere')])
    })
  })

  describe('readManifest', () => {
    it('narrows the manifest to what the tool needs, publishConfig included', () => {
      expect(readManifest(workspace.path('packages/b'))).toEqual({
        access: 'public',
        bin: { 'b-tool': './dist/b.mjs' },
        build: undefined,
        contributions: undefined,
        dependencies: { '@t/a': 'workspace:^', react: '^19' },
        description: 'The second package.',
        directory: workspace.path('packages/b'),
        exports: undefined,
        files: ['dist'],
        name: '@t/b',
        private: false,
        registry: 'https://registry.example.test',
        version: '1.0.0',
      })
      expect(readManifest(workspace.path('ui/primitives/p'))).toMatchObject({
        access: undefined,
        bin: {},
        build: undefined,
        dependencies: {},
        description: undefined,
        files: undefined,
        private: true,
        registry: undefined,
      })
      expect(readManifest(workspace.path('packages/a')).build).toBe('vp pack')
    })

    it('names the one command of a string bin after the package, without its scope', () => {
      expect(readManifest(workspace.path('lone')).bin).toEqual({ lone: './run.mjs' })

      const scoped = scratchWorkspace({
        'package.json': '{ "name": "@t/tool", "version": "1.0.0", "bin": "./cli.mjs" }',
      })
      expect(readManifest(scoped.root).bin).toEqual({ tool: './cli.mjs' })
      scoped.remove()
    })

    it('carries the stealth field as written, whatever shape it has', () => {
      const registering = scratchWorkspace({
        'package.json':
          '{ "name": "@t/thesmos", "version": "1.0.0", "stealth": { "theme": { "title": "Thesmos" } } }',
      })

      expect(readManifest(registering.root).contributions).toEqual({ theme: { title: 'Thesmos' } })

      registering.write({
        'package.json': '{ "name": "@t/thesmos", "version": "1.0.0", "stealth": 5 }',
      })
      expect(readManifest(registering.root).contributions).toBe(5)
      registering.remove()
    })

    it('carries the exports map as written, so a consumer reads one entry off it', () => {
      const exporting = scratchWorkspace({
        'package.json':
          '{ "name": "@t/kalon", "version": "1.0.0", "exports": { "./values": "./dist/values.mjs" } }',
      })

      expect(readManifest(exporting.root).exports).toEqual({ './values': './dist/values.mjs' })
      exporting.remove()
    })

    it('refuses a manifest with no name or no version', () => {
      const nameless = scratchWorkspace({ 'package.json': '{ "version": "1.0.0" }' })

      expect(() => readManifest(nameless.root)).toThrow('has no name or no version')
      nameless.remove()
    })

    it('refuses a manifest whose fields have the wrong shape, naming the file and the field', () => {
      const odd = scratchWorkspace({ 'package.json': '{ "name": 5, "files": "dist" }' })

      expect(() => readManifest(odd.root)).toThrow(`${odd.path('package.json')} is not a manifest`)
      expect(() => readManifest(odd.root)).toThrow('name: ')
      expect(() => readManifest(odd.root)).toThrow('files: ')
      odd.remove()
    })
  })

  describe('workspaceManifests', () => {
    it('lists every directory under a pattern that holds a manifest', () => {
      expect(workspaceManifests(workspace.root).map((manifest) => manifest.name)).toEqual([
        '@t/a',
        '@t/b',
        '@t/c',
        '@t/p',
        'lone',
      ])
    })

    it('lists this repository, and every package in it carries a version', () => {
      const manifests = workspaceManifests(HERE)

      expect(manifests.map((manifest) => manifest.directory)).toContain(
        packageRoot(import.meta.dirname),
      )
      expect(manifests.every((manifest) => manifest.version !== '')).toBe(true)
    })
  })

  describe('dependencyManifests', () => {
    it('reads every installed dependency the root declares, whichever list names it', () => {
      expect(dependencyManifests(installs.root).map((found) => found.name)).toEqual([
        '@t/runtime',
        '@t/dev',
      ])
    })

    it('reads a package once where both lists name it', () => {
      expect(
        dependencyManifests(installs.root).filter((found) => found.name === '@t/runtime'),
      ).toHaveLength(1)
    })

    it('leaves out a name that is declared and not installed', () => {
      expect(dependencyManifests(installs.root).map((found) => found.name)).not.toContain('@t/gone')
    })

    it('carries the contributions of an installed package, which is what registers it', () => {
      const [runtime] = dependencyManifests(installs.root)

      expect(runtime?.contributions).toEqual({ theme: { name: 'kalon', title: 'Kalon' } })
      expect(runtime?.directory).toBe(installs.path('node_modules/@t/runtime'))
    })

    it('skips a dependency whose manifest this reader refuses, rather than refusing to start', () => {
      // A published package's manifest is its author's business, and a `files` written as a
      // string is not this tool's to reject: the repository still has to build.
      expect(dependencyManifests(installs.root).map((found) => found.name)).not.toContain('@t/odd')
    })

    it('answers nothing for a root that declares no dependencies at all', () => {
      expect(dependencyManifests(workspace.root)).toEqual([])
    })
  })

  describe('dependencyClosure', () => {
    it('orders dependencies before dependents and visits a package once', () => {
      const found = dependencyClosure(['@t/c', '@t/b'], workspaceManifests(workspace.root))

      expect(found.missing).toEqual([])
      expect(found.ordered.map((manifest) => manifest.name)).toEqual([
        '@t/a',
        '@t/b',
        '@t/p',
        '@t/c',
      ])
    })

    it('names a root the workspace does not have and carries on with the rest', () => {
      const found = dependencyClosure(['@t/umbrella', 'lone'], workspaceManifests(workspace.root))

      expect(found.missing).toEqual(['@t/umbrella'])
      expect(found.ordered.map((manifest) => manifest.name)).toEqual(['lone'])
    })
  })
})
