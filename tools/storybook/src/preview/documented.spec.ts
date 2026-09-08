import { describe, expect, it } from 'vite-plus/test'

import { docgenType, documented } from './documented.ts'

/**
 * Builds a component the docgen plugin annotated, the way it hangs the record off a function.
 */
function annotated(info: unknown): () => null {
  return Object.assign((): null => null, { __docgenInfo: info })
}

describe('docgenType', () => {
  it('reads a type as react-docgen writes one', () => {
    expect(docgenType({ elements: [{ name: 'literal' }], name: 'union', raw: 'a | b' })).toEqual({
      elements: [{ name: 'literal' }],
      name: 'union',
      raw: 'a | b',
    })
  })

  it('reads nothing for a value that is no type', () => {
    expect(docgenType(null)).toBeUndefined()
    expect(docgenType({ raw: 'string' })).toBeUndefined()
    expect(docgenType('string')).toBeUndefined()
  })
})

describe('documented', () => {
  it('reads the record off a function component, which is where the plugin writes it', () => {
    const component = annotated({
      description: 'Draws it.',
      props: { size: { required: false, tsType: { name: 'string' } } },
    })

    expect(documented(component)).toEqual({
      description: 'Draws it.',
      props: { size: { required: false, tsType: { name: 'string' } } },
    })
  })

  it('reads the record off an object too, and keeps a null default as written', () => {
    expect(documented({ __docgenInfo: { props: { size: { defaultValue: null } } } })).toEqual({
      props: { size: { defaultValue: null } },
    })
  })

  it('reads nothing off a component that carries no record, or a record the schema refuses', () => {
    expect(documented()).toBeUndefined()
    expect(documented(null)).toBeUndefined()
    expect(documented('Button')).toBeUndefined()
    expect(documented({})).toBeUndefined()
    expect(documented(annotated({ props: 'none' }))).toBeUndefined()
    expect(documented(annotated({ props: { size: { required: 'yes' } } }))).toBeUndefined()
  })
})
