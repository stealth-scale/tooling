import { describe, expect, it } from 'vite-plus/test'

import { DOCS_STYLE } from '#preview/blocks.ts'

describe('DOCS_STYLE', () => {
  it('reaches the props table through the one class Storybook keeps stable', () => {
    expect(DOCS_STYLE).toContain('table.docblock-argstable')
    expect(
      DOCS_STYLE.includes('css-'),
      'a generated class is a name that changes on a patch release',
    ).toBe(false)
  })

  it('draws the block on the theme’s own surface rather than a second palette', () => {
    const tokens = ['--card', '--border', '--radius', '--shadow-sm']

    expect(tokens.filter((token) => !DOCS_STYLE.includes(`var(${token})`))).toEqual([])
    expect(DOCS_STYLE, 'nothing is pinned to a literal colour').not.toMatch(/#[0-9a-f]{3,8}\b/iu)
  })

  it('clips the tab bar and the table into one box, on one surface', () => {
    expect(DOCS_STYLE).toContain('overflow: hidden')
    expect(DOCS_STYLE, 'the tab bar is the card the table is').toContain('background: transparent')
  })

  it('leaves room under itself, so the next heading is not against the border', () => {
    expect(DOCS_STYLE).toMatch(/margin-block-end: [\d.]+rem/u)
  })

  it('opens every rule with one selector, since a list splits on its comma', () => {
    const selectors = [...DOCS_STYLE.matchAll(/^(?<selector>[^{}\n][^{}]*)\{/gmu)].map((rule) =>
      String(rule.groups?.['selector']).trim(),
    )

    expect(selectors.length).toBeGreaterThan(0)
    expect(selectors.filter((selector) => selector.includes(','))).toEqual([])
  })
})
