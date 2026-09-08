import { render } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { TARGET_SIZES } from '@stealthscale/core-theme'

import { type Themes } from '#preview/appearance.ts'

import { Controls, Focus, target } from './controls.tsx'
import { previewWrote, THEMES } from './fixtures.ts'

/**
 * Holds a theme carrying no density at all, which a hand-written `values` module could.
 */
const UNDENSE: Themes = Object.fromEntries(
  Object.entries(THEMES).map(([name, theme]) => [
    name,
    { ...theme, tables: { ...theme.tables, density: {} } },
  ]),
)

/**
 * Reads what each control specimen printed, in the order they are drawn.
 *
 * @param {HTMLElement} container - What the block rendered into.
 * @returns {string[]} One line per specimen.
 */
function drawn(container: HTMLElement): string[] {
  return [...container.querySelectorAll('[data-slot="control"]')].map((one) => one.textContent)
}

describe('target', () => {
  it('names the target size a height reaches', () => {
    expect(target(TARGET_SIZES.enhanced)).toBe('enhanced')
    expect(target(TARGET_SIZES.minimum)).toBe('minimum')
    expect(target(TARGET_SIZES.minimum - 1)).toBe('under')
  })
})

describe('Controls', () => {
  it('draws one specimen per size the system names, largest last', () => {
    const { container } = render(<Controls />)
    previewWrote()

    const specimens = drawn(container)

    expect(specimens).toHaveLength(4)
    expect(specimens[0]).toContain('size="xs"')
    expect(specimens.at(-1)).toContain('size="lg"')
  })

  it('takes its height from the density variable, so what is drawn is what a component draws', () => {
    const { container } = render(<Controls />)
    previewWrote()

    const specimen = container.querySelector<HTMLElement>('[data-slot="control"] span')

    expect(specimen?.style.blockSize, 'the theme decides, not this page').toBe('var(--height-xs)')
  })

  it('measures every control against the density on the toolbar, and follows it', () => {
    const { container } = render(<Controls />)

    previewWrote({ density: 'comfortable' })
    expect(container.querySelector('[data-slot="density"]')?.textContent).toBe('comfortable')
    expect(drawn(container)[2], 'comfortable puts the default control at 40px').toContain('40px')

    previewWrote({ density: 'compact' })
    expect(drawn(container)[2], 'and compact at 32px').toContain('32px')

    previewWrote({ density: 'touch' })
    expect(drawn(container)[2], 'and touch at 44px').toContain('44px')
  })

  it('says which target each control clears, so a density that fails one shows here', () => {
    const { container } = render(<Controls />)
    previewWrote({ density: 'touch' })

    const reached = [...container.querySelectorAll<HTMLElement>('[data-slot="control"]')].map(
      (one) => one.dataset['reached'],
    )

    expect(reached, 'touch clears the enhanced target from the default step up').toEqual([
      'minimum',
      'minimum',
      'enhanced',
      'enhanced',
    ])
  })

  it('falls back to the theme’s own density where the toolbar names one it does not have', () => {
    const { container } = render(<Controls />)
    previewWrote({ density: 'roomy' })

    expect(drawn(container)[2], "the theme's default, rather than nothing at all").toContain('40px')
  })

  it('measures nothing for a theme that carries no density, rather than throwing', () => {
    const { container } = render(<Controls />)
    previewWrote({}, UNDENSE)

    expect(drawn(container)[2], 'the specimen still draws, on whatever the page sets').toContain(
      '0px under',
    )
  })
})

describe('Focus', () => {
  it('draws the ring from the theme’s width and the density’s offset', () => {
    const { container } = render(<Focus />)
    previewWrote({ density: 'compact' })

    const focused = container.querySelector<HTMLElement>('[data-slot="focused"]')

    expect(focused?.style.outline).toBe('var(--focus-width) solid var(--ring)')
    expect(focused?.style.outlineOffset).toBe('var(--focus-offset)')
    expect(container.textContent, 'packed edge to edge, so the ring sits flush').toContain(
      '2px ring, 0px offset at compact',
    )
  })

  it('moves the offset with the density, and keeps the one width', () => {
    const { container } = render(<Focus />)
    previewWrote({ density: 'touch' })

    expect(container.textContent).toContain('2px ring, 2px offset at touch')
  })

  it('reads a flush ring for a theme that carries no density', () => {
    const { container } = render(<Focus />)
    previewWrote({ density: 'compact' }, UNDENSE)

    expect(container.textContent).toContain('2px ring, 0px offset at compact')
  })
})
