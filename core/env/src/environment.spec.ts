import { describe, expect, it } from 'vite-plus/test'

import { withScratchWorkspace } from '@stealthscale/tool-testing'

import { environment, MissingVariableError, read, readRequired } from './environment.ts'

describe('environment', () => {
  it('lets the machine win over every file, because a deployment is not a file', () => {
    withScratchWorkspace({ '.env': 'DATABASE_URL=from-file\nONLY_FILE=kept\n' }, (workspace) => {
      const variables = environment({
        directory: workspace.root,
        machine: { DATABASE_URL: 'from-deployment' },
      })

      expect(variables['DATABASE_URL']).toBe('from-deployment')
      expect(variables['ONLY_FILE'], 'what only a file set still arrives').toBe('kept')
    })
  })

  it('drops a machine entry that is set to nothing, so a file below it still counts', () => {
    withScratchWorkspace({ '.env': 'PORT=5432\nHOST=db\n' }, (workspace) => {
      const variables = environment({
        directory: workspace.root,
        machine: { HOST: '', PORT: undefined },
      })

      expect(variables['PORT'], 'an unset variable is not an override').toBe('5432')
      expect(variables['HOST'], 'an empty export is a name nothing filled in').toBe('db')
    })
  })

  it('layers the mode it is given on top of the shared files', () => {
    withScratchWorkspace({ '.env': 'A=base\n', '.env.test': 'A=test\n' }, (workspace) => {
      expect(environment({ directory: workspace.root, machine: {}, mode: 'test' })['A']).toBe(
        'test',
      )
    })
  })

  it('reads the process own variables when it is given no machine', () => {
    withScratchWorkspace({}, (workspace) => {
      const variables = environment({ directory: workspace.root })

      expect(Object.keys(variables).length, 'the process has some environment').toBeGreaterThan(0)
    })
  })

  it('reads the files beside the process when it is given no directory', () => {
    expect(environment({ machine: { SENTINEL: 'set' } })['SENTINEL']).toBe('set')
  })
})

describe('read', () => {
  it('gives the value that was set', () => {
    expect(read({ PORT: '5432' }, 'PORT', '5433')).toBe('5432')
  })

  it('gives the one written default where nothing set it', () => {
    expect(read({}, 'PORT', '5433'), 'absence needs no branch on an environment name').toBe('5433')
  })

  it('treats an empty value as set, because a file said so on purpose', () => {
    expect(read({ MAIL_URL: '' }, 'MAIL_URL', 'sink:')).toBe('')
  })
})

describe('readRequired', () => {
  it('gives the value that was set', () => {
    expect(readRequired({ DATABASE_URL: 'postgres://local' }, 'DATABASE_URL')).toBe(
      'postgres://local',
    )
  })

  it('raises an error naming what to set, rather than defaulting quietly', () => {
    expect(() => readRequired({}, 'DATABASE_URL')).toThrow(MissingVariableError)
    expect(() => readRequired({}, 'DATABASE_URL')).toThrow('DATABASE_URL is not set')
  })

  it('carries the variable name on the error, so a caller can report it', () => {
    try {
      readRequired({}, 'AUTH_BASE_URL')
      expect.unreachable('readRequired must throw on a variable nothing set')
    } catch (error) {
      expect(error).toBeInstanceOf(MissingVariableError)
      expect((error as MissingVariableError).variable).toBe('AUTH_BASE_URL')
      expect((error as MissingVariableError).name).toBe('MissingVariableError')
    }
  })
})
