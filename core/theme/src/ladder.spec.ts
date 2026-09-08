import { describe, expect, it } from 'vite-plus/test'

import { DARK, DARK_FILLS, fillsFor, ladderFor, LIGHT, LIGHT_FILLS, RATIOS } from '#ladder.ts'

describe('the ladders', () => {
  it('climb away from the page in each mode, so card, popover and muted each step off it', () => {
    expect(LIGHT.card).toBeGreaterThan(LIGHT.page)
    expect(LIGHT.muted).toBeLessThan(LIGHT.page)
    expect(LIGHT.input).toBeLessThan(LIGHT.border)
    expect(DARK.card).toBeGreaterThan(DARK.page)
    expect(DARK.popover).toBeGreaterThan(DARK.card)
    expect(DARK.muted).toBeGreaterThan(DARK.popover)
    expect(DARK.input).toBeGreaterThan(DARK.border)
  })

  it('put text on the far side of the page from the surfaces', () => {
    expect(LIGHT.text).toBeLessThan(LIGHT.muted)
    expect(DARK.text).toBeGreaterThan(DARK.muted)
  })

  it('give the dark scrim and shadow more opacity, where a dark page swallows both', () => {
    expect(DARK.overlayAlpha).toBeGreaterThan(LIGHT.overlayAlpha)
    expect(DARK.shadowAlpha).toBeGreaterThan(LIGHT.shadowAlpha)
    expect(LIGHT.shadowHighlightAlpha, 'a shadow does the work in light').toBe(0)
    expect(DARK.shadowHighlightAlpha).toBeGreaterThan(0)
  })

  it('are picked by mode', () => {
    expect(ladderFor('light')).toBe(LIGHT)
    expect(ladderFor('dark')).toBe(DARK)
  })
})

describe('the fills', () => {
  it('start brighter at AA than at AAA in light, where the walk only darkens', () => {
    expect(LIGHT_FILLS.AA.key).toBeGreaterThan(LIGHT_FILLS.AAA.key)
  })

  it('carry white text at AA in dark and near-black at AAA', () => {
    expect(DARK_FILLS.AA.keyText).toBeGreaterThan(90)
    expect(DARK_FILLS.AAA.keyText).toBeLessThan(20)
  })

  it('keep warning a light fill with a dark label at every level, in both modes', () => {
    for (const fills of [LIGHT_FILLS.AA, LIGHT_FILLS.AAA, DARK_FILLS.AA, DARK_FILLS.AAA]) {
      expect(fills.status.warning).toBeGreaterThan(80)
      expect(fills.statusText.warning).toBeLessThan(20)
    }
  })

  it('start info where destructive starts, since both carry the same label', () => {
    for (const fills of [LIGHT_FILLS.AA, LIGHT_FILLS.AAA, DARK_FILLS.AA, DARK_FILLS.AAA]) {
      expect(fills.statusText.info).toBe(fills.statusText.destructive)
    }
  })

  it('are picked by mode and level, and the floors are the ones WCAG writes', () => {
    expect(fillsFor('dark', 'AA')).toBe(DARK_FILLS.AA)
    expect(fillsFor('light', 'AAA')).toBe(LIGHT_FILLS.AAA)
    expect(RATIOS).toEqual({ AA: 4.5, AAA: 7, UI: 3 })
  })
})
