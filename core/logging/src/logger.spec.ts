import { describe, expect, it } from 'vite-plus/test'

import { atLeast, LEVELS, type Logger, SILENT } from './logger.ts'

describe('LEVELS', () => {
  it('runs from the most detailed to the most serious', () => {
    expect(LEVELS).toEqual(['trace', 'debug', 'info', 'warn', 'error'])
  })

  it('names the five pino and the console share, so binding either needs no adapter', () => {
    for (const level of LEVELS) {
      expect(typeof console[level], level).toBe('function')
    }
  })
})

describe('atLeast', () => {
  it('keeps a record as serious as the threshold', () => {
    expect(atLeast('info', 'info')).toBe(true)
    expect(atLeast('error', 'info')).toBe(true)
  })

  it('drops a record below the threshold', () => {
    expect(atLeast('debug', 'info')).toBe(false)
    expect(atLeast('trace', 'error')).toBe(false)
  })

  it('keeps everything at the most detailed threshold', () => {
    for (const level of LEVELS) {
      expect(atLeast(level, 'trace'), level).toBe(true)
    }
  })
})

describe('SILENT', () => {
  it('writes nothing at any level, so a library needs no guard against an absent logger', () => {
    for (const level of LEVELS) {
      expect(() => {
        SILENT[level]('anything', { a: 1 })
      }, level).not.toThrow()
    }
  })

  it('is its own child, because it holds no fields to add to', () => {
    expect(SILENT.child({ package: 'core-env' })).toBe(SILENT)
  })

  it('satisfies the contract a library takes', () => {
    const logger: Logger = SILENT

    expect(typeof logger.child).toBe('function')
  })
})
