import { describe, expect, it } from 'vite-plus/test'

import { DEFAULT_TABLES, emitTheme, resolveRecipe } from '@stealthscale/core-theme'
import { recipe as base } from '@stealthscale/theme-base'

import { recipe } from './recipe.ts'

/**
 * Reads the share of ink the first layer of one step takes, failing the case where the step is
 * not there, so a measurement never passes on a missing table.
 *
 * @param {Readonly<Record<string, readonly { fraction: number }[]>>} table - A shadow table.
 * @param {string} step - The step to read.
 * @returns {number} The first layer's share.
 */
function share(
  table: Readonly<Record<string, readonly { fraction: number }[]>>,
  step: string,
): number {
  const layer = table[step]?.[0]
  if (layer === undefined) throw new Error(`no layer at ${step}`)
  return layer.fraction
}

describe('the Ember recipe', () => {
  it('builds a palette with every token set in both modes, and clears every guarantee', () => {
    expect(() => emitTheme(recipe, 'ember')).not.toThrow()
  })

  it('changes something in four of the five groups, which is what a house style is', () => {
    expect(recipe.color.primary).toBe('#d9480f')
    expect(recipe.effect?.depth).toBe(0.5)
    expect(recipe.font?.sans?.family).toBe('Figtree Variable')
    expect(recipe.motion?.speed).toBe(0.8)
    expect(recipe.size?.density?.default).toBe('compact')
  })

  it('brings its own text face and keeps the base’s monospace', () => {
    const { font } = resolveRecipe(recipe)

    expect(font.sans).toContain("'Figtree Variable'")
    expect(font.mono, 'the family it did not name').toBe(resolveRecipe(base).font.mono)
    expect(font.sources, 'and it loads both').toEqual([
      '@fontsource-variable/figtree/wght.css',
      '@fontsource-variable/jetbrains-mono/wght.css',
    ])
  })

  it('draws half the base’s ink in every shadow, since a console shows many surfaces at once', () => {
    const { tables } = resolveRecipe(recipe)

    expect(share(tables.shadow, 'md')).toBe(share(DEFAULT_TABLES.shadow, 'md') / 2)
    expect(share(tables.dropShadow, 'sm'), 'every table follows the one factor').toBe(
      share(DEFAULT_TABLES.dropShadow, 'sm') / 2,
    )
  })

  it('moves a fifth quicker than the contract, and the whole vocabulary with it', () => {
    const { tables } = resolveRecipe(recipe)

    expect(tables.duration['normal']).toBe(160)
    expect(tables.duration['fast']).toBe(80)
    expect(tables.animation['fade-in'], 'a shorthand still names the step').toContain(
      'var(--duration-normal)',
    )
  })

  it('packs its controls by default, since a console is read at a desk', () => {
    expect(resolveRecipe(recipe).tables.defaultDensity).toBe('compact')
  })
})
