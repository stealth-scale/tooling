import { describe, expect, it } from 'vite-plus/test'

import { CAPTION, CORNER, GRID, HAIRLINE, MONO } from './styles.ts'

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
})
