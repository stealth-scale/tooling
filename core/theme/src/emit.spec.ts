import { describe, expect, it } from 'vite-plus/test'

import { emit, emitScoped, emitTheme } from '#emit.ts'
import { type Recipe } from '#recipe.ts'
import { OWNED_NAMESPACES, RADIUS } from '#scales.ts'
import { declarations } from '#stylesheet.ts'
import { DEFAULT_TABLES, type Tables } from '#tables.ts'
import { COLOR_TOKENS, REQUIRED_TOKENS, type ThemeValues } from '#tokens.ts'

/**
 * Builds one mode with every token present, each value telling which mode it is.
 *
 * @param {string} label - The mode's name, written into every value.
 * @returns {Record<string, string>} Every required token, each set to its labelled value.
 */
function mode(label: string): Record<string, string> {
  return Object.fromEntries(REQUIRED_TOKENS.map((token) => [token, `${label}-${token}`]))
}

/**
 * Builds a theme with every token present in both modes.
 *
 * @returns {ThemeValues} The theme.
 */
function complete(): ThemeValues {
  return { dark: mode('dark'), light: mode('light') }
}

/**
 * Holds a recipe that states one colour and nothing else.
 */
const RECIPE: Recipe = { color: { primary: 265 } }

describe('emit', () => {
  const css = emit(complete(), DEFAULT_TABLES)
  const layer = declarations(css, '@theme inline')
  const root = declarations(css, ':root')

  it('declares the light values on :root and the dark values under .dark', () => {
    expect(root['background']).toBe('light-background')
    expect(declarations(css, '.dark')['background']).toBe('dark-background')
  })

  it('nulls every namespace it owns before it names a step, so no default survives', () => {
    for (const namespace of OWNED_NAMESPACES) {
      expect(css).toContain(`--${namespace}-*: initial;`)
    }
  })

  it("maps every colour token into the theme layer, pointing at the theme's own variable", () => {
    for (const token of COLOR_TOKENS) {
      expect(layer[`color-${token}`]).toBe(`var(--${token})`)
    }
  })

  it('names every scale in the layer and carries every value on the theme itself', () => {
    for (const [step, { lineHeight, size }] of Object.entries(DEFAULT_TABLES.text)) {
      expect(layer[`text-${step}`], 'the layer names').toBe(`var(--text-${step})`)
      expect(root[`text-${step}`], 'the theme carries').toBe(`${String(size)}rem`)
      expect(root[`text-${step}--line-height`]).toBe(
        `calc(${String(lineHeight)} / ${String(size)})`,
      )
    }
    for (const step of Object.keys(DEFAULT_TABLES.duration)) {
      expect(layer[`duration-${step}`]).toBe(`var(--duration-${step})`)
      expect(root[`duration-${step}`]).toMatch(/^\d+ms$/u)
    }
    for (const step of Object.keys(DEFAULT_TABLES.animation)) {
      expect(layer[`animate-${step}`]).toBe(`var(--animate-${step})`)
      expect(root[`animate-${step}`]).toContain(step)
    }
  })

  it('derives every radius from the one the theme sets, which a region can override alone', () => {
    for (const [step, factor] of Object.entries(RADIUS)) {
      expect(layer[`radius-${step}`]).toBe(`calc(var(--radius) * ${String(factor)})`)
    }
    expect(
      root['radius-md'],
      'a step no theme declares, since the layer computes it',
    ).toBeUndefined()
  })

  it("mixes every shadow from the theme's ink, with the raised edge's highlight under it", () => {
    for (const step of Object.keys(DEFAULT_TABLES.shadow)) {
      const shadow = root[`shadow-${step}`] ?? ''

      expect(shadow.startsWith('inset 0 1px 0 0 var(--shadow-highlight), ')).toBe(true)
      expect(shadow).toContain('color-mix(in oklch, var(--shadow)')
      expect(shadow, 'no shadow is black').not.toContain('rgb(0 0 0')
      expect(layer[`shadow-${step}`]).toBe(`var(--shadow-${step})`)
    }
    expect(root['inset-shadow-xs']).toContain('var(--shadow)')
    expect(root['drop-shadow-md']).toContain('var(--shadow)')
    expect(root['text-shadow-sm']).toContain('var(--shadow)')
  })

  it('rings the floating steps and leaves the resting ones alone', () => {
    for (const [step, share] of Object.entries(DEFAULT_TABLES.shadowRim)) {
      const shadow = root[`shadow-${step}`] ?? ''

      expect(shadow.includes('--shadow-rim'), `shadow-${step}`).toBe(share > 0)
    }
    expect(root['shadow-xs'], 'a button rests').not.toContain('--shadow-rim')
    expect(root['shadow-2xl'], 'a dialog floats').toContain('var(--shadow-rim) 100%')
  })

  it('registers the glows under the shadow namespace, thrown in the glow colour', () => {
    for (const step of Object.keys(DEFAULT_TABLES.glow)) {
      const glow = root[`shadow-glow-${step}`] ?? ''

      expect(glow, step).toContain('var(--glow)')
      expect(glow, 'not the shadow ink').not.toContain('var(--shadow)')
      expect(glow, 'a glow has no raised edge').not.toContain('--shadow-highlight')
    }
  })

  it('carries the one length a gap derives from, and how far a press gives', () => {
    expect(layer['spacing']).toBe('var(--spacing)')
    expect(root['spacing']).toBe('0.25rem')
    expect(root['press-scale']).toBe('0.98')
  })

  it('points every control size at the density, so a region changes both at once', () => {
    expect(layer['height-md']).toBe('var(--height-md)')
    expect(layer['size-md'], 'a square control is as wide as it is tall').toBe('var(--height-md)')
  })

  it('sets the transition defaults from its own durations and easings', () => {
    expect(layer['default-transition-duration']).toBe('var(--duration-normal)')
    expect(layer['default-transition-timing-function']).toBe('var(--ease-out)')
  })

  it('writes none of the keyframes, variants or densities, which its own stylesheets hold', () => {
    expect(css).not.toContain('@keyframes')
    expect(css).not.toContain('@custom-variant')
    expect(css).not.toContain('data-density')
    expect(css, 'a breakpoint is a layout decision').not.toContain('--breakpoint-')
  })

  it('carries a step a theme added, which is what makes the layer follow the tables', () => {
    const wider: Tables = {
      ...DEFAULT_TABLES,
      blur: { ...DEFAULT_TABLES.blur, huge: 96 },
    }
    const written = emit(complete(), wider)

    expect(declarations(written, '@theme inline')['blur-huge']).toBe('var(--blur-huge)')
    expect(declarations(written, ':root')['blur-huge']).toBe('96px')
  })
})

