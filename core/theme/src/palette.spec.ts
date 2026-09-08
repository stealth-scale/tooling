import { describe, expect, it } from 'vite-plus/test'

import { assertComplete } from '#assert.ts'
import { contrast } from '#color.ts'
import { fromPolar, inGamut } from '#convert.ts'
import { buildPalette } from '#palette.ts'
import { type PaletteRecipe } from '#recipe.ts'
import { COLOR_TOKENS } from '#tokens.ts'

/** The lightness an `oklch()` value states, 0 to 100. */
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

/** The hue an `oklch(L% C H)` value states, as written. */
function hue(value: string): string {
  return (
    value
      .replace(/\s*\/.*$/u, '')
      .slice(0, -1)
      .split(' ')
      .at(-1) ?? ''
  )
}

/** A recipe that states only what it must. */
const bare: PaletteRecipe = {
  accent: 200,
  chart: [258, 152, 292, 45, 12],
  neutral: 260,
  primary: 258,
}

/** The pairs the system guarantees for text: a fill, and the text meant to sit on it. */
const TEXT_PAIRS = [
  ['background', 'foreground'],
  ['background', 'muted-foreground'],
  ['background', 'primary-ink'],
  ['background', 'destructive-ink'],
  ['background', 'success-ink'],
  ['background', 'warning-ink'],
  ['background', 'info-ink'],
  ['card', 'card-foreground'],
  ['popover', 'popover-foreground'],
  ['primary', 'primary-foreground'],
  ['secondary', 'secondary-foreground'],
  ['muted', 'muted-foreground'],
  ['accent', 'accent-foreground'],
  ['destructive', 'destructive-foreground'],
  ['success', 'success-foreground'],
  ['warning', 'warning-foreground'],
  ['info', 'info-foreground'],
  ['sidebar', 'sidebar-foreground'],
  ['sidebar-primary', 'sidebar-primary-foreground'],
  ['sidebar-accent', 'sidebar-accent-foreground'],
  ['selection', 'selection-foreground'],
  ['highlight', 'highlight-foreground'],
] as const

/** The fills a recipe’s level applies to. Everything else is text on a surface and stays AAA. */
const FILL_PAIRS = [
  ['primary', 'primary-foreground'],
  ['destructive', 'destructive-foreground'],
  ['success', 'success-foreground'],
  ['warning', 'warning-foreground'],
  ['info', 'info-foreground'],
  ['sidebar-primary', 'sidebar-primary-foreground'],
] as const

/** Four hues far enough apart that any lightness bug shows up in at least one. */
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

  it('takes its outcome hues from the recipe when it names them, and the chart tones follow', () => {
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

  it('gives the scrim its opacity, so a dialog on a dark page still has one', () => {
    expect(values.light.overlay).toMatch(/\/ 0\.50\)$/u)
    expect(values.dark.overlay).toMatch(/\/ 0\.70\)$/u)
  })

  it('lays a hairline of light along a raised edge in dark, and nothing in light', () => {
    expect(values.light['shadow-highlight']).toBe('transparent')
    expect(values.dark['shadow-highlight']).toMatch(/^oklch\(98\.0%/u)
    expect(values.dark.shadow, 'the ink carries the largest step’s opacity').toMatch(/\/ 0\.60\)$/u)
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
    'clears 3:1 on a field’s outline and the focus ring, as WCAG 1.4.11 asks (primary $primary)',
    (recipe) => {
      const palette = buildPalette(recipe)

      for (const mode of ['dark', 'light'] as const) {
        expect(
          contrast(palette[mode].input, palette[mode].card),
          `${mode} input on card`,
        ).toBeGreaterThanOrEqual(3)
        expect(
          contrast(palette[mode].ring, palette[mode].background),
          `${mode} ring on page`,
        ).toBeGreaterThanOrEqual(3)
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
