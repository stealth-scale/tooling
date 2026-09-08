import { describe, expect, it } from 'vite-plus/test'

import { DARK, LIGHT } from '#ladder.ts'
import {
  chromaOf,
  DEFAULT_FONTS,
  levelOf,
  pageLightness,
  type PaletteRecipe,
  STATUS_HUES,
  statusHues,
  surfaceHue,
  surfaceTint,
  tintOf,
} from '#recipe.ts'

/** A recipe that states only what it must. */
const bare: PaletteRecipe = {
  accent: 200,
  chart: [258, 152, 292, 45, 12],
  neutral: 260,
  primary: 258,
}

/** A recipe that states everything it may. */
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
