import { describe, expect, it } from 'vite-plus/test'

import { assertComplete } from '#assert.ts'
import { contrast } from '#color.ts'
import { fromPolar, inGamut } from '#convert.ts'
import { FILL_PAIRS, OUTLINE_PAIRS, TEXT_PAIRS } from '#guarantees.ts'
import { DARK, LIGHT, RATIOS } from '#ladder.ts'
import { buildPalette } from '#palette.ts'
import { type PaletteRecipe } from '#recipe.ts'
import { COLOR_TOKENS } from '#tokens.ts'

/**
 * Reads the lightness an `oklch()` value states.
 *
 * @param {string} value - The colour as written.
 * @returns {number} The lightness, 0 to 100.
 */
function lightness(value: string): number {
  return Number(/^oklch\(([\d.]+)%/u.exec(value)?.[1])
}

/**
 * Reads the three channels an `oklch(L% C H)` value states, with the lightness 0 to 1.
 *
 * @param {string} value - The token's value as written.
 * @returns {[number, number, number] | undefined} The channels, or `undefined` for a value
 *     that is no `oklch()`, such as `transparent`.
 */
function channels(value: string): [number, number, number] | undefined {
  const match = /^oklch\(([\d.]+)% ([\d.]+) (-?[\d.]+)/u.exec(value)
  return match === null ? undefined : [Number(match[1]) / 100, Number(match[2]), Number(match[3])]
}

/**
 * Reads the hue an `oklch(L% C H)` value states, as written, with or without an alpha.
 *
 * @param {string} value - The colour as written.
 * @returns {string} The hue as the value spells it, or an empty string for no `oklch()`.
 */
function hue(value: string): string {
  return /^oklch\([\d.]+% [\d.]+ (-?[\d.]+)/u.exec(value)?.[1] ?? ''
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
 * Lists four hues far enough apart that any lightness bug shows up in at least one.
 */
const RECIPES: readonly PaletteRecipe[] = [
  { accent: 232, chart: [258, 190, 300, 45, 12], neutral: 262, primary: 258 },
  { accent: 178, chart: [162, 196, 128, 250, 40], neutral: 168, primary: 162 },
  { accent: 322, chart: [292, 322, 258, 350, 200], neutral: 298, primary: 292 },
  { accent: 32, chart: [45, 25, 95, 200, 320], neutral: 72, primary: 45 },
]

describe('buildPalette', () => {
  const values = buildPalette(bare)

  it('produces every token the contract requires, in both modes', () => {
    expect(() => {
      assertComplete(values)
    }).not.toThrow()
  })

  it('inverts the ladder between the modes, so light text lands on a dark page', () => {
    expect(values.light.background).toContain('97.0%')
    expect(values.dark.background).toContain('13.0%')
    expect(values.light.foreground).toContain('20.0%')
    expect(values.dark.foreground).toContain('96.0%')
  })

  it('takes the outcome hues a recipe names, and the chart tones follow', () => {
    const branded = buildPalette({ ...bare, status: { destructive: 351, success: 209 } })

    expect(hue(branded.light.success)).toBe('209')
    expect(hue(branded.light.destructive)).toBe('351')
    expect(hue(branded.light['chart-positive'])).toBe('209')
    expect(hue(branded.light['chart-negative'])).toBe('351')
    expect(hue(branded.light.warning), 'not named, so the fixed amber').toBe(
      hue(values.light.warning),
    )
    expect(hue(branded.light.info), 'not named, so the fixed blue').toBe('235')
  })

  it('takes its hues from the recipe, which is what makes two themes differ', () => {
    const other = buildPalette({
      accent: 25,
      chart: [45, 25, 85, 150, 300],
      neutral: 60,
      primary: 45,
    })

    expect(values.light.primary).not.toBe(other.light.primary)
  })

  it('takes the families, the radius, the page and the tints a recipe states', () => {
    const stated = buildPalette({
      ...bare,
      chroma: 0.2,
      fonts: { mono: 'Mono', sans: 'Sans' },
      ink: 10,
      neutralChroma: 0.02,
      paper: 99,
      radius: '1rem',
      surfaceChroma: 0.05,
      surfaceHue: 40,
    })

    expect(stated.light['font-sans']).toBe('Sans')
    expect(stated.light['font-mono']).toBe('Mono')
    expect(stated.light.radius).toBe('1rem')
    expect(lightness(stated.light.background)).toBe(99)
    expect(lightness(stated.dark.background)).toBe(10)
    expect(hue(stated.light.background), 'the surfaces take their own hue').toBe('40')
    expect(hue(stated.light.border), 'the greys keep the neutral').toBe('260')
  })

  it('keeps the glass on the card, and the card no lighter than white, whatever the page', () => {
    const stated = buildPalette({ ...bare, ink: 10, paper: 99 })

    for (const mode of ['dark', 'light'] as const) {
      expect(lightness(stated[mode].glass), `${mode} glass`).toBe(lightness(stated[mode].card))
    }
    expect(lightness(stated.light.card), 'three steps above 99 stops at white').toBe(100)
    expect(lightness(stated.light.popover)).toBe(100)
    expect(lightness(stated.dark.card), 'four steps above the ink').toBe(14)
  })

  it('puts the three gradient stops at one lightness, from the primary to the accent', () => {
    const stops = ['gradient-1', 'gradient-2', 'gradient-3'] as const
    const lightnesses = stops.map((stop) => lightness(values.light[stop]))

    expect(new Set(lightnesses).size, 'one lightness, or the band is a fade').toBe(1)
    expect(hue(values.light['gradient-1']), 'the primary').toBe('258')
    expect(hue(values.light['gradient-2']), 'halfway between').toBe('229')
    expect(hue(values.light['gradient-3']), 'the accent').toBe('200')
  })

  it('walks the gradient the short way round the wheel', () => {
    const across = buildPalette({ ...bare, accent: 350, primary: 10 })

    expect(hue(across.light['gradient-2']), 'ten degrees back from 10, not 180 on').toBe('0')
  })

  it('gives the glass, its border and the glow the alpha their mode names', () => {
    expect(values.light.glass).toMatch(new RegExp(`/ ${LIGHT.glassAlpha.toFixed(2)}\\)$`, 'u'))
    expect(values.dark.glass).toMatch(new RegExp(`/ ${DARK.glassAlpha.toFixed(2)}\\)$`, 'u'))
    expect(values.light['glass-border']).toContain(`/ ${LIGHT.glassBorderAlpha.toFixed(2)})`)
    expect(values.dark['glass-border']).toContain(`/ ${DARK.glassBorderAlpha.toFixed(2)})`)
    expect(values.light.glow).toContain(`/ ${LIGHT.glowAlpha.toFixed(2)})`)
    expect(values.dark.glow).toContain(`/ ${DARK.glowAlpha.toFixed(2)})`)
    expect(hue(values.light.glow), 'thrown in the primary').toBe('258')
  })

  it('gives the scrim its opacity, so a dialog on a dark page still has one', () => {
    expect(values.light.overlay).toMatch(/\/ 0\.50\)$/u)
    expect(values.dark.overlay).toMatch(/\/ 0\.70\)$/u)
  })

  it('lays a hairline of light along a raised edge in dark, and nothing in light', () => {
    expect(values.light['shadow-highlight']).toBe('transparent')
    expect(values.dark['shadow-highlight']).toMatch(/^oklch\(98\.0%/u)
    expect(values.dark.shadow, "the ink carries the largest step's opacity").toMatch(/\/ 0\.60\)$/u)
  })
})

describe('a generated palette', () => {
  it.each(RECIPES)('writes every colour inside the sRGB gamut ($primary)', (recipe) => {
    const palette = buildPalette(recipe)

    for (const mode of ['dark', 'light'] as const) {
      for (const token of COLOR_TOKENS) {
        const written = channels(palette[mode][token])
        if (written === undefined) {
          expect(palette[mode][token], `${mode} ${token}`).toBe('transparent')
          continue
        }
        expect(inGamut(fromPolar(...written)), `${mode} ${token}: ${palette[mode][token]}`).toBe(
          true,
        )
      }
    }
  })

  it.each(RECIPES)('clears AAA on every text pair, in both modes (primary $primary)', (recipe) => {
    const palette = buildPalette(recipe)

    for (const mode of ['dark', 'light'] as const) {
      for (const [fill, text] of TEXT_PAIRS) {
        const ratio = contrast(palette[mode][text], palette[mode][fill])

        expect(`${mode} ${fill}/${text}: ${ratio.toFixed(2)}`).toBe(
          `${mode} ${fill}/${text}: ${Math.max(ratio, 7).toFixed(2)}`,
        )
      }
    }
  })

  it.each(RECIPES)(
    "clears 3:1 on a field's outline and each focus ring, as WCAG 1.4.11 asks ($primary)",
    (recipe) => {
      const palette = buildPalette(recipe)

      for (const mode of ['dark', 'light'] as const) {
        for (const [on, edge] of OUTLINE_PAIRS) {
          expect(
            contrast(palette[mode][edge], palette[mode][on]),
            `${mode} ${edge} on ${on}`,
          ).toBeGreaterThanOrEqual(RATIOS.UI)
        }
      }
    },
  )
})

describe('a palette at AA', () => {
  const palette = buildPalette({ ...bare, accent: 232, contrast: 'AA', neutral: 262 })

  it('clears 4.5:1 on every fill and still 7:1 on every surface, in both modes', () => {
    for (const mode of ['dark', 'light'] as const) {
      for (const [fill, text] of FILL_PAIRS) {
        expect(contrast(palette[mode][text], palette[mode][fill])).toBeGreaterThanOrEqual(4.5)
      }
      for (const [surface, text] of TEXT_PAIRS) {
        if (FILL_PAIRS.some(([fill]) => fill === surface)) continue
        expect(contrast(palette[mode][text], palette[mode][surface])).toBeGreaterThanOrEqual(7)
      }
    }
  })

  it('carries white text on the dark primary, where AAA had to go pastel', () => {
    expect(lightness(palette.dark['primary-foreground'])).toBeGreaterThan(90)
    expect(lightness(palette.dark.primary)).toBeLessThan(65)
  })

  it('is brighter than the same recipe at AAA in light', () => {
    const strict = buildPalette({ ...bare, accent: 232, neutral: 262 })

    expect(lightness(palette.light.primary)).toBeGreaterThan(lightness(strict.light.primary))
  })
})
