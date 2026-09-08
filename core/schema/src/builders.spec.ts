import { describe, expect, it } from 'vite-plus/test'

import * as builders from './builders.ts'

describe('the builders', () => {
  it('build valibot schemas, so valibot itself runs what is written here', () => {
    const schema = builders.object({ name: builders.pipe(builders.string(), builders.nonEmpty()) })

    expect(schema.kind).toBe('schema')
    expect(schema.type).toBe('object')
  })

  it('carry metadata through to a reader, which a form and a generator both use', () => {
    const schema = builders.pipe(builders.string(), builders.metadata({ label: 'name' }))

    expect(builders.getMetadata(schema)).toEqual({ label: 'name' })
  })

  it('export every builder a config, a manifest reader and a request handler need', () => {
    expect(Object.keys(builders).toSorted()).toEqual([
      'array',
      'boolean',
      'check',
      'custom',
      'email',
      'exactOptional',
      'getMetadata',
      'integer',
      'isoDate',
      'isoTimestamp',
      'literal',
      'looseObject',
      'maxLength',
      'maxValue',
      'metadata',
      'minLength',
      'minValue',
      'nonEmpty',
      'nullable',
      'number',
      'object',
      'optional',
      'picklist',
      'pipe',
      'record',
      'regex',
      'strictObject',
      'strictTuple',
      'string',
      'transform',
      'union',
      'unknown',
      'url',
      'uuid',
    ])
  })
})
