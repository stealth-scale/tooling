import { describe, expect, it } from 'vite-plus/test'

import { type Recipe } from '#recipe.ts'
import { DEFAULT_TABLES, tablesOf } from '#tables.ts'

/**
 * Holds the smallest recipe there is, which every case states its own group over.
 */
const bare: Recipe = { color: { primary: 258 } }

/**
 * Merges the tables one recipe settles.
 *
 * @param {Recipe} recipe - The recipe.
 * @returns {ReturnType<typeof tablesOf>} Every table, merged.
 */
function tables(recipe: Recipe): ReturnType<typeof tablesOf> {
  return tablesOf(recipe, recipe.font ?? {})
}

/**
 * Reads the share of ink the first layer of one step takes, failing the case where the step
 * is not there, so a measurement never passes on a missing table.
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

describe('tablesOf', () => {
  it('answers the contract’s own tables for a theme that states nothing', () => {
    expect(tables(bare)).toEqual(DEFAULT_TABLES)
  })

  it('merges a table entry by entry, so stating one step keeps every other', () => {
    const merged = tables({ ...bare, effect: { blur: { md: 14 } } })

    expect(merged.blur['md']).toBe(14)
    expect(merged.blur['sm'], 'the step it did not name').toBe(DEFAULT_TABLES.blur['sm'])
    expect(Object.keys(merged.blur)).toEqual(Object.keys(DEFAULT_TABLES.blur))
  })

  it('leaves the contract’s value where a theme wrote a member as undefined', () => {
    const merged = tables({ ...bare, effect: { blur: { md: undefined } } })

    expect(merged.blur['md']).toBe(DEFAULT_TABLES.blur['md'])
  })
})

describe('the type size', () => {
  it('scales the whole scale from the size of body text, in pixels or in rem', () => {
    const smaller = tables({ ...bare, size: { text: { base: '15px' } } })
    const base = DEFAULT_TABLES.text['base']?.size ?? 0

    expect(smaller.text['base']?.size).toBeCloseTo(base * 0.9375, 4)
    expect(smaller.text['4xl']?.size, 'every step follows').toBeCloseTo(
      (DEFAULT_TABLES.text['4xl']?.size ?? 0) * 0.9375,
      4,
    )
    expect(tables({ ...bare, size: { text: { base: '1.25rem' } } }).text['base']?.size).toBeCloseTo(
      base * 1.25,
      4,
    )
  })

  it('leaves the scale alone for a theme that names no size', () => {
    expect(tables(bare).text).toEqual(DEFAULT_TABLES.text)
  })

  it('leaves the scale alone for a length in no unit it reads, which the schema refuses first', () => {
    expect(tables({ ...bare, size: { text: { base: 'wide' } } }).text).toEqual(DEFAULT_TABLES.text)
    expect(tables({ ...bare, size: { text: { base: '2em' } } }).text).toEqual(DEFAULT_TABLES.text)
  })

  it('takes a step a theme replaces, and scales it with the rest', () => {
    const stated = tables({
      ...bare,
      size: { text: { base: '2rem', steps: { sm: { lineHeight: 1, size: 1 } } } },
    })

    expect(stated.text['sm']).toEqual({ lineHeight: 2, size: 2 })
  })
})

describe('the depth', () => {
  it('scales the share of ink every layer of every shadow takes', () => {
    const deep = tables({ ...bare, effect: { depth: 2 } })

    expect(share(deep.shadow, 'md')).toBe(share(DEFAULT_TABLES.shadow, 'md') * 2)
    expect(share(deep.dropShadow, 'sm')).toBe(share(DEFAULT_TABLES.dropShadow, 'sm') * 2)
  })

  it('never takes a layer past all of the ink', () => {
    const deepest = tables({ ...bare, effect: { depth: 10 } })

    for (const layers of Object.values(deepest.shadow)) {
      for (const layer of layers) expect(layer.fraction).toBeLessThanOrEqual(100)
    }
  })

  it('keeps a layer’s geometry, which is the shape rather than the weight', () => {
    const flat = tables({ ...bare, effect: { depth: 0.5 } })

    expect(flat.shadow['md']?.[0]?.geometry).toBe('0 4px 6px -1px')
    expect(share(flat.shadow, 'md')).toBe(share(DEFAULT_TABLES.shadow, 'md') / 2)
  })

  it('deepens a step the theme itself stated', () => {
    const stated = tables({
      ...bare,
      effect: { depth: 2, shadow: { md: [{ fraction: 20, geometry: '0 1px' }] } },
    })

    expect(stated.shadow['md']).toEqual([{ fraction: 40, geometry: '0 1px' }])
  })
})

describe('the speed', () => {
  it('scales every duration, so one factor retunes the whole vocabulary', () => {
    const quick = tables({ ...bare, motion: { speed: 0.5 } })

    expect(quick.duration['normal']).toBe((DEFAULT_TABLES.duration['normal'] ?? 0) / 2)
    expect(quick.duration['slow']).toBe(Math.round((DEFAULT_TABLES.duration['slow'] ?? 0) / 2))
  })

  it('scales a duration the theme itself stated', () => {
    const stated = tables({ ...bare, motion: { duration: { normal: 100 }, speed: 3 } })

    expect(stated.duration['normal']).toBe(300)
  })

  it('leaves the shorthands naming the duration steps, so both move together', () => {
    const quick = tables({ ...bare, motion: { speed: 0.5 } })

    expect(quick.animation['fade-in']).toContain('var(--duration-normal)')
  })

  it('takes the shorthand a theme states for an animation the contract names', () => {
    const stated = tables({ ...bare, motion: { animation: { 'zoom-in': 'zoom-in 1s linear' } } })

    expect(stated.animation['zoom-in']).toBe('zoom-in 1s linear')
    expect(stated.animation['fade-in']).toBe(DEFAULT_TABLES.animation['fade-in'])
  })
})

describe('the remaining groups', () => {
  it('takes the density a theme opens with, and any density’s own numbers', () => {
    const dense = tables({
      ...bare,
      size: { density: { default: 'compact', steps: { touch: { control: 3, focusOffset: 4 } } } },
    })

    expect(dense.defaultDensity).toBe('compact')
    expect(dense.density['touch']).toEqual({ control: 3, focusOffset: 4 })
    expect(dense.density['comfortable'], 'the one it did not name').toEqual(
      DEFAULT_TABLES.density['comfortable'],
    )
  })

  it('takes the focus width, the spacing and the press a theme states', () => {
    const stated = tables({
      ...bare,
      motion: { press: 0.9 },
      size: { focus: { width: 3 }, spacing: '0.3rem' },
    })

    expect(stated.focusWidth).toBe(3)
    expect(stated.spacing).toBe('0.3rem')
    expect(stated.press).toBe(0.9)
  })

  it('takes a weight, a leading and a tracking a theme replaces', () => {
    const stated = tables({
      ...bare,
      font: { weight: { semibold: 620 } },
      size: { leading: { normal: 1.6 }, tracking: { tight: -0.03 } },
    })

    expect(stated.fontWeight['semibold']).toBe(620)
    expect(stated.fontWeight['bold'], 'the weight it did not name').toBe(
      DEFAULT_TABLES.fontWeight['bold'],
    )
    expect(stated.leading['normal']).toBe(1.6)
    expect(stated.tracking['tight']).toBe(-0.03)
  })

  it('takes an easing and a perspective a theme replaces', () => {
    const stated = tables({
      ...bare,
      effect: { perspective: { near: 400 } },
      motion: { ease: { out: 'linear' } },
    })

    expect(stated.ease['out']).toBe('linear')
    expect(stated.perspective['near']).toBe(400)
  })

  it('takes an inset, a text shadow and a glow a theme replaces', () => {
    const layers = [{ fraction: 50, geometry: '0 2px 2px' }]
    const stated = tables({
      ...bare,
      effect: { glow: { sm: layers }, insetShadow: { xs: layers }, textShadow: { xs: layers } },
    })

    expect(stated.insetShadow['xs']).toEqual(layers)
    expect(stated.textShadow['xs']).toEqual(layers)
    expect(stated.glow['sm']).toEqual(layers)
  })
})
