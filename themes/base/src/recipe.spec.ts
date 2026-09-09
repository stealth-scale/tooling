import { describe, expect, it } from 'vite-plus/test'

import { DEFAULT_TABLES, emitTheme, LIGHT, resolveRecipe } from '@stealthscale/core-theme'

import { recipe } from './recipe.ts'

describe('the base recipe', () => {
  it('builds a palette with every token set in both modes, and clears every guarantee', () => {
    expect(() => emitTheme(recipe, 'base')).not.toThrow()
  })

  it('states every group, since a theme is written by reading this one', () => {
    expect(
      Object.keys(recipe).toSorted((one, other) => one.localeCompare(other)),
      'a group left out is a group the next theme author never learns about',
    ).toEqual(['color', 'effect', 'font', 'motion', 'size'])
  })

  it('states each colour as a hue with its own tint, so no tint applies to everything', () => {
    const { color } = resolveRecipe(recipe)

    expect(color.primary.chroma, "livelier than a tone's own 0.17").toBeGreaterThan(0.17)
    expect(color.surface.chroma, 'the surfaces are tinted less than the greys').toBeLessThan(
      color.neutral.chroma,
    )
    expect(color.accent.chroma, 'and the accent more').toBeGreaterThan(color.neutral.chroma)
  })

  it('spreads its chart hues far enough apart to tell one series from another', () => {
    const sorted = [...resolveRecipe(recipe).color.chart].toSorted((one, other) => one - other)
    const gaps = sorted.slice(1).map((hue, index) => hue - (sorted[index] ?? 0))

    expect(Math.min(...gaps), 'the closest two series').toBeGreaterThan(30)
  })

  it('carries a saturated primary at AA, so white text reads on the fill in both modes', () => {
    expect(recipe.color.contrast).toBe('AA')
  })

  it('takes the ladder’s own page rather than a whiter one, or it draws white on white', () => {
    expect(recipe.color.light?.page, 'pinned at 99 nothing tells a card from the page').toBe(
      LIGHT.page,
    )
  })

  it('loads the files of both families it names, so a consumer gets the faces', () => {
    const { font } = resolveRecipe(recipe)

    expect(font.sources).toHaveLength(2)
    expect(font.sources.every((source) => source.startsWith('@fontsource-variable/'))).toBe(true)
    expect(font.display, 'no heading face, so a heading draws in the text family').toBe(font.sans)
  })

  it('states the contract’s own depth and speed, which another theme moves from here', () => {
    const { tables } = resolveRecipe(recipe)

    expect(recipe.effect?.depth).toBe(1)
    expect(recipe.motion?.speed).toBe(1)
    expect(tables.duration['normal'], 'so the timing is the contract’s').toBe(
      DEFAULT_TABLES.duration['normal'],
    )
  })
})
