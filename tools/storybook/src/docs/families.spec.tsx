import { render } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { type Themes } from '#preview/appearance.ts'

import { Families, firstFamily } from './families.tsx'
import { previewWrote, THEMES } from './fixtures.ts'

/**
 * Holds a theme that names a face of its own for each of the three roles.
 */
const FACED: Themes = Object.fromEntries(
  Object.entries(THEMES).map(([name, theme]) => [
    name,
    {
      ...theme,
      values: {
        dark: theme.values.dark,
        light: {
          ...theme.values.light,
          'font-display': "'Newsreader Variable', Georgia, serif",
          'font-mono': "'JetBrains Mono Variable', ui-monospace, monospace",
          'font-sans': "'DM Sans Variable', ui-sans-serif, system-ui, sans-serif",
        },
      },
    },
  ]),
)

/**
 * Reads the family named beside each specimen, in the order they are drawn.
 *
 * @param {HTMLElement} container - What the block rendered into.
 * @returns {(null | string)[]} One family per role.
 */
function named(container: HTMLElement): (null | string)[] {
  return [...container.querySelectorAll('[data-slot="named"]')].map((one) => one.textContent)
}

describe('firstFamily', () => {
  it('reads the face a browser draws, which is the one the stack opens with', () => {
    expect(firstFamily("'Inter Variable', ui-sans-serif, system-ui, sans-serif")).toBe(
      'Inter Variable',
    )
    expect(firstFamily('ui-monospace, monospace')).toBe('ui-monospace')
    expect(firstFamily('"DM Sans Variable", sans-serif')).toBe('DM Sans Variable')
  })
})

describe('Families', () => {
  it('draws one specimen per role, the heading face first', () => {
    const { container } = render(<Families />)
    previewWrote()

    const roles = [...container.querySelectorAll('[data-slot="role"]')]

    expect(container.querySelectorAll('[data-slot="family"]')).toHaveLength(3)
    expect(roles.map((one) => one.textContent)).toEqual(['font-display', 'font-sans', 'font-mono'])
  })

  it('names each family the theme asked for', () => {
    const { container } = render(<Families />)
    previewWrote({}, FACED)

    expect(named(container)).toEqual([
      'Newsreader Variable',
      'DM Sans Variable',
      'JetBrains Mono Variable',
    ])
  })

  it('sets each specimen in the token rather than the name, so a face that failed to load shows', () => {
    const { container } = render(<Families />)
    previewWrote({}, FACED)

    const faces = [...container.querySelectorAll<HTMLElement>('[data-slot="family"] span')].filter(
      (one) => one.style.fontFamily !== '',
    )

    expect(faces.map((one) => one.style.fontFamily)).toEqual([
      'var(--font-display)',
      'var(--font-sans)',
      'var(--font-mono)',
    ])
  })

  it('says which theme named them, so the toolbar and the page agree', () => {
    const { container } = render(<Families />)
    previewWrote()

    expect(container.querySelector('[data-slot="theme"]')?.textContent).toBe('Kalon')
  })
})
