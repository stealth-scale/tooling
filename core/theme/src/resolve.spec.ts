import { describe, expect, it } from 'vite-plus/test'

import { DARK, DARK_FILLS, LIGHT, LIGHT_FILLS } from '#ladder.ts'
import { DEFAULT_FAMILIES, type Recipe, STATUS_HUES } from '#recipe.ts'
import { resolveRecipe } from '#resolve.ts'
import { DEFAULT_TABLES } from '#tables.ts'

/**
 * Holds the smallest recipe there is: one colour.
 */
const bare: Recipe = { color: { primary: 258 } }

describe('the colours a recipe leaves out', () => {
  const { color } = resolveRecipe(bare)

  it('takes the primary a theme states, at the chroma the role carries', () => {
    expect(color.primary).toEqual({ chroma: 0.17, hue: 258 })
  })

  it('puts the accent a neighbour along the wheel, so a hover is the same button', () => {
    expect(color.accent.hue).toBe(232)
    expect(color.accent.chroma, 'four times the greys').toBeCloseTo(0.032, 4)
  })

  it('tints the greys with the primary at a hairline chroma', () => {
    expect(color.neutral).toEqual({ chroma: 0.008, hue: 258 })
  })

  it('tints the surfaces more than the greys, or a page reads as no colour at all', () => {
    expect(color.surface.hue).toBe(color.neutral.hue)
    expect(color.surface.chroma).toBeCloseTo(0.02, 4)
  })

  it('spreads the five series evenly round the wheel from the primary', () => {
    expect(color.chart).toEqual([258, 330, 42, 114, 186])
  })

  it('takes the contract’s outcome hues, so a warning is amber in every product', () => {
    expect(color.status).toEqual(STATUS_HUES)
  })

  it('holds a fill to the enhanced level unless a theme asks for less', () => {
    expect(color.contrast).toBe('AAA')
    expect(color.fills.light).toEqual(LIGHT_FILLS.AAA)
    expect(color.fills.dark).toEqual(DARK_FILLS.AAA)
  })

  it('takes the contract’s ladders, and states no token of its own', () => {
    expect(color.ladder.light).toEqual(LIGHT)
    expect(color.ladder.dark).toEqual(DARK)
    expect(color.stated).toEqual({})
  })
})

describe('the colours a recipe states', () => {
  it('reads a written colour as its hue and chroma, and says so in the report', () => {
    const { color, report } = resolveRecipe({ color: { primary: 'oklch(52% 0.19 258)' } })

    expect(color.primary.hue).toBeCloseTo(258, 0)
    expect(color.primary.chroma).toBeCloseTo(0.19, 2)
    expect(report).toHaveLength(1)
    expect(report[0]).toContain('primary oklch(52% 0.19 258) is read as hue 258')
    expect(report[0], 'so nobody is surprised by what shipped').toContain(
      'the solver sets its lightness per mode',
    )
  })

  it('says nothing about a hue, since a hue carries no lightness to lose', () => {
    expect(resolveRecipe(bare).report).toEqual([])
    expect(resolveRecipe({ color: { primary: { chroma: 0.2, hue: 258 } } }).report).toEqual([])
  })

  it('reports every written colour, not only the primary', () => {
    const { report } = resolveRecipe({ color: { accent: '#2d8f7b', primary: '#2d5bd7' } })

    expect(report).toHaveLength(2)
    expect(report.map((line) => line.split(' ')[0])).toEqual(['primary', 'accent'])
  })

  it('takes an outcome hue a theme names and leaves the other three', () => {
    const { color } = resolveRecipe({ color: { primary: 258, status: { success: 209 } } })

    expect(color.status).toEqual({ ...STATUS_HUES, success: 209 })
  })

  it('merges a ladder step over the contract’s, and keeps the other twenty-six', () => {
    const { color } = resolveRecipe({ color: { light: { page: 99 }, primary: 258 } })

    expect(color.ladder.light.page).toBe(99)
    expect(color.ladder.light.cardLift).toBe(LIGHT.cardLift)
  })

  it('merges where a fill starts over the contract’s, per mode and per outcome', () => {
    const { color } = resolveRecipe({
      color: { fills: { light: { key: 60, status: { warning: 80 } } }, primary: 258 },
    })

    expect(color.fills.light.key).toBe(60)
    expect(color.fills.light.keyText, 'what it did not name').toBe(LIGHT_FILLS.AAA.keyText)
    expect(color.fills.light.status.warning).toBe(80)
    expect(color.fills.light.status.success).toBe(LIGHT_FILLS.AAA.status.success)
    expect(color.fills.dark, 'the mode it did not name').toEqual(DARK_FILLS.AAA)
  })

  it('carries the tokens a theme states literally', () => {
    const { color } = resolveRecipe({
      color: { primary: 258, stated: { light: { primary: '#2d5bd7' } } },
    })

    expect(color.stated.light?.primary).toBe('#2d5bd7')
  })
})

describe('the families', () => {
  it('draws in the system’s own faces for a theme that names none, and loads nothing', () => {
    const { font } = resolveRecipe(bare)

    expect(font.sans).toBe(DEFAULT_FAMILIES.sans)
    expect(font.mono).toBe(DEFAULT_FAMILIES.mono)
    expect(font.display, 'a heading takes the text family').toBe(DEFAULT_FAMILIES.sans)
    expect(font.sources).toEqual([])
  })

  it('quotes the family a theme names and keeps the role’s fallbacks behind it', () => {
    const { font } = resolveRecipe({ ...bare, font: { sans: { family: 'Inter Variable' } } })

    expect(font.sans).toBe(`'Inter Variable', ${DEFAULT_FAMILIES.sans}`)
  })

  it('takes the fallbacks a theme states instead of the role’s', () => {
    const { font } = resolveRecipe({
      ...bare,
      font: { sans: { fallback: 'Georgia, serif', family: 'Times' } },
    })

    expect(font.sans).toBe("'Times', Georgia, serif")
  })

  it('lists every file a family loads, whether one or several, each once', () => {
    const { font } = resolveRecipe({
      ...bare,
      font: {
        display: { family: 'Display', source: './a.css' },
        mono: { family: 'Mono', source: ['./b.css', './c.css'] },
        sans: { family: 'Sans', source: './a.css' },
      },
    })

    expect(font.sources, 'the shared file is loaded once').toEqual([
      './a.css',
      './b.css',
      './c.css',
    ])
  })

  it('draws a heading in the display face a theme names', () => {
    const { font } = resolveRecipe({ ...bare, font: { display: { family: 'Display' } } })

    expect(font.display).toContain("'Display'")
    expect(font.display).not.toBe(font.sans)
  })
})

describe('resolveRecipe', () => {
  it('answers the corner a theme states, and the contract’s where it states none', () => {
    expect(resolveRecipe(bare).radius).toBe('0.5rem')
    expect(resolveRecipe({ ...bare, size: { radius: '0.625rem' } }).radius).toBe('0.625rem')
  })

  it('carries the tables beside the colours, so one reading answers the whole theme', () => {
    const { tables } = resolveRecipe({ ...bare, motion: { speed: 2 } })

    expect(tables.duration['normal']).toBe((DEFAULT_TABLES.duration['normal'] ?? 0) * 2)
  })
})
