import { describe, expect, it, vi } from 'vite-plus/test'

import { type Offered } from '@stealthscale/core-appearance'

import {
  appearanceFrom,
  type RegisteredThemes,
  type Sheets,
  solveThemes,
  type Themes,
  themeStylesheet,
  writeThemes,
} from './appearance.ts'

/** What a workspace with two themes and two languages offers. */
const OFFERED: Offered = {
  densities: ['comfortable', 'compact'],
  locales: ['en', 'ar'],
  themes: ['kalon', 'thesmos'],
}

/** A recipe that states only what it must. */
const RECIPE = { accent: 200, chart: [258, 152, 292, 45, 12], neutral: 260, primary: 258 }

/** A theme's tokens, in the two the stylesheet is read for. */
function values(primary: string): Themes[string]['values'] {
  const tokens = { background: '#ffffff', primary } as unknown as Themes[string]['values']['light']
  return { dark: tokens, light: tokens }
}

/** A document standing in, recording what is appended to its head. */
function fakeDocument(written: null | object): Sheets & { appended: HTMLStyleElement[] } {
  const appended: HTMLStyleElement[] = []
  return {
    appended,
    createElement: () => ({ id: '', textContent: '' }) as HTMLStyleElement,
    head: {
      append: (style: HTMLStyleElement): void => {
        appended.push(style)
      },
    } as unknown as HTMLHeadElement,
    querySelector: vi.fn<() => null | object>(() => written),
  }
}

describe('solveThemes', () => {
  it('builds every token of every theme from its recipe, and keeps the title', () => {
    const registered: RegisteredThemes = { kalon: { recipe: RECIPE, title: 'Kalon' } }

    const solved = solveThemes(registered)

    expect(solved['kalon']?.title).toBe('Kalon')
    expect(solved['kalon']?.values.light.background).toMatch(/^oklch\(/u)
    expect(solved['kalon']?.values.dark.foreground).toMatch(/^oklch\(/u)
  })

  it('refuses a recipe that fails its schema, naming the theme and the field', () => {
    const registered: RegisteredThemes = {
      kalon: { recipe: { ...RECIPE, primary: 400 }, title: 'Kalon' },
    }

    expect(() => solveThemes(registered)).toThrow(/Theme kalon .*primary/u)
  })

  it('refuses a module that exports no recipe at all', () => {
    expect(() => solveThemes({ odd: { recipe: undefined, title: 'Odd' } })).toThrow('Theme odd')
  })

  it('solves nothing for a workspace that registered no theme', () => {
    expect(solveThemes({})).toEqual({})
  })
})

describe('appearanceFrom', () => {
  it('takes every value a toolbar is on', () => {
    const appearance = appearanceFrom(
      {
        density: 'compact',
        direction: 'rtl',
        locale: 'ar',
        mode: 'dark',
        reducedMotion: 'reduced',
        theme: 'thesmos',
      },
      OFFERED,
    )

    expect(appearance).toEqual({
      density: 'compact',
      direction: 'rtl',
      locale: 'ar',
      mode: 'dark',
      reducedMotion: true,
      theme: 'thesmos',
    })
  })

  it('falls back to the offer where a toolbar says nothing', () => {
    const appearance = appearanceFrom({}, OFFERED)

    expect(appearance.theme, 'the first theme offered').toBe('kalon')
    expect(appearance.density, 'the first density offered').toBe('comfortable')
    expect(typeof appearance.reducedMotion).toBe('boolean')
  })

  it('reads the direction off the locale unless a toolbar states one', () => {
    expect(appearanceFrom({ locale: 'ar' }, OFFERED).direction).toBe('rtl')
    expect(appearanceFrom({ direction: 'ltr', locale: 'ar' }, OFFERED).direction).toBe('ltr')
  })

  it('reads full motion as a choice, not as a toolbar saying nothing', () => {
    expect(appearanceFrom({ reducedMotion: 'full' }, OFFERED).reducedMotion).toBe(false)
  })

  it('ignores a toolbar carrying something that is not its value', () => {
    const appearance = appearanceFrom(
      { density: '', direction: 'sideways', mode: 'twilight', reducedMotion: 'yes', theme: 12 },
      OFFERED,
    )

    expect(appearance.theme).toBe('kalon')
    expect(appearance.density).toBe('comfortable')
    expect(appearance.direction).toBe('ltr')
    expect(['dark', 'light']).toContain(appearance.mode)
  })
})

describe('themeStylesheet', () => {
  it('writes every theme scoped to the value a document carries', () => {
    const sheet = themeStylesheet({
      kalon: { title: 'Kalon', values: values('#101010') },
      thesmos: { title: 'Thesmos', values: values('#202020') },
    })

    expect(sheet).toContain("[data-theme='kalon']")
    expect(sheet).toContain("[data-theme='thesmos']")
    expect(sheet).toContain('#101010')
  })

  it('writes nothing for a workspace that registered no theme', () => {
    expect(themeStylesheet({})).toBe('')
  })
})

describe('writeThemes', () => {
  it('writes every theme into the document once, as one element the next call finds', () => {
    const themes: Themes = { kalon: { title: 'Kalon', values: values('#101010') } }
    const into = fakeDocument(null)

    writeThemes(themes, into)

    expect(into.appended).toHaveLength(1)
    expect(into.appended[0]?.id).toBe('stealth-themes')
    expect(into.appended[0]?.textContent).toContain("[data-theme='kalon']")
    expect(into.querySelector).toHaveBeenCalledWith('#stealth-themes')
  })

  it('leaves a document that already carries the stylesheet alone', () => {
    const into = fakeDocument({})

    writeThemes({}, into)

    expect(into.appended).toHaveLength(0)
  })
})
