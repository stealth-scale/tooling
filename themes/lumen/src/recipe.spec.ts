import { describe, expect, it } from 'vite-plus/test'

import { DEFAULT_TABLES, emitTheme, resolveRecipe } from '@stealthscale/core-theme'

import { recipe } from './recipe.ts'

describe('the Lumen recipe', () => {
  it('builds a palette with every token set in both modes, and clears every guarantee', () => {
    expect(() => emitTheme(recipe, 'lumen')).not.toThrow()
  })

  it('states the brand violet twice, as a tone and as a value the palette may not move', () => {
    expect(recipe.color.primary, 'the tone every other token derives from').toBe('#7c3aed')
    expect(recipe.color.stated?.light?.primary, 'and the fill itself').toBe('#7c3aed')
    expect(recipe.color.stated?.dark?.primary).toBe('#7c3aed')
  })

  it('ships the stated violet unmoved, and keeps everything around it derived', () => {
    const emitted = emitTheme(recipe, 'lumen')
    const solved = emitTheme({ ...recipe, color: { ...recipe.color, stated: {} } }, 'lumen')

    expect(emitted.values.light['primary'], 'the value the brand owns').toBe('#7c3aed')
    expect(
      emitted.values.light['primary-foreground'],
      'the label on it is still solved against the fill',
    ).toBe(solved.values.light['primary-foreground'])
    expect(emitted.values.light['ring'], 'and so is the ring').toBe(solved.values.light['ring'])
  })

  it('sets prose in a serif, which is the one thing no other theme does', () => {
    const { font } = resolveRecipe(recipe)

    expect(font.sans).toContain("'Literata Variable'")
    expect(font.sans, 'a serif rather than the base’s sans').toContain('Georgia, serif')
    expect(font.display, 'and a display serif over it').toContain("'Fraunces Variable'")
    expect(font.display).not.toBe(font.sans)
    expect(font.mono).toContain("'Source Code Pro Variable'")
    expect(font.sources, 'and it loads all three').toEqual([
      '@fontsource-variable/literata/wght.css',
      '@fontsource-variable/source-code-pro/wght.css',
      '@fontsource-variable/fraunces/wght.css',
    ])
  })

  it('reads at seventeen pixels, and the whole type scale follows the one number', () => {
    const { tables } = resolveRecipe(recipe)
    const factor = 17 / 16

    expect(tables.text['base']?.size).toBeCloseTo(factor, 4)
    expect(tables.text['4xl']?.size, 'every step moves with it').toBeCloseTo(
      (DEFAULT_TABLES.text['4xl']?.size ?? 0) * factor,
      4,
    )
  })

  it('lifts a card further off the page than the base, which is what editorial depth is', () => {
    const { tables } = resolveRecipe(recipe)

    expect(recipe.effect?.depth).toBe(1.5)
    expect(tables.shadow['md']?.[0]?.fraction).toBe(
      Math.round((DEFAULT_TABLES.shadow['md']?.[0]?.fraction ?? 0) * 1.5),
    )
  })
})
