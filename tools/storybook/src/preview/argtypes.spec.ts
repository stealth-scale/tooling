import { describe, expect, it } from 'vite-plus/test'

import { controlFor, extractArgTypes, sbTypeOf } from './argtypes.ts'
import { type DocgenType } from './documented.ts'

/** A union of literals, as docgen writes `'small' | 'large'`. */
const SIZES: DocgenType = {
  elements: [
    { name: 'literal', value: "'small'" },
    { name: 'literal', value: "'large'" },
  ],
  name: 'union',
  raw: "'small' | 'large'",
}

/** An optional boolean, as docgen writes `boolean | undefined`. */
const OPTIONAL_BOOLEAN: DocgenType = {
  elements: [{ name: 'boolean' }, { name: 'undefined' }],
  name: 'union',
  raw: 'boolean | undefined',
}

describe('sbTypeOf', () => {
  it('names a primitive after itself', () => {
    expect(sbTypeOf({ name: 'boolean' })).toEqual({ name: 'boolean' })
    expect(sbTypeOf({ name: 'number' })).toEqual({ name: 'number' })
    expect(sbTypeOf({ name: 'string' })).toEqual({ name: 'string' })
  })

  it('reads a union of literals as the set of choices a select offers', () => {
    expect(sbTypeOf(SIZES)).toEqual({ name: 'enum', value: ['small', 'large'] })
  })

  it('drops the absent member of an optional prop before deciding', () => {
    expect(sbTypeOf(OPTIONAL_BOOLEAN)).toEqual({ name: 'boolean' })
  })

  it('keeps a union that mixes kinds as a union, and skips a member that is no type', () => {
    const mixed: DocgenType = {
      elements: [{ name: 'string' }, { name: 'signature' }, 'odd'],
      name: 'union',
    }

    expect(sbTypeOf(mixed)).toEqual({
      name: 'union',
      value: [{ name: 'string' }, { name: 'function' }],
    })
  })

  it('reads anything callable as a function, which no control can express', () => {
    expect(sbTypeOf({ name: 'signature' })).toEqual({ name: 'function' })
  })

  it('reads anything else as the type as written, and nothing as unknown', () => {
    expect(sbTypeOf({ name: 'ReactNode', raw: 'ReactNode' })).toEqual({
      name: 'other',
      value: 'ReactNode',
    })
    expect(sbTypeOf({ name: 'Date' })).toEqual({ name: 'other', value: 'Date' })
    expect(sbTypeOf()).toEqual({ name: 'other', value: 'unknown' })
    expect(sbTypeOf({ name: 'union' })).toEqual({ name: 'union', value: [] })
  })

  it('keeps a union whose literal carries no value as a union, so no select offers a blank', () => {
    const blank: DocgenType = {
      elements: [{ name: 'literal', value: "'sm'" }, { name: 'literal' }],
      name: 'union',
    }

    expect(sbTypeOf(blank)).toEqual({
      name: 'union',
      value: [
        { name: 'other', value: 'literal' },
        { name: 'other', value: 'literal' },
      ],
    })
  })

  it('reads a union of nothing but absent members as an empty union', () => {
    const absent: DocgenType = {
      elements: [{ name: 'null' }, { name: 'undefined' }],
      name: 'union',
    }

    expect(sbTypeOf(absent)).toEqual({ name: 'union', value: [] })
  })
})

describe('controlFor', () => {
  it('types a ReactNode into a text field rather than a JSON editor', () => {
    expect(controlFor({ name: 'other', value: 'ReactNode' }, 'ReactNode | undefined')).toBe('text')
  })

  it('gives a callback no control at all, however docgen wrote it', () => {
    expect(controlFor({ name: 'function' }, '() => void')).toBe(false)
    expect(
      controlFor({ name: 'other', value: 'unknown' }, '((event: E) => void) | undefined'),
    ).toBe(false)
  })

  it('types a union into text when a string is among its members, and nothing otherwise', () => {
    expect(
      controlFor({ name: 'union', value: [{ name: 'string' }, { name: 'function' }] }, ''),
    ).toBe('text')
    expect(
      controlFor({ name: 'union', value: [{ name: 'number' }, { name: 'function' }] }, ''),
    ).toBe(false)
  })

  it('leaves the inference alone for everything else', () => {
    expect(controlFor({ name: 'boolean' }, 'boolean')).toBeUndefined()
    expect(controlFor({ name: 'other', value: 'Date' }, 'Date')).toBeUndefined()
  })
})

describe('extractArgTypes', () => {
  it('builds one row per prop, with the category and the default the docblock states', () => {
    const component = {
      __docgenInfo: {
        props: {
          size: {
            defaultValue: { value: "'small'" },
            description: 'Sets the size.\n\n@category Appearance\n@default default',
            required: false,
            tsType: SIZES,
          },
        },
      },
    }

    expect(extractArgTypes(component)).toEqual({
      size: {
        description: 'Sets the size.',
        name: 'size',
        table: {
          category: 'Appearance',
          defaultValue: { summary: 'default' },
          type: { summary: "'small' | 'large'" },
        },
        type: { name: 'enum', required: false, value: ['small', 'large'] },
      },
    })
  })

  it('falls back to the default the component writes, and marks a required prop', () => {
    const component = {
      __docgenInfo: {
        props: {
          label: { defaultValue: { value: "'Save'" }, required: true, tsType: { name: 'string' } },
          onSelect: { tsType: { name: 'signature', raw: '() => void' } },
        },
      },
    }

    const rows = extractArgTypes(component)

    expect(rows?.['label']).toMatchObject({
      description: '',
      table: { defaultValue: { summary: 'Save' }, type: { summary: 'string' } },
      type: { name: 'string', required: true },
    })
    expect(rows?.['label'], 'no control decided, so the inference stands').not.toHaveProperty(
      'control',
    )
    expect(rows?.['onSelect']).toMatchObject({ control: false, type: { name: 'function' } })
  })

  it('prints a wrapped union on one line, without a leading pipe', () => {
    const component = {
      __docgenInfo: {
        props: { tone: { tsType: { name: 'union', raw: "| 'quiet'\n  | 'loud'" } } },
      },
    }

    expect(extractArgTypes(component)?.['tone']?.table?.type).toEqual({
      summary: "'quiet' | 'loud'",
    })
  })

  it('takes back the comma and the indent a line break allowed', () => {
    const component = {
      __docgenInfo: {
        props: {
          cell: {
            tsType: {
              name: 'signature',
              raw: '(\n  row: Row,\n  column: Column,\n) => ReactNode',
              type: 'function',
            },
          },
        },
      },
    }

    expect(extractArgTypes(component)?.['cell']?.table?.type).toEqual({
      summary: '(row: Row, column: Column) => ReactNode',
    })
  })

  it('reads a prop whose type docgen left out as unknown', () => {
    const component = { __docgenInfo: { props: { odd: { tsType: null } } } }

    expect(extractArgTypes(component)?.['odd']).toMatchObject({
      table: { type: { summary: 'unknown' } },
      type: { name: 'other', required: false, value: 'unknown' },
    })
  })

  it('builds nothing for a component the docgen plugin did not annotate', () => {
    expect(extractArgTypes()).toBeNull()
    expect(extractArgTypes({})).toBeNull()
    expect(extractArgTypes({ __docgenInfo: {} })).toBeNull()
  })
})
