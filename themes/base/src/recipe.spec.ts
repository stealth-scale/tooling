import { describe, expect, it } from 'vite-plus/test'

import { emitTheme, LIGHT } from '@stealthscale/core-theme'

import { recipe } from './recipe.ts'

describe('the base recipe', () => {
  it('builds a palette with every token set in both modes', () => {
    expect(() => emitTheme(recipe, 'base')).not.toThrow()
  })

  it('states every member a recipe takes, since a theme is written by reading this one', () => {
    expect(
      Object.keys(recipe).toSorted((one, other) => one.localeCompare(other)),
      'a member left out is a member the next theme author never learns about',
    ).toEqual([
      'accent',
      'chart',
      'chroma',
      'contrast',
      'fonts',
      'ink',
      'neutral',
      'neutralChroma',
      'paper',
      'primary',
      'radius',
      'status',
      'surfaceChroma',
      'surfaceHue',
    ])
  })

  it('spreads its chart hues far enough apart to tell one series from another', () => {
    const sorted = [...recipe.chart].toSorted((one, other) => one - other)
    const gaps = sorted.slice(1).map((hue, index) => hue - (sorted[index] ?? 0))

    expect(Math.min(...gaps), 'the closest two series').toBeGreaterThan(30)
  })

  it('carries a saturated primary at AA, so white text reads on the fill in both modes', () => {
    expect(recipe.contrast).toBe('AA')
    expect(recipe.chroma, "livelier than the contract's own 0.17").toBeGreaterThan(0.17)
  })

  it('tints its surfaces less than its greys, which is what makes it the neutral one', () => {
    expect(recipe.surfaceChroma ?? 0).toBeLessThan(recipe.neutralChroma ?? 0)
  })

  it('writes the ladder’s own page rather than a whiter one, or it draws white on white', () => {
    expect(recipe.paper, 'pinned at 99 nothing tells a card from the page under it').toBe(
      LIGHT.page,
    )
  })
})
