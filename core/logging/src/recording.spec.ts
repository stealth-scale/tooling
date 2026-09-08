import { describe, expect, it } from 'vite-plus/test'

import { LEVELS } from './logger.ts'
import { recordingLogger } from './recording.ts'

describe('recordingLogger', () => {
  it('keeps what it was told, in the order it was told', () => {
    const logger = recordingLogger()

    logger.info('opened the database')
    logger.warn('held a version back', { version: '1.2.3' })

    expect(logger.records).toEqual([
      { fields: {}, level: 'info', message: 'opened the database' },
      { fields: { version: '1.2.3' }, level: 'warn', message: 'held a version back' },
    ])
  })

  it('writes at every level the contract names', () => {
    const logger = recordingLogger()

    for (const level of LEVELS) logger[level](level)

    expect(logger.records.map((record) => record.level)).toEqual([...LEVELS])
  })

  it('drops a record below the threshold, and keeps one at it', () => {
    const logger = recordingLogger('warn')

    logger.debug('not kept')
    logger.info('not kept either')
    logger.warn('kept')
    logger.error('kept')

    expect(logger.records.map((record) => record.message)).toEqual(['kept', 'kept'])
  })

  it('adds a child fields to every record it writes', () => {
    const logger = recordingLogger()

    logger.child({ package: 'core-env' }).info('read the environment')

    expect(logger.records[0]?.fields).toEqual({ package: 'core-env' })
  })

  it("lets a record's own field win over one the child set", () => {
    const logger = recordingLogger()

    logger.child({ step: 'parent' }).info('wrote', { step: 'record' })

    expect(logger.records[0]?.fields).toEqual({ step: 'record' })
  })

  it('nests, so a child of a child carries both sets of fields', () => {
    const logger = recordingLogger()

    logger.child({ package: 'core-env' }).child({ request: 'abc' }).info('read')

    expect(logger.records[0]?.fields).toEqual({ package: 'core-env', request: 'abc' })
  })

  it('leaves the parent unchanged when a child adds fields', () => {
    const logger = recordingLogger()

    logger.child({ package: 'core-env' })
    logger.info('from the parent')

    expect(logger.records[0]?.fields, 'the child added nothing here').toEqual({})
  })

  it('writes a child records into the same list, so one assertion sees everything', () => {
    const logger = recordingLogger()

    logger.info('from the parent')
    logger.child({ package: 'core-env' }).info('from the child')

    expect(logger.records).toHaveLength(2)
  })

  it('gives the records at one level, for a specification that cares about only those', () => {
    const logger = recordingLogger()

    logger.info('one')
    logger.warn('two')
    logger.info('three')

    expect(logger.at('info').map((record) => record.message)).toEqual(['one', 'three'])
    expect(logger.at('error')).toEqual([])
  })
})
