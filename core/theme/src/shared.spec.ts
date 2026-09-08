import { describe, expect, it } from 'vite-plus/test'

import { KEYFRAMES } from '#motion.ts'
import { emitBase, emitDensities, emitFonts, emitIndex, emitMotion, emitTailwind } from '#shared.ts'
import { declarations } from '#stylesheet.ts'
import { DEFAULT_TABLES } from '#tables.ts'

describe('emitFonts', () => {
  it('loads every file a theme named, in the order the recipe named them', () => {
    const css = emitFonts(['@fontsource-variable/inter/wght.css', './brand.css'])

    expect(css).toContain(`@import '@fontsource-variable/inter/wght.css';`)
    expect(css).toContain(`@import './brand.css';`)
    expect(css.indexOf('inter')).toBeLessThan(css.indexOf('brand'))
  })

  it('loads nothing for a theme drawing in the faces the system already has', () => {
    expect(emitFonts([]).trim()).toBe(emitFonts([]).trim())
    expect(emitFonts([])).not.toContain('@import')
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

describe('emitBase', () => {
  const css = emitBase()

  it('keys the dark variant off the class every theme writes its dark tokens under', () => {
    expect(css).toContain('@custom-variant dark (&:where(.dark, .dark *));')
  })

  it('draws the page from the theme’s own tokens, or nothing reads them', () => {
    const body = declarations(css, 'body')

    expect(body['background-color']).toBeUndefined()
    expect(css).toContain('background-color: var(--background);')
    expect(css).toContain('color: var(--foreground);')
    expect(css).toContain('font-family: var(--font-sans);')
  })

  it('takes the focus ring’s geometry from the density, not from a component', () => {
    expect(css).toContain('outline: var(--focus-width) solid var(--ring);')
    expect(css).toContain('outline-offset: var(--focus-offset);')
  })

  it('paints selected text with the pair the contract guarantees', () => {
    expect(css).toContain('background-color: var(--selection);')
    expect(css).toContain('color: var(--selection-foreground);')
  })

  it('draws a heading in the display face and code in the mono one', () => {
    expect(css).toContain('font-family: var(--font-display);')
    expect(css).toContain('font-family: var(--font-mono);')
  })

  it('names no component library, since the base belongs to every product', () => {
    expect(css, 'the state attributes are the library’s own').not.toContain('data-open')
    expect(css).not.toContain('data-orientation')
  })
})

describe('emitDensities', () => {
  it('writes the densities a theme states, the default on the document', () => {
    const css = emitDensities(DEFAULT_TABLES)

    expect(declarations(css, ':root')['height-md']).toBe('2.5rem')
    expect(declarations(css, "[data-density='compact'] {")['height-md']).toBe('2rem')
    expect(declarations(css, "[data-density='touch'] {")['height-md']).toBe('2.75rem')
  })

  it('opens with whichever density the theme named its own default', () => {
    const css = emitDensities({ ...DEFAULT_TABLES, defaultDensity: 'compact' })

    expect(declarations(css, ':root')['height-md']).toBe('2rem')
  })
})

describe('emitMotion', () => {
  const css = emitMotion()

  it('defines the keyframes every animation runs, at every offset each names', () => {
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

  it('states no timing, which is the theme’s to declare', () => {
    expect(css, 'a shorthand belongs to the theme').not.toContain('--animate-fade-in:')
    expect(css).not.toContain('@theme')
  })

  it('stops motion for a person who asks, by the query and by the attribute', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce) {')
    expect(css).toContain('[data-reduced-motion] *::after {')
    expect(css, 'a spinner keeps turning, slowly').toContain(
      "[data-reduced-motion] [data-slot='spinner'] {",
    )
  })

  it('flattens the press with a weight no theme scope outranks', () => {
    expect(css, 'a theme declares the scale behind its own attribute').toContain(
      '--press-scale: 1 !important;',
    )
  })
})

describe('emitIndex', () => {
  it('imports the whole theme in the order the cascade needs it', () => {
    const imported = emitIndex()
      .trim()
      .split('\n')
      .filter((line) => line.startsWith('@import'))

    expect(imported).toEqual([
      `@import './fonts.css';`,
      `@import './tailwind.css';`,
      `@import './base.css';`,
      `@import './density.css';`,
      `@import './motion.css';`,
      `@import './tokens.css';`,
    ])
  })

  it('imports its own files alone, so a theme’s dist stands on its own', () => {
    const imported = [...emitIndex().matchAll(/@import '([^']+)'/gu)].map((match) =>
      String(match[1]),
    )

    expect(
      imported.filter((source) => !source.startsWith('./')),
      'extending a theme extends its recipe, not its stylesheets',
    ).toEqual([])
  })
})