describe('emitScoped', () => {
  const css = emitScoped(complete(), DEFAULT_TABLES, 'probe')

  it('puts a theme behind its own attribute and no layer, which the document holds once', () => {
    expect(css).toContain("[data-theme='probe'] {")
    expect(css).toContain("[data-theme='probe'].dark,")
    expect(css).not.toContain('@theme')
    expect(declarations(css, "[data-theme='probe'] {")['radius']).toBe('light-radius')
  })

  it('carries every scale behind the attribute, so switching a theme changes more than colour', () => {
    const scoped = declarations(css, "[data-theme='probe'] {")

    expect(scoped['duration-normal']).toBe(`${String(DEFAULT_TABLES.duration['normal'])}ms`)
    expect(scoped['text-base']).toBe('1rem')
    expect(scoped['shadow-md']).toContain('color-mix')
  })

  it('carries the densities too, on the theme itself and on a region below it', () => {
    const scoped = declarations(css, "[data-theme='probe'] {")

    expect(css).toContain("[data-theme='probe'][data-density='compact'],")
    expect(css).toContain("[data-theme='probe'] [data-density='compact']")
    expect(scoped['height-md'], 'the default, in the block the theme already opens').toBe('2.5rem')
    expect(scoped['focus-width']).toBe('2px')
    expect(declarations(css, "[data-theme='probe'][data-density='compact'],")['height-md']).toBe(
      '2rem',
    )
  })
})

describe('emitTheme', () => {
  it('answers every stylesheet a theme package ships, and what it solved', () => {
    const emitted = emitTheme(RECIPE, 'base')

    expect(Object.keys(emitted).toSorted()).toEqual([
      'base',
      'density',
      'fonts',
      'index',
      'motion',
      'report',
      'scoped',
      'tables',
      'tailwind',
      'tokens',
      'utilities',
      'values',
    ])
    expect(emitted.values.light['background'], 'the palette was solved').toBeDefined()
    expect(emitted.tables.duration['normal']).toBe(DEFAULT_TABLES.duration['normal'])
  })

  it('scopes one stylesheet to the name a document writes, and roots the other', () => {
    const { scoped, tokens } = emitTheme(RECIPE, 'thesmos')

    expect(scoped).toContain("[data-theme='thesmos']")
    expect(tokens, 'the one an app links claims the document').toContain(':root')
  })

  it('solves the same palette every time, so a baseline does not move under a rebuild', () => {
    expect(emitTheme(RECIPE, 'base').tokens).toBe(emitTheme(RECIPE, 'base').tokens)
  })

  it('carries what a theme states into the stylesheet it writes', () => {
    const { tokens } = emitTheme({ ...RECIPE, motion: { speed: 2 } }, 'base')

    expect(declarations(tokens, ':root')['duration-normal']).toBe(
      `${String((DEFAULT_TABLES.duration['normal'] ?? 0) * 2)}ms`,
    )
  })

  it('reports how it read a colour a designer wrote out', () => {
    const { report } = emitTheme({ color: { contrast: 'AA', primary: '#2d5bd7' } }, 'base')

    expect(report[0]).toContain('primary #2d5bd7 is read as hue')
  })

  it('lays a stated colour over the solved one, and leaves the rest derived', () => {
    const solved = emitTheme(RECIPE, 'base')
    const stated = emitTheme(
      { color: { ...RECIPE.color, stated: { light: { border: 'oklch(80% 0.02 262)' } } } },
      'base',
    )

    expect(stated.values.light['border'], 'a brand owns this one').toBe('oklch(80% 0.02 262)')
    expect(stated.values.dark['border'], 'the mode it was not stated in').toBe(
      solved.values.dark['border'],
    )
    expect(stated.values.light['primary'], 'everything else still follows the recipe').toBe(
      solved.values.light['primary'],
    )
  })

  it('refuses a stated colour its own label cannot be read on', () => {
    const solved = emitTheme(RECIPE, 'base')
    const unreadable = {
      color: {
        ...RECIPE.color,
        stated: { light: { primary: solved.values.light['primary-foreground'] } },
      },
    }

    expect(() => emitTheme(unreadable, 'base')).toThrow(/primary-foreground on primary/u)
  })

  it('refuses a recipe no palette builds from, naming the theme and the field', () => {
    expect(() => emitTheme({ color: { primary: 400 } }, 'base')).toThrow(/base/u)
    expect(() => emitTheme({ color: { primary: 400 } }, 'base')).toThrow(/primary/u)
  })

  it('refuses a recipe with no colour at all, rather than drawing something odd', () => {
    expect(() => emitTheme({}, 'base')).toThrow(/no palette builds from/u)
  })
})
