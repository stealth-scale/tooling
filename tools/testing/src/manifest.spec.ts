import { describe, expect, it } from 'vite-plus/test'

import { manifest, packageFiles, workspaceFiles } from './manifest.ts'
import { withScratchWorkspace } from './scratch.ts'

describe('manifest', () => {
  it('writes the fields as a package manager would, with a version by default', () => {
    expect(manifest({ name: '@acme/leaf' })).toBe(
      '{\n  "version": "0.0.0",\n  "name": "@acme/leaf"\n}\n',
    )
  })

  it('keeps a version the fields give', () => {
    expect(JSON.parse(manifest({ name: '@acme/leaf', version: '1.2.3' }))).toEqual({
      name: '@acme/leaf',
      version: '1.2.3',
    })
  })
})

describe('packageFiles', () => {
  it('puts the manifest and every other file under the directory', () => {
    const files = packageFiles(
      'packages/leaf',
      { name: '@acme/leaf' },
      { 'README.md': '# leaf\n', 'src/index.ts': 'export {}\n' },
    )

    expect(Object.keys(files)).toEqual([
      'packages/leaf/package.json',
      'packages/leaf/README.md',
      'packages/leaf/src/index.ts',
    ])
    expect(JSON.parse(files['packages/leaf/package.json'] ?? '')).toEqual({
      name: '@acme/leaf',
      version: '0.0.0',
    })
  })

  it('composes with the root into one scratch workspace', () => {
    const files = withScratchWorkspace(
      {
        ...workspaceFiles(['packages/*']),
        ...packageFiles('packages/leaf', { name: '@acme/leaf' }),
      },
      (workspace) => workspace.files(),
    )

    expect(files).toEqual(['package.json', 'packages/leaf/package.json'])
  })
})

describe('workspaceFiles', () => {
  it('writes a private root named root with the globs given', () => {
    expect(JSON.parse(workspaceFiles(['core/*', 'tools/*'])['package.json'] ?? '')).toEqual({
      name: 'root',
      private: true,
      version: '0.0.0',
      workspaces: ['core/*', 'tools/*'],
    })
  })

  it('takes other root fields, such as the catalog', () => {
    const root = JSON.parse(
      workspaceFiles(['core/*'], { catalog: { valibot: '^1.4.2' } })['package.json'] ?? '',
    ) as { catalog: Record<string, string> }

    expect(root.catalog).toEqual({ valibot: '^1.4.2' })
  })
})
