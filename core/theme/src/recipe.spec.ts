import { describe, expect, it } from 'vite-plus/test'

import { safeParse } from '@stealthscale/core-schema'

import { extendRecipe, type Recipe, recipeSchema } from '#recipe.ts'

/**
 * Reads the codes a recipe was refused with, so a case names the rule rather than the words.
 *
 * @param {unknown} written - The recipe as a file wrote it.
 * @returns {string[]} One code per refusal, each with the path it sits on.
 */
function refusals(written: unknown): string[] {
  const read = safeParse(recipeSchema(), written)
  return read.ok ? [] : read.failure.map((issue) => `${issue.path}: ${issue.code}`)
}

/**
 * Holds the smallest recipe there is: one colour.
 */
const bare: Recipe = { color: { primary: 258 } }

/**
 * Holds a recipe that states something in every group, in both layers.
 */
const full: Recipe = {
  color: {
    accent: '#2d8f7b',
    chart: [258, 152, 292, 45, 12],
    contrast: 'AA',
    dark: { overlayAlpha: 0.8, page: 10 },
    fills: { light: { key: 55, status: { warning: 80 } } },
    light: { cardLift: 2 },
    neutral: { chroma: 0.02, hue: 260 },
    primary: { chroma: 0.2, hue: 258 },
    stated: { light: { primary: '#2d5bd7' } },
    status: { warning: 90 },
    surface: 40,
  },
  effect: {
    blur: { md: 14 },
    depth: 1.4,
    shadow: { md: [{ fraction: 30, geometry: '0 2px 4px' }] },
  },
  font: {
    display: { family: 'Display', source: './display.css' },
    mono: { family: 'Mono' },
    sans: { fallback: 'sans-serif', family: 'Sans', source: ['./a.css', './b.css'] },
    weight: { semibold: 620 },
  },
  motion: {
    animation: { 'fade-in': 'fade-in 1s linear' },
    ease: { out: 'linear' },
    press: 0.96,
    speed: 0.8,
  },
  size: {
    density: { default: 'compact', steps: { compact: { control: 1.75, focusOffset: 0 } } },
    focus: { width: 3 },
    leading: { normal: 1.6 },
    radius: '0.625rem',
    spacing: '0.3rem',
    text: { base: '15px', steps: { sm: { lineHeight: 1.3, size: 0.9 } } },
    tracking: { tight: -0.03 },
  },
}

