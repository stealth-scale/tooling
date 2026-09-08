import { describe, expect, it } from 'vite-plus/test'

import { BADGE, BUTTON, CAPTION, CORNER, GRID, HAIRLINE, MONO } from './styles.ts'

describe('the shared styles', () => {
  it('read the theme’s own variables rather than naming a colour or a font', () => {
    expect(MONO.fontFamily).toBe('var(--font-mono)')
    expect(CAPTION.color).toBe('var(--muted-foreground)')
    expect(HAIRLINE).toContain('var(--border)')
    expect(CORNER).toBe('var(--radius)')
  })

  it('lay a family out as a grid with a gap', () => {
    expect(GRID.display).toBe('grid')
  })

  it('draw a control a reader presses in the theme’s secondary', () => {
    expect(BUTTON.background).toBe('var(--secondary)')
    expect(BUTTON.color, 'the pair the theme guarantees against it').toBe(
      'var(--secondary-foreground)',
    )
  })

  it('put a badge back on the page, so a measurement reads on any specimen', () => {
    expect(BADGE.background, 'the surface every guarantee is measured against').toBe(
      'var(--background)',
    )
    expect(BADGE.color).toBe('var(--foreground)')
  })
})
