import { describe, expect, it } from 'vite-plus/test'

import { assertComplete, assertReadable, completeTokens, isComplete } from '#assert.ts'
import { buildPalette } from '#palette.ts'
import { type Recipe } from '#recipe.ts'
import { resolveRecipe } from '#resolve.ts'
import { REQUIRED_TOKENS, type ThemeValues } from '#tokens.ts'

/**
 * States a recipe to solve a palette from, so the guarantees are measured on values a builder
 * actually produced rather than on a table written to pass.
 */
const RECIPE: Recipe = {
  color: {
    accent: 232,
    chart: [258, 190, 300, 45, 12],
    contrast: 'AA',
    neutral: 262,
    primary: 258,
  },
}

/**
 * Solves the palette a recipe builds, which is what the guarantees are measured on.
 *
 * @param {Recipe} recipe - The recipe to solve.
 * @returns {ThemeValues} Every token, in both modes.
 */
function solve(recipe: Recipe): ThemeValues {
  return buildPalette(resolveRecipe(recipe))
}

/**
 * Builds one mode with every token present, from the contract itself.
 *
 * @returns {Record<string, string>} Every required token, each set to one grey.
 */
function mode(): Record<string, string> {
  return Object.fromEntries(REQUIRED_TOKENS.map((token) => [token, 'oklch(50% 0 0)']))
}

/**
 * Builds a theme with every token present in both modes.
 *
 * @returns {ThemeValues} The theme.
 */
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

describe('assertReadable', () => {
  it('passes a palette its own builder solved, in both modes', () => {
    expect(() => {
      assertReadable(solve(RECIPE), 'AA')
    }).not.toThrow()
  })

  it('refuses a colour a theme stated that its own label cannot be read on', () => {
    const solved = solve(RECIPE)
    const stated = {
      ...solved,
      light: { ...solved.light, primary: solved.light['primary-foreground'] },
    }

    expect(() => {
      assertReadable(stated, 'AA')
    }).toThrow(/primary-foreground on primary/u)
  })

  it('holds a fill to the level the recipe asked for, and text to AAA regardless', () => {
    const solved = solve(RECIPE)

    expect(() => {
      assertReadable(solved, 'AA')
    }).not.toThrow()
    expect(() => {
      assertReadable(solved, 'AAA')
    }, 'the same fills measured against the enhanced level').toThrow(/needs 7:1/u)
  })
})
