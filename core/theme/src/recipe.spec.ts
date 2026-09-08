import { describe, expect, it } from 'vite-plus/test'

import { safeParse } from '@stealthscale/core-schema'

import { DARK, LIGHT } from '#ladder.ts'
import {
  chromaOf,
  DEFAULT_FONTS,
  levelOf,
  pageLightness,
  type PaletteRecipe,
  recipeSchema,
  STATUS_HUES,
  statusHues,
  surfaceHue,
  surfaceTint,
  tintOf,
} from '#recipe.ts'

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
 * Holds a recipe that states only what it must.
 */
const bare: PaletteRecipe = {
  accent: 200,
  chart: [258, 152, 292, 45, 12],
  neutral: 260,
  primary: 258,
}

/**
 * Holds a recipe that states everything it may.
 */
const full: PaletteRecipe = {
  ...bare,
  chroma: 0.2,
  contrast: 'AA',
  fonts: { mono: 'Mono', sans: 'Sans' },
  ink: 10,
  neutralChroma: 0.02,
  paper: 99,
  radius: '1rem',
  status: { destructive: 350, info: 210, success: 200, warning: 90 },
  surfaceChroma: 0.05,
  surfaceHue: 40,
}

describe('recipeSchema', () => {
  it('accepts a recipe that states only what it must, and one that states everything', () => {
    expect(refusals(bare)).toEqual([])
    expect(refusals(full)).toEqual([])
  })

  it('accepts a status that names some of the outcomes and leaves the rest', () => {
    expect(refusals({ ...bare, status: { warning: 90 } })).toEqual([])
  })

  it('refuses a recipe missing a hue it cannot derive, naming every one it wants', () => {
    const { chart, neutral } = bare

    expect(refusals({ chart, neutral })).toEqual([
      'accent: strict_object',
      'primary: strict_object',
    ])
  })

  it('refuses a key that is no member, which is how a typo would otherwise do nothing', () => {
    expect(refusals({ ...bare, neutralchroma: 0.02 })).toEqual(['neutralchroma: strict_object'])
    expect(refusals({ ...bare, status: { destructve: 350 } })).toEqual([
      'status.destructve: strict_object',
    ])
  })

  it('refuses a hue off the wheel and a lightness past a percentage', () => {
    expect(refusals({ ...bare, accent: 400 })).toEqual(['accent: max_value'])
    expect(refusals({ ...bare, neutral: -1 })).toEqual(['neutral: min_value'])
    expect(refusals({ ...bare, paper: 101 })).toEqual(['paper: max_value'])
    expect(refusals({ ...bare, chroma: -0.1 })).toEqual(['chroma: min_value'])
  })

  it('refuses a chart that is not five series, so a series cannot go missing in silence', () => {
    expect(refusals({ ...bare, chart: [258, 152, 292, 45] })).toEqual(['chart.4: number'])
    expect(refusals({ ...bare, chart: [258, 152, 292, 45, 12, 300] })).toEqual([
      'chart.5: strict_tuple',
    ])
    expect(refusals({ ...bare, chart: [258, 152, 292, 45, 400] })).toEqual(['chart.4: max_value'])
  })

  it('refuses a contrast level nothing solves for, and a font family that is no pair', () => {
    expect(refusals({ ...bare, contrast: 'AAAA' })).toEqual(['contrast: picklist'])
    expect(refusals({ ...bare, fonts: { sans: 'Sans' } })).toEqual(['fonts.mono: strict_object'])
  })

  it('refuses a member written as undefined rather than left out', () => {
    expect(refusals({ ...bare, radius: undefined })).toEqual(['radius: string'])
  })

  it('refuses a recipe that is not an object at all', () => {
    expect(refusals('a recipe')).toEqual([': strict_object'])
  })
})

describe('the readers', () => {
  it('answer the fixed value where a recipe says nothing', () => {
    expect(chromaOf(bare)).toBe(0.17)
    expect(tintOf(bare)).toBe(0.008)
    expect(levelOf(bare)).toBe('AAA')
    expect(surfaceHue(bare)).toBe(bare.neutral)
    expect(surfaceTint(bare)).toBeCloseTo(0.02, 5)
    expect(statusHues(bare)).toEqual(STATUS_HUES)
    expect(DEFAULT_FONTS.sans).toContain('Inter')
  })

  it('answer what a recipe states where it states it', () => {
    expect(chromaOf(full)).toBe(0.2)
    expect(tintOf(full)).toBe(0.02)
    expect(levelOf(full)).toBe('AA')
    expect(surfaceHue(full)).toBe(40)
    expect(surfaceTint(full)).toBe(0.05)
    expect(statusHues(full)).toEqual(full.status)
  })

  it('tint the surfaces from the greys when no surface tint is stated', () => {
    expect(surfaceTint({ ...bare, neutralChroma: 0.02 })).toBeCloseTo(0.05, 5)
  })

  it('fill in an outcome hue a recipe leaves out', () => {
    expect(statusHues({ ...bare, status: { success: 209 } })).toEqual({
      ...STATUS_HUES,
      success: 209,
    })
  })
})

describe('pageLightness', () => {
  it('reads the ladder where a recipe names no page', () => {
    expect(pageLightness(bare, 'light')).toBe(LIGHT.page)
    expect(pageLightness(bare, 'dark')).toBe(DARK.page)
  })

  it('reads paper in light and ink in dark where a recipe names them', () => {
    expect(pageLightness(full, 'light')).toBe(99)
    expect(pageLightness(full, 'dark')).toBe(10)
  })
})
