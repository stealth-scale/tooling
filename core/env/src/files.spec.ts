import { join } from 'node:path'
import { describe, expect, it } from 'vite-plus/test'

import { withScratchWorkspace } from '@stealthscale/tool-testing'

import { envFiles, onlyDefined, readEnvFile, readEnvFiles } from './files.ts'

describe('envFiles', () => {
  it('reads only the shared files when there is no mode', () => {
    expect(envFiles()).toEqual(['.env', '.env.local'])
  })

  it("puts a mode's files after the shared ones, so the mode wins", () => {
    expect(envFiles('test')).toEqual(['.env', '.env.local', '.env.test', '.env.test.local'])
  })

  it('puts every local file after the file it localises', () => {
    const order = envFiles('production')

    expect(order.indexOf('.env.local')).toBeGreaterThan(order.indexOf('.env'))
    expect(order.indexOf('.env.production.local')).toBeGreaterThan(order.indexOf('.env.production'))
  })
})

describe('onlyDefined', () => {
  it('drops what nothing set, so a name is either present with a value or absent', () => {
    expect(onlyDefined({ PORT: '5432', UNSET: undefined })).toEqual({ PORT: '5432' })
  })

  it('keeps an empty value, which a file set on purpose', () => {
    expect(onlyDefined({ MAIL_URL: '' })).toEqual({ MAIL_URL: '' })
  })
})

describe('readEnvFile', () => {
  it('reads what a file declares', () => {
    withScratchWorkspace({ '.env': 'DATABASE_URL=postgres://local\nPORT=5432\n' }, (workspace) => {
      expect(readEnvFile(workspace.path('.env'))).toEqual({
        DATABASE_URL: 'postgres://local',
        PORT: '5432',
      })
    })
  })

  it('treats a file that is not there as declaring nothing', () => {
    withScratchWorkspace({}, (workspace) => {
      expect(readEnvFile(workspace.path('.env'))).toEqual({})
    })
  })

  it('raises rather than hiding a file it cannot read', () => {
    withScratchWorkspace({ 'dir/keep.txt': '' }, (workspace) => {
      expect(
        () => readEnvFile(workspace.path('dir')),
        'a directory is a fault, not a missing value',
      ).toThrow()
    })
  })

  it('takes the format Node parses: quotes, comments and an equals in the value', () => {
    withScratchWorkspace(
      { '.env': '# a comment\nQUOTED="two words"\nURL=postgres://user:pw@host/db?a=b\nEMPTY=\n' },
      (workspace) => {
        expect(readEnvFile(workspace.path('.env'))).toEqual({
          EMPTY: '',
          QUOTED: 'two words',
          URL: 'postgres://user:pw@host/db?a=b',
        })
      },
    )
  })
})

describe('readEnvFiles', () => {
  it('layers the files so a later one wins, and keeps what only an earlier one set', () => {
    withScratchWorkspace(
      {
        '.env': 'SHARED=base\nONLY_BASE=kept\n',
        '.env.local': 'SHARED=local\n',
        '.env.test': 'SHARED=test\nMODE_ONLY=test\n',
      },
      (workspace) => {
        expect(readEnvFiles(workspace.root, 'test'), 'the mode file is read last').toEqual({
          MODE_ONLY: 'test',
          ONLY_BASE: 'kept',
          SHARED: 'test',
        })
      },
    )
  })

  it("ignores a mode's files when no mode is given", () => {
    withScratchWorkspace({ '.env': 'A=base\n', '.env.test': 'A=test\n' }, (workspace) => {
      expect(readEnvFiles(workspace.root)).toEqual({ A: 'base' })
    })
  })

  it('reads a directory holding none of the files as declaring nothing', () => {
    withScratchWorkspace({}, (workspace) => {
      expect(readEnvFiles(workspace.root, 'test')).toEqual({})
    })
  })

  it('reads the files from the directory it is given, not the working directory', () => {
    withScratchWorkspace({ 'nested/.env': 'FROM=nested\n' }, (workspace) => {
      expect(readEnvFiles(join(workspace.root, 'nested'))).toEqual({ FROM: 'nested' })
    })
  })
})
