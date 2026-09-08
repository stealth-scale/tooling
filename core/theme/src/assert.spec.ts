import { describe, expect, it } from 'vite-plus/test'

import { assertComplete, completeTokens, isComplete } from '#assert.ts'
import { REQUIRED_TOKENS, type ThemeValues } from '#tokens.ts'

/** One mode with every token present, built from the contract itself. */
function mode(): Record<string, string> {
  return Object.fromEntries(REQUIRED_TOKENS.map((token) => [token, 'oklch(50% 0 0)']))
}

/** A theme with every token present in both modes. */
function complete(): ThemeValues {
  return { dark: completeTokens(mode()), light: completeTokens(mode()) }
}

describe('isComplete', () => {
  it('answers yes when every token has a value', () => {
    expect(isComplete(mode())).toBe(true)
  })

  it('answers no when a token is missing or empty', () => {
    const { background, ...rest } = mode()

    expect(isComplete(rest)).toBe(false)
    expect(isComplete({ ...rest, background: '' })).toBe(false)
    expect(background).toBe('oklch(50% 0 0)')
  })
})

describe('completeTokens', () => {
  it('narrows a complete mode to the record and hands the same values back', () => {
    const values = mode()

    expect(completeTokens(values)).toBe(values)
  })

  it('names every token a mode left out, in the order they are emitted', () => {
    const { background, radius, ...rest } = mode()

    expect(() => completeTokens(rest)).toThrow('missing 2 token(s): background, radius')
    expect([background, radius]).toEqual(['oklch(50% 0 0)', 'oklch(50% 0 0)'])
  })
})

describe('assertComplete', () => {
  it('accepts a theme that defines every token in both modes', () => {
    expect(() => {
      assertComplete(complete())
    }).not.toThrow()
  })

  it('names the tokens a theme left out as mode.token, so the fix is the error message', () => {
    const values = complete()
    values.dark.background = ''

    expect(() => {
      assertComplete(values)
    }).toThrow(/missing 1 token\(s\): dark\.background$/u)
  })
})
