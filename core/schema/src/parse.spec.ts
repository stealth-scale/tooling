import { describe, expect, it } from 'vite-plus/test'

import { email, minLength, object, pipe, string, transform } from './builders.ts'
import { fieldIssuesOf, InvalidValueError, matches, parse, safeParse } from './parse.ts'

const person = object({ name: pipe(string(), minLength(2)) })

describe('safeParse', () => {
  it('reports the value, with every transform in the schema run', () => {
    const trimmed = pipe(
      string(),
      transform((value) => value.trim()),
    )

    expect(safeParse(trimmed, '  Anouk  ')).toEqual({ ok: true, value: 'Anouk' })
  })

  it('reports every issue with its code, its scalars and its path', () => {
    expect(safeParse(person, { name: 'A' })).toEqual({
      issues: [
        {
          code: 'min_length',
          params: { expected: '>=2', received: '1', requirement: 2 },
          path: 'name',
          reason: 'Invalid length: Expected >=2 but received 1',
        },
      ],
      ok: false,
    })
  })

  it('gives the root an empty path', () => {
    const result = safeParse(string(), 42)

    expect(result.ok).toBe(false)
    expect(result.ok ? [] : result.issues).toMatchObject([
      { code: 'string', params: { expected: 'string', received: '42' }, path: '' },
    ])
  })

  it('leaves out an expectation the rule does not state and a requirement that is not a scalar', () => {
    const result = safeParse(pipe(string(), email()), 'nope')

    expect(result.ok ? [] : result.issues.map((issue) => issue.params)).toEqual([
      { received: '"nope"' },
    ])
  })
})

describe('fieldIssuesOf', () => {
  it('keeps a boolean or a string requirement, which a catalogue can interpolate', () => {
    const issue = {
      expected: null,
      input: 'x',
      kind: 'validation' as const,
      message: 'refused',
      received: '"x"',
      type: 'flag',
    }

    expect(fieldIssuesOf([{ ...issue, requirement: true }])[0]?.params).toEqual({
      received: '"x"',
      requirement: true,
    })
    expect(fieldIssuesOf([{ ...issue, requirement: 'on' }])[0]?.params).toEqual({
      received: '"x"',
      requirement: 'on',
    })
  })
})

describe('parse', () => {
  it('returns the value when the schema accepts it', () => {
    expect(parse(person, { name: 'Anouk' })).toEqual({ name: 'Anouk' })
  })

  it('throws an InvalidValueError that carries every issue and names the failing path', () => {
    let thrown: unknown

    try {
      parse(person, { name: 'A' })
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(InvalidValueError)
    expect(thrown).toBeInstanceOf(Error)
    const refusal = thrown as InvalidValueError
    expect(refusal.name).toBe('InvalidValueError')
    expect(refusal.issues.map((issue) => issue.code)).toEqual(['min_length'])
    expect(refusal.message).toContain('name')
  })
})

describe('matches', () => {
  it('is true when the schema accepts the value, and narrows it', () => {
    const value: unknown = { name: 'Anouk' }

    expect(matches(person, value)).toBe(true)
    if (matches(person, value)) expect(value.name).toBe('Anouk')
  })

  it('is false when the schema refuses the value', () => {
    expect(matches(person, { name: 'A' })).toBe(false)
  })
})
