import { describe, expect, it } from 'vite-plus/test'

import { DARK, DARK_FILLS, fillsFor, ladderFor, LIGHT, LIGHT_FILLS, RATIOS } from '#ladder.ts'

describe('the ladders', () => {
  it('lift a card off the page, and a popover further still in dark', () => {
    expect(LIGHT.cardLift).toBeGreaterThan(0)
    expect(DARK.cardLift).toBeGreaterThan(0)
    expect(DARK.popoverLift).toBeGreaterThan(DARK.cardLift)
  })

  it('sit a panel the other side of the page from a card, in both modes', () => {
    expect(LIGHT.mutedLift, 'on paper a muted panel recedes while a card rises').toBeLessThan(0)
    expect(
      DARK.mutedLift,
      'on a dark page both climb, and the panel climbs further',
    ).toBeGreaterThan(DARK.cardLift)
  })

  it('state every surface as a lift, so moving the page carries all of them with it', () => {
    for (const ladder of [LIGHT, DARK]) {
      for (const lift of [
        ladder.accentLift,
        ladder.borderLift,
        ladder.cardLift,
        ladder.mutedLift,
        ladder.popoverLift,
        ladder.sidebarAccentLift,
        ladder.sidebarBorderLift,
        ladder.sidebarLift,
      ]) {
        expect(Math.abs(lift), 'a lift is a distance, not a lightness').toBeLessThan(40)
      }
    }
  })

  it('put text on the far side of the page from the panels', () => {
    expect(LIGHT.text).toBeLessThan(LIGHT.page + LIGHT.mutedLift)
    expect(DARK.text).toBeGreaterThan(DARK.page + DARK.mutedLift)
  })

  it('give the dark scrim and shadow more opacity, where a dark page swallows both', () => {
    expect(DARK.overlayAlpha).toBeGreaterThan(LIGHT.overlayAlpha)
    expect(DARK.shadowAlpha).toBeGreaterThan(LIGHT.shadowAlpha)
    expect(LIGHT.shadowHighlightAlpha, 'a shadow does the work in light').toBe(0)
    expect(DARK.shadowHighlightAlpha).toBeGreaterThan(0)
  })

  it('throw a brighter glow and lean on less glass in dark, where a page swallows both', () => {
    expect(DARK.glowAlpha).toBeGreaterThan(LIGHT.glowAlpha)
    expect(DARK.glow).toBeGreaterThan(LIGHT.glow)
    expect(DARK.glassAlpha).toBeLessThan(LIGHT.glassAlpha)
    expect(DARK.glassBorderAlpha).toBeLessThan(LIGHT.glassBorderAlpha)
  })

  it('put the gradient band where a chart series sits, well clear of both pages', () => {
    expect(LIGHT.gradient).toBeLessThan(LIGHT.page)
    expect(DARK.gradient).toBeGreaterThan(DARK.page)
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
