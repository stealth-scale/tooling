import { describe, expect, it } from 'vite-plus/test'

import {
  CHART_TOKENS,
  CODE_TOKENS,
  COLOR_TOKENS,
  EFFECT_TOKENS,
  EMPHASIS_TOKENS,
  FONT_TOKENS,
  GRADIENT_TOKENS,
  MODES,
  OUTLINE_TOKENS,
  RADIUS_TOKENS,
  REQUIRED_TOKENS,
  SCALAR_TOKENS,
  SHADOW_TOKENS,
  SIDEBAR_TOKENS,
  STATUS_TOKENS,
  SURFACE_TOKENS,
} from '#tokens.ts'

describe('the colour tokens', () => {
  it('are the ten groups in order, each name once', () => {
    expect([...COLOR_TOKENS]).toEqual([
      ...SURFACE_TOKENS,
      ...EMPHASIS_TOKENS,
      ...STATUS_TOKENS,
      ...OUTLINE_TOKENS,
      ...CHART_TOKENS,
      ...CODE_TOKENS,
      ...SIDEBAR_TOKENS,
      ...EFFECT_TOKENS,
      ...GRADIENT_TOKENS,
      ...SHADOW_TOKENS,
    ])
    expect(new Set(COLOR_TOKENS).size).toBe(COLOR_TOKENS.length)
  })

  it('pair every text colour with the fill it sits on', () => {
    const fills = new Set<string>(COLOR_TOKENS)

    for (const token of COLOR_TOKENS) {
      if (token === 'foreground' || !token.endsWith('-foreground')) continue
      expect(fills.has(token.replace(/-foreground$/u, '')), token).toBe(true)
    }
  })

  it('give every outcome a fill, a label and an ink, the info outcome included', () => {
    for (const outcome of ['destructive', 'success', 'warning', 'info']) {
      expect(STATUS_TOKENS).toContain(outcome)
      expect(STATUS_TOKENS).toContain(`${outcome}-foreground`)
      expect(STATUS_TOKENS).toContain(`${outcome}-ink`)
    }
  })

  it('name the scrim, the selection, the highlight and the glass, each with what it needs', () => {
    expect([...EFFECT_TOKENS]).toEqual([
      'overlay',
      'selection',
      'selection-foreground',
      'highlight',
      'highlight-foreground',
      'glass',
      'glass-border',
    ])
  })

  it('name the three gradient stops, the glow, and the two colours a shadow mixes from', () => {
    expect([...GRADIENT_TOKENS]).toEqual(['gradient-1', 'gradient-2', 'gradient-3', 'glow'])
    expect([...SHADOW_TOKENS]).toEqual(['shadow', 'shadow-highlight'])
  })
})

describe('the scalar tokens', () => {
  it('ask a theme for one radius and two families, and nothing else', () => {
    expect([...RADIUS_TOKENS]).toEqual(['radius'])
    expect([...FONT_TOKENS]).toEqual(['font-sans', 'font-mono'])
    expect(SCALAR_TOKENS).toEqual([...RADIUS_TOKENS, ...FONT_TOKENS])
  })
})

describe('the required tokens', () => {
  it('are every colour and then every scalar, in the order they are emitted', () => {
    expect(REQUIRED_TOKENS).toEqual([...COLOR_TOKENS, ...SCALAR_TOKENS])
    expect(new Set(REQUIRED_TOKENS).size).toBe(REQUIRED_TOKENS.length)
  })

  it('are checked in both modes and no third', () => {
    expect(MODES).toEqual(['dark', 'light'])
  })
})
