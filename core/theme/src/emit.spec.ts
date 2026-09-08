import { describe, expect, it } from 'vite-plus/test'

import {
  boxShadowOf,
  emit,
  emitDensities,
  emitMotion,
  emitScoped,
  emitTailwind,
  emitTheme,
  glowOf,
  radiusOf,
} from '#emit.ts'
import { ANIMATION, KEYFRAMES } from '#motion.ts'
import { CONTROL_SIZES, DENSITY, GLOW, OWNED_NAMESPACES, RADIUS, SHADOW, TEXT } from '#scales.ts'
import { declarations } from '#stylesheet.ts'
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

describe('emit', () => {
  const css = emit(complete())
  const layer = declarations(css, '@theme inline')

  it('declares the light values on :root and the dark values under .dark', () => {
    expect(declarations(css, ':root')['background']).toBe('light-background')
    expect(declarations(css, '.dark')['background']).toBe('dark-background')
  })

  it('nulls every namespace it owns before it registers a step, so no default survives', () => {
    for (const namespace of OWNED_NAMESPACES) {
      expect(css).toContain(`--${namespace}-*: initial;`)
    }
  })

  it("maps every colour token into the theme layer, pointing at the theme's own variable", () => {
    for (const token of COLOR_TOKENS) {
      expect(layer[`color-${token}`]).toBe(`var(--${token})`)
    }
  })

  it('registers the type scale with a line height beside each size', () => {
    for (const [step, { lineHeight, size }] of Object.entries(TEXT)) {
      expect(layer[`text-${step}`]).toBe(`${String(size)}rem`)
      expect(layer[`text-${step}--line-height`]).toBe(
        `calc(${String(lineHeight)} / ${String(size)})`,
      )
    }
  })

  it('derives every radius from the one the theme sets', () => {
    for (const [step, factor] of Object.entries(RADIUS)) {
      expect(layer[`radius-${step}`]).toBe(`calc(var(--radius) * ${String(factor)})`)
    }
  })

  it("mixes every shadow from the theme's ink, with the raised edge's highlight under it", () => {
    for (const step of Object.keys(SHADOW)) {
      const shadow = layer[`shadow-${step}`] ?? ''

      expect(shadow.startsWith('inset 0 1px 0 0 var(--shadow-highlight), ')).toBe(true)
      expect(shadow).toContain('color-mix(in oklch, var(--shadow)')
      expect(shadow, 'no shadow is black').not.toContain('rgb(0 0 0')
    }
    expect(layer['inset-shadow-xs']).toContain('var(--shadow)')
    expect(layer['drop-shadow-md']).toContain('var(--shadow)')
    expect(layer['text-shadow-sm']).toContain('var(--shadow)')
  })

  it('writes one step the way the stylesheet does, for a page that draws it by hand', () => {
    expect(radiusOf(0.75)).toBe('calc(var(--radius) * 0.75)')
    expect(boxShadowOf([{ fraction: 40, geometry: '0 1px 3px 0' }])).toBe(
      'inset 0 1px 0 0 var(--shadow-highlight), 0 1px 3px 0 color-mix(in oklch, var(--shadow) 40%, transparent)',
    )
    expect(glowOf([{ fraction: 80, geometry: '0 0 12px -2px' }])).toBe(
      '0 0 12px -2px color-mix(in oklch, var(--glow) 80%, transparent)',
    )
  })

  it('registers the glows under the shadow namespace, thrown in the glow colour', () => {
    for (const step of Object.keys(GLOW)) {
      const glow = layer[`shadow-glow-${step}`] ?? ''

      expect(glow, step).toContain('var(--glow)')
      expect(glow, 'not the shadow ink').not.toContain('var(--shadow)')
      expect(glow, 'a glow has no raised edge').not.toContain('--shadow-highlight')
    }
  })

  it('sets the transition defaults from its own durations and easings', () => {
    expect(layer['default-transition-duration']).toBe('var(--duration-normal)')
    expect(layer['default-transition-timing-function']).toBe('var(--ease-out)')
    expect(layer['duration-normal']).toMatch(/^\d+ms$/u)
    expect(layer['ease-spring']).toContain('cubic-bezier')
  })

  it('writes none of the keyframes, variants or densities, which the design system authors', () => {
    expect(css).not.toContain('@keyframes')
    expect(css).not.toContain('@custom-variant')
    expect(css).not.toContain('data-density')
    expect(css, 'a breakpoint is a layout decision').not.toContain('--breakpoint-')
  })
})

describe('emitScoped', () => {
  it('puts a theme behind its own attribute and no layer, which the document holds once', () => {
    const css = emitScoped(complete(), 'probe')

    expect(css).toContain("[data-theme='probe'] {")
    expect(css).toContain("[data-theme='probe'].dark,")
    expect(css).not.toContain('@theme')
    expect(declarations(css, "[data-theme='probe'] {")['radius']).toBe('light-radius')
  })
})

/**
 * Names a recipe with every required member and nothing else, so a case states only what it
 * is about.
 */
const RECIPE = { accent: 250, chart: [10, 80, 150, 220, 290], neutral: 260, primary: 265 }

