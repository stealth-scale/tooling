import { describe, expect, it } from 'vite-plus/test'

import { emitTheme, resolveRecipe } from '@stealthscale/core-theme'
import { recipe as base } from '@stealthscale/theme-base'

import { recipe } from './recipe.ts'

describe('the Harbor recipe', () => {
  it('builds a palette with every token set in both modes, and clears every guarantee', () => {
    expect(() => emitTheme(recipe, 'harbor')).not.toThrow()
  })

  it('states its own colour, its level, its density and its corner, and nothing else', () => {
    expect(recipe.color.primary).toBe('#0f766e')
    expect(recipe.color.contrast, 'stricter than the base').toBe('AAA')
    expect(recipe.size?.density?.default).toBe('touch')
    expect(recipe.size?.radius).toBe('1rem')
  })

  it('takes everything else from the base, so a change there reaches this theme', () => {
    expect(recipe.color.status, 'the outcome hues').toEqual(base.color.status)
    expect(recipe.motion, 'the speed and the press').toEqual(base.motion)
    expect(recipe.effect, 'the depth').toEqual(base.effect)
  })

  it('sets text and code in a grotesque and its monospace sibling', () => {
    const { font } = resolveRecipe(recipe)

    expect(font.sans).toContain("'Space Grotesk Variable'")
    expect(font.mono).toContain("'Spline Sans Mono Variable'")
    expect(font.display, 'no heading face, so a heading draws in the text family').toBe(font.sans)
    expect(font.sources, 'and it loads both').toEqual([
      '@fontsource-variable/space-grotesk/wght.css',
      '@fontsource-variable/spline-sans-mono/wght.css',
    ])
  })

  it('reads the brand teal as a hue and a chroma, and lets the solver set the lightness', () => {
    const { color, report } = resolveRecipe(recipe)

    expect(color.primary.hue, 'a teal').toBeGreaterThan(150)
    expect(color.primary.hue).toBeLessThan(200)
    expect(report[0], 'the build says what became of the hex').toContain('primary #0f766e')
  })

  it('opens every control at the enhanced target, since a hand rather than a pointer uses it', () => {
    const { tables } = resolveRecipe(recipe)
    const touch = tables.density[tables.defaultDensity]

    expect(tables.defaultDensity).toBe('touch')
    expect((touch?.control ?? 0) * 16, 'the default control, in pixels').toBeGreaterThanOrEqual(44)
  })
})
