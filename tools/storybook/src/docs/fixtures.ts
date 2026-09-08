import { act } from '@testing-library/react'

import { type Appearance } from '@stealthscale/core-appearance'
import { emitTheme } from '@stealthscale/core-theme'

import { type Themes } from '#preview/appearance.ts'
import { preview } from '#preview/store.ts'

/**
 * Holds a recipe that states only what it must, which every block specification draws with.
 */
export const RECIPE = {
  color: { accent: 200, chart: [258, 152, 292, 45, 12], neutral: 260, primary: 258 },
}

/**
 * Holds the one theme the specifications draw with, solved and scaled the way a theme package
 * does when it is built.
 */
const KALON = emitTheme(RECIPE, 'kalon')

/**
 * Names that theme the way the preview registers it.
 */
export const THEMES: Themes = {
  kalon: { tables: KALON.tables, title: 'Kalon', values: KALON.values },
}

/**
 * Holds the registered theme with its light foreground painted over its background, so every
 * pair that reads text on the page fails. A block that reports a failing pair draws from it.
 */
export const BROKEN: Themes = Object.fromEntries(
  Object.entries(THEMES).map(([name, theme]) => [
    name,
    {
      ...theme,
      values: {
        ...theme.values,
        light: { ...theme.values.light, foreground: theme.values.light.background },
      },
    },
  ]),
)

/**
 * Builds an appearance in the registered theme.
 *
 * @param {Partial<Appearance>} [overrides] - The values that differ from light, left to right
 *     and moving. Default: none.
 * @returns {Appearance} The appearance.
 */
export function drawnIn(overrides: Partial<Appearance> = {}): Appearance {
  return {
    density: 'comfortable',
    direction: 'ltr',
    locale: 'en',
    mode: 'light',
    reducedMotion: false,
    theme: 'kalon',
    ...overrides,
  }
}

/**
 * Writes what a running preview would have written, so a block has a theme to draw.
 *
 * @param {Partial<Appearance>} [overrides] - The values that differ from the light appearance.
 *     Default: none.
 * @param {Themes} [themes] - The themes the preview registered. Default: the solved theme.
 */
export function previewWrote(overrides: Partial<Appearance> = {}, themes: Themes = THEMES): void {
  act(() => {
    preview.set({ appearance: drawnIn(overrides), themes })
  })
}
