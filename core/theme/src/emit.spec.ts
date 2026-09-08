import { describe, expect, it } from 'vite-plus/test'

import { emit, emitScoped } from '#emit.ts'
import { OWNED_NAMESPACES, RADIUS, SHADOW, TEXT } from '#scales.ts'
import { declarations } from '#stylesheet.ts'
import { COLOR_TOKENS, REQUIRED_TOKENS, type ThemeValues } from '#tokens.ts'

/** One mode with every token present, each value telling which mode it is. */
function mode(label: string): Record<string, string> {
  return Object.fromEntries(REQUIRED_TOKENS.map((token) => [token, `${label}-${token}`]))
}

/** A theme with every token present in both modes. */
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

  it('maps every colour token into the theme layer, pointing at the theme’s own variable', () => {
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

  it('mixes every shadow from the theme’s ink and lays the raised edge’s highlight under it', () => {
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
  it('puts a theme behind its own attribute and registers no layer, which the document holds once', () => {
    const css = emitScoped(complete(), 'probe')

    expect(css).toContain("[data-theme='probe'] {")
    expect(css).toContain("[data-theme='probe'].dark,")
    expect(css).not.toContain('@theme')
    expect(declarations(css, "[data-theme='probe'] {")['radius']).toBe('light-radius')
  })
})