describe('recipeSchema', () => {
  it('accepts one colour as a whole theme, and a recipe that states everything', () => {
    expect(refusals(bare)).toEqual([])
    expect(refusals(full)).toEqual([])
  })

  it('takes a colour as a hex, a hue, or a hue with its own chroma', () => {
    expect(refusals({ color: { primary: '#2d5bd7' } })).toEqual([])
    expect(refusals({ color: { primary: 'oklch(52% 0.19 258)' } })).toEqual([])
    expect(refusals({ color: { primary: { chroma: 0.2, hue: 258 } } })).toEqual([])
  })

  it('refuses a string that names no colour, where a typo would otherwise solve as nothing', () => {
    expect(refusals({ color: { primary: '#gg5bd7' } })).toEqual(['color.primary: check'])
    expect(refusals({ color: { primary: 'periwinkleish' } })).toEqual(['color.primary: check'])
  })

  it('refuses a recipe with no colour at all, which is the one thing it cannot derive', () => {
    expect(refusals({})).toEqual(['color: strict_object'])
    expect(refusals({ color: {} })).toEqual(['color.primary: strict_object'])
  })

  it('refuses a key that is no member, which is how a typo would otherwise do nothing', () => {
    expect(refusals({ color: { primary: 258, primry: 200 } })).toEqual([
      'color.primry: strict_object',
    ])
    expect(refusals({ ...bare, sizes: {} })).toEqual(['sizes: strict_object'])
  })

  it('refuses a hue off the wheel and a ladder step below nothing', () => {
    expect(refusals({ color: { primary: 400 } })).toEqual(['color.primary: max_value'])
    expect(refusals({ color: { light: { page: -1 }, primary: 258 } })).toEqual([
      'color.light.page: min_value',
    ])
  })

  it('refuses a ladder step the ladder does not have', () => {
    expect(refusals({ color: { light: { pge: 97 }, primary: 258 } })).toEqual([
      'color.light.pge: strict_object',
    ])
  })

  it('refuses a chart that is not five series, so a series cannot go missing in silence', () => {
    expect(refusals({ color: { chart: [258, 152, 292, 45], primary: 258 } })).toEqual([
      'color.chart.4: union',
    ])
    expect(refusals({ color: { chart: [258, 152, 292, 45, 12, 300], primary: 258 } })).toEqual([
      'color.chart.5: strict_tuple',
    ])
  })

  it('refuses an animation the contract does not name, since a component reaches for the name', () => {
    expect(refusals({ ...bare, motion: { animation: { 'fade-sideways': 'x' } } })).toEqual([
      'motion.animation.fade-sideways: picklist',
    ])
    expect(refusals({ ...bare, motion: { animation: { 'fade-in': 'x' } } })).toEqual([])
  })

  it('refuses a density the contract does not name, since a page writes the attribute', () => {
    expect(refusals({ ...bare, size: { density: { default: 'roomy' } } })).toEqual([
      'size.density.default: picklist',
    ])
  })

  it('refuses a weight the contract does not name', () => {
    expect(refusals({ ...bare, font: { weight: { semibld: 620 } } })).toEqual([
      'font.weight.semibld: picklist',
    ])
  })

  it('refuses a length with no unit, which a stylesheet would read as nothing', () => {
    expect(refusals({ ...bare, size: { radius: '10' } })).toEqual(['size.radius: regex'])
    expect(refusals({ ...bare, size: { spacing: '4pt' } })).toEqual(['size.spacing: regex'])
    expect(refusals({ ...bare, size: { text: { base: '15px' } } })).toEqual([])
  })

  it('refuses a stated name that is no token, so a typo is not read as nothing', () => {
    expect(refusals({ color: { primary: 258, stated: { light: { primry: '#fff' } } } })).toEqual([
      'color.stated.light.primry: picklist',
    ])
  })

  it('refuses a contrast level nothing solves for, and a share of ink past all of it', () => {
    expect(refusals({ color: { contrast: 'AAAA', primary: 258 } })).toEqual([
      'color.contrast: picklist',
    ])
    expect(
      refusals({ ...bare, effect: { shadow: { md: [{ fraction: 140, geometry: '0 1px' }] } } }),
    ).toEqual(['effect.shadow.md.0.fraction: max_value'])
  })

  it('refuses a member written as undefined rather than left out', () => {
    expect(refusals({ ...bare, size: { radius: undefined } })).toEqual(['size.radius: string'])
  })

  it('refuses a recipe that is not an object at all', () => {
    expect(refusals('a recipe')).toEqual([': strict_object'])
  })
})

describe('extendRecipe', () => {
  it('lays one theme’s choices over another’s, group by group', () => {
    const extended = extendRecipe(full, { color: { primary: '#d9480f' } })

    expect(extended.color.primary).toBe('#d9480f')
    expect(extended.color.accent, 'what it did not name').toBe(full.color.accent)
    expect(extended.size?.radius).toBe(full.size?.radius)
  })

  it('merges a table entry by entry, so stating one step keeps the rest', () => {
    const extended = extendRecipe(full, { effect: { shadow: { lg: [] } } })

    expect(Object.keys(extended.effect?.shadow ?? {}).toSorted()).toEqual(['lg', 'md'])
    expect(extended.effect?.shadow?.['md'], 'the step it did not name').toEqual(
      full.effect?.shadow?.['md'],
    )
  })

  it('replaces a list whole, because a shadow’s layers are one composition', () => {
    const layers = [{ fraction: 10, geometry: '0 1px' }]
    const extended = extendRecipe(full, { effect: { shadow: { md: layers } } })

    expect(extended.effect?.shadow?.['md']).toEqual(layers)
  })

  it('reaches a step of a ladder without restating the other twenty-six', () => {
    const extended = extendRecipe(full, { color: { dark: { page: 8 } } })

    expect(extended.color.dark?.page).toBe(8)
    expect(extended.color.dark?.overlayAlpha, 'the step it did not name').toBe(0.8)
  })

  it('holds the result to the schema, so extending cannot make an unbuildable theme', () => {
    expect(() => extendRecipe(full, { color: { primary: 400 } })).toThrow(/color\.primary/u)
    expect(() => extendRecipe(full, { size: { radius: 'wide' } })).toThrow(
      /Extending the recipe gives no recipe/u,
    )
  })

  it('extends a theme that states nothing but its colour', () => {
    const extended = extendRecipe(bare, { motion: { speed: 2 } })

    expect(extended.color.primary).toBe(258)
    expect(extended.motion?.speed).toBe(2)
  })
})
