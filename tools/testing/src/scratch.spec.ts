import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vite-plus/test'

import { scratchWorkspace, withScratchWorkspace, withScratchWorkspaceAsync } from './scratch.ts'

describe('scratchWorkspace', () => {
  it('creates a directory of its own under the temporary directory', () => {
    const workspace = scratchWorkspace()

    expect(workspace.root.startsWith(tmpdir())).toBe(true)
    expect(existsSync(workspace.root)).toBe(true)
    expect(workspace.files()).toEqual([])
    workspace.remove()
  })

  it('writes the files it is given, creating their directories', () => {
    const workspace = scratchWorkspace({
      'packages/leaf/src/index.ts': 'export {}\n',
      'README.md': '# root\n',
    })

    expect(workspace.read('packages/leaf/src/index.ts')).toBe('export {}\n')
    expect(workspace.files()).toEqual(['README.md', 'packages/leaf/src/index.ts'])
    workspace.remove()
  })

  it('overwrites a file on a second write and lists every file sorted', () => {
    const workspace = scratchWorkspace({ 'a/c.txt': 'two', 'b.txt': 'one' })

    workspace.write({ 'a/a.txt': 'four', 'b.txt': 'three' })

    expect(workspace.read('b.txt')).toBe('three')
    expect(workspace.files()).toEqual(['a/a.txt', 'a/c.txt', 'b.txt'])
    workspace.remove()
  })

  it('resolves a relative path inside the root, and refuses one that leaves it', () => {
    const workspace = scratchWorkspace()

    expect(workspace.path('a/b.txt')).toBe(`${workspace.root}/a/b.txt`)
    expect(workspace.path('.')).toBe(workspace.root)
    expect(() => workspace.path('../outside.txt')).toThrow('leaves the scratch workspace')
    expect(() => {
      workspace.write({ '../outside.txt': '' })
    }).toThrow('leaves the scratch workspace')
    workspace.remove()
  })

  it('throws when a file to read is missing', () => {
    const workspace = scratchWorkspace()

    expect(() => workspace.read('missing.txt')).toThrow()
    workspace.remove()
  })

  it('removes the directory, and does nothing on a second call', () => {
    const workspace = scratchWorkspace({ 'a.txt': '' })

    workspace.remove()
    expect(existsSync(workspace.root)).toBe(false)
    expect(() => {
      workspace.remove()
    }).not.toThrow()
  })
})

describe('withScratchWorkspace', () => {
  it('runs the function against the workspace, returns its result and removes the directory', () => {
    let root = ''

    const files = withScratchWorkspace({ 'a.txt': '' }, (workspace) => {
      root = workspace.root
      return workspace.files()
    })

    expect(files).toEqual(['a.txt'])
    expect(existsSync(root)).toBe(false)
  })

  it('removes the directory when the function throws', () => {
    let root = ''

    expect(() =>
      withScratchWorkspace({}, (workspace) => {
        root = workspace.root
        throw new Error('refused')
      }),
    ).toThrow('refused')
    expect(existsSync(root)).toBe(false)
  })
})

describe('withScratchWorkspaceAsync', () => {
  it('awaits the function, resolves to its result and removes the directory', async () => {
    let root = ''

    const files = await withScratchWorkspaceAsync({ 'a.txt': '' }, async (workspace) => {
      root = workspace.root
      await Promise.resolve()
      return workspace.files()
    })

    expect(files).toEqual(['a.txt'])
    expect(existsSync(root)).toBe(false)
  })

  it('removes the directory when the function rejects', async () => {
    let root = ''

    await expect(
      withScratchWorkspaceAsync({}, async (workspace) => {
        root = workspace.root
        await Promise.resolve()
        throw new Error('refused')
      }),
    ).rejects.toThrow('refused')
    expect(existsSync(root)).toBe(false)
  })
})