describe('emitTheme', () => {
  it('answers both stylesheets and the values a theme package ships', () => {
    const emitted = emitTheme(RECIPE, 'base')

    expect(Object.keys(emitted).toSorted()).toEqual(['root', 'scoped', 'values'])
    expect(emitted.values.light['background'], 'the palette was solved').toBeDefined()
    expect(emitted.values.dark['background']).toBeDefined()
  })

  it('scopes one stylesheet to the name a document writes, and roots the other', () => {
    const { root, scoped } = emitTheme(RECIPE, 'thesmos')

    expect(scoped).toContain("[data-theme='thesmos']")
    expect(root, 'the one an app links claims the document').toContain(':root')
  })

  it('solves the same palette every time, so a baseline does not move under a rebuild', () => {
    expect(emitTheme(RECIPE, 'base').root).toBe(emitTheme(RECIPE, 'base').root)
  })

  it('refuses a recipe no palette builds from, naming the theme and the field', () => {
    expect(() => emitTheme({ ...RECIPE, primary: 400 }, 'base')).toThrow(/base/u)
    expect(() => emitTheme({ ...RECIPE, primary: 400 }, 'base')).toThrow(/primary/u)
  })

  it('refuses a recipe missing a member, rather than drawing something odd', () => {
    expect(() => emitTheme({ accent: 250 }, 'base')).toThrow(/no palette builds from/u)
  })
})

describe('emitDensities', () => {
  it('gives a page that sets no attribute the default density', () => {
    const css = emitDensities()
    const root = declarations(css, ':root')

    expect(root['height-md'], 'comfortable puts the default control at 40px').toBe('2.5rem')
    expect(root['focus-width'], 'one width in every density').toBe('2px')
  })

  it('writes a block per density, so a region can be denser than the page around it', () => {
    const css = emitDensities()

    expect(declarations(css, "[data-density='compact'] {")['height-md']).toBe('2rem')
    expect(declarations(css, "[data-density='touch'] {")['height-md']).toBe('2.75rem')
    expect(declarations(css, "[data-density='comfortable'] {")['height-md']).toBe('2.5rem')
  })

  it('draws the ring flush where a density leaves no room outside a control', () => {
    const css = emitDensities()

    expect(declarations(css, "[data-density='compact'] {")['focus-offset']).toBe('0px')
    expect(declarations(css, "[data-density='touch'] {")['focus-offset']).toBe('2px')
  })

  it('carries every step of every density, so no control size is left unset', () => {
    const css = emitDensities()

    for (const name of Object.keys(DENSITY)) {
      const block = declarations(css, `[data-density='${name}'] {`)
      expect(
        CONTROL_SIZES.every((step) => block[`height-${step}`] !== undefined),
        name,
      ).toBe(true)
    }
  })
})

describe('emitTailwind', () => {
  it('brings in the framework every stealth theme runs on, and its plugins', () => {
    const css = emitTailwind()

    expect(css).toContain(`@import 'tailwindcss';`)
    expect(css).toContain(`@plugin '@tailwindcss/typography';`)
  })

  it('registers the plugins after the import that defines them, and before anything else', () => {
    const lines = emitTailwind().trim().split('\n')
    const lastImport = lines.findLastIndex((line) => line.startsWith('@import'))
    const firstPlugin = lines.findIndex((line) => line.startsWith('@plugin'))

    expect(lastImport, 'a CSS parser refuses an import that follows another at-rule').toBeLessThan(
      firstPlugin,
    )
  })
})

describe('emitMotion', () => {
  it('registers every animation as a step of the animate namespace', () => {
    const css = emitMotion()

    for (const [name, shorthand] of Object.entries(ANIMATION)) {
      expect(css).toContain(`  --animate-${name}: ${shorthand};`)
    }
    expect(css, 'a pressed control gives by the scale the contract sets').toContain(
      '--press-scale: 0.98;',
    )
  })

  it('defines the keyframes those steps run, at every offset each names', () => {
    const css = emitMotion()

    for (const name of Object.keys(KEYFRAMES)) {
      expect(css).toContain(`@keyframes ${name} {`)
    }
    expect(css, 'an offset naming two stops writes one rule').toContain(`  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }`)
    expect(css, 'and an animation with one stop writes one').toContain(`@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}`)
  })

  it('stops motion for a person who asks, by the query and by the attribute', () => {
    const css = emitMotion()

    expect(css).toContain('@media (prefers-reduced-motion: reduce) {')
    expect(css).toContain('[data-reduced-motion] *::after {')
    expect(css, 'the press has to be flattened where it is declared').toContain('--press-scale: 1;')
    expect(css, 'a spinner keeps turning, slowly').toContain(
      "[data-reduced-motion] [data-slot='spinner'] {",
    )
  })

  it('declares the press scale before the rule that flattens it', () => {
    const css = emitMotion()

    expect(
      css.indexOf('--press-scale: 0.98;'),
      'a rule that loads before the declaration it overrides does nothing',
    ).toBeLessThan(css.indexOf('--press-scale: 1;'))
  })
})
