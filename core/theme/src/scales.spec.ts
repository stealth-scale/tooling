import { describe, expect, it } from 'vite-plus/test'

import {
  BLUR,
  DROP_SHADOW,
  DURATION,
  EASE,
  FONT_WEIGHT,
  GLOW,
  INSET_SHADOW,
  LEADING,
  OWNED_NAMESPACES,
  PERSPECTIVE,
  RADIUS,
  SHADOW,
  TEXT,
  TEXT_SHADOW,
  TRACKING,
} from '#scales.ts'

/** The size steps Tailwind names, smallest first, where a namespace runs that far. */
const SIZES = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'] as const

/** Sorts steps as a designer reads them rather than as a dictionary does. */
function bySize(steps: readonly string[]): string[] {
  return [...steps].toSorted((a, b) => SIZES.indexOf(a as never) - SIZES.indexOf(b as never))
}

describe('the type scale', () => {
  it('runs every step Tailwind names, so no step falls through to a default', () => {
    expect(Object.keys(TEXT).toSorted()).toEqual(
      [
        'xs',
        'sm',
        'base',
        'lg',
        'xl',
        '2xl',
        '3xl',
        '4xl',
        '5xl',
        '6xl',
        '7xl',
        '8xl',
        '9xl',
      ].toSorted(),
    )
  })

  it('grows with each step, and its line height never shrinks', () => {
    const steps = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl']
    const sizes = steps.map((step) => TEXT[step]?.size)
    const heights = steps.map((step) => TEXT[step]?.lineHeight)

    expect(sizes).toEqual(sizes.toSorted((a, b) => Number(a) - Number(b)))
    expect(new Set(sizes).size, 'no two steps share a size').toBe(steps.length)
    expect(heights).toEqual(heights.toSorted((a, b) => Number(a) - Number(b)))
  })
})

describe('the radii', () => {
  it('are multiples of the one radius, with lg at exactly one', () => {
    expect(RADIUS['lg']).toBe(1)
    expect(bySize(Object.keys(RADIUS))).toEqual(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'])
    expect(bySize(Object.keys(RADIUS)).map((step) => RADIUS[step])).toEqual(
      bySize(Object.keys(RADIUS))
        .map((step) => RADIUS[step])
        .toSorted((a, b) => (a ?? 0) - (b ?? 0)),
    )
  })
})

describe('the shadows', () => {
  it('run Tailwind’s steps for each kind of shadow', () => {
    expect(bySize(Object.keys(SHADOW))).toEqual(['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'])
    expect(bySize(Object.keys(INSET_SHADOW))).toEqual(['2xs', 'xs', 'sm'])
    expect(bySize(Object.keys(DROP_SHADOW))).toEqual(['xs', 'sm', 'md', 'lg', 'xl', '2xl'])
    expect(bySize(Object.keys(TEXT_SHADOW))).toEqual(['2xs', 'xs', 'sm', 'md', 'lg'])
  })

  it('throw a glow with no offset, so it reads as light rather than as a shadow', () => {
    expect(Object.keys(GLOW).toSorted()).toEqual(['lg', 'md', 'sm'])
    for (const layers of Object.values(GLOW)) {
      for (const { geometry } of layers) expect(geometry.startsWith('0 0 ')).toBe(true)
    }
  })

  it('take a share of the ink between nothing and all of it', () => {
    const layers = [
      ...Object.values(SHADOW).flat(),
      ...Object.values(GLOW).flat(),
      ...Object.values(INSET_SHADOW),
      ...Object.values(DROP_SHADOW).flat(),
      ...Object.values(TEXT_SHADOW).flat(),
    ]

    for (const { fraction } of layers) {
      expect(fraction).toBeGreaterThan(0)
      expect(fraction).toBeLessThanOrEqual(100)
    }
  })
})

describe('the remaining scales', () => {
  it('run every step Tailwind names', () => {
    expect(bySize(Object.keys(BLUR))).toEqual(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'])
    expect(Object.keys(TRACKING).toSorted()).toEqual(
      ['tighter', 'tight', 'normal', 'wide', 'wider', 'widest'].toSorted(),
    )
    expect(Object.keys(LEADING).toSorted()).toEqual(
      ['none', 'tight', 'snug', 'normal', 'relaxed', 'loose'].toSorted(),
    )
    expect(Object.keys(FONT_WEIGHT)).toHaveLength(9)
  })

  it('name the five perspectives Tailwind names, nearest first', () => {
    expect(Object.keys(PERSPECTIVE).toSorted()).toEqual(
      ['dramatic', 'near', 'normal', 'midrange', 'distant'].toSorted(),
    )
    expect(PERSPECTIVE['dramatic']).toBeLessThan(PERSPECTIVE['near'] ?? 0)
    expect(PERSPECTIVE['midrange']).toBeLessThan(PERSPECTIVE['distant'] ?? 0)
  })

  it('name three durations and four easings, the spring among them', () => {
    expect(Object.keys(DURATION).toSorted()).toEqual(['fast', 'normal', 'slow'])
    expect(DURATION['fast']).toBeLessThan(DURATION['normal'] ?? 0)
    expect(DURATION['normal']).toBeLessThan(DURATION['slow'] ?? 0)
    expect(Object.keys(EASE).toSorted()).toEqual(['in', 'in-out', 'out', 'spring'])
  })
})

describe('the owned namespaces', () => {
  it('cover every scale the emitter writes and leave layout to the design system', () => {
    for (const namespace of [
      'color',
      'font',
      'text',
      'radius',
      'shadow',
      'blur',
      'ease',
      'perspective',
    ]) {
      expect(OWNED_NAMESPACES).toContain(namespace)
    }
    expect(OWNED_NAMESPACES).not.toContain('breakpoint')
    expect(OWNED_NAMESPACES).not.toContain('container')
    expect(OWNED_NAMESPACES).not.toContain('spacing')
  })
})
