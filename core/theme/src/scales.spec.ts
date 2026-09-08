import { describe, expect, it } from 'vite-plus/test'

import {
  BLUR,
  bySize,
  CONTROL_SIZES,
  CONTROL_STEPS,
  controlHeights,
  DEFAULT_DENSITY,
  DENSITY,
  DROP_SHADOW,
  DURATION,
  EASE,
  FOCUS_WIDTH,
  FONT_WEIGHT,
  GLOW,
  INSET_SHADOW,
  LEADING,
  OWNED_NAMESPACES,
  PERSPECTIVE,
  RADIUS,
  SHADOW,
  SIZE_STEPS,
  TARGET_SIZES,
  TEXT,
  TEXT_SHADOW,
  TRACKING,
} from '#scales.ts'

/**
 * Sets how many pixels one rem is, which is what a height is measured in.
 */
const ROOT_FONT_SIZE = 16

/**
 * Reads every height of a density in pixels, smallest step first.
 *
 * @param {string} name - The density.
 * @returns {number[]} The heights, in pixels.
 */
function pixelsOf(name: string): number[] {
  const density = DENSITY[name]
  if (density === undefined) throw new Error(`no density ${name}`)
  const heights = controlHeights(density)
  return CONTROL_SIZES.map((size) => heights[size] * ROOT_FONT_SIZE)
}

/**
 * Sorts steps as a designer reads them rather than as a dictionary does.
 *
 * @param {readonly string[]} steps - The steps to sort.
 * @returns {string[]} The steps, smallest first.
 */
function sorted(steps: readonly string[]): string[] {
  return bySize(Object.fromEntries(steps.map((step) => [step, 0]))).map(([step]) => step)
}

describe('bySize', () => {
  it('orders a table the way a designer reads it rather than the way a dictionary does', () => {
    expect(bySize({ '2xl': 0, md: 0, xs: 0 }).map(([step]) => step)).toEqual(['xs', 'md', '2xl'])
    expect(SIZE_STEPS.indexOf('base'), 'the body step sits among the sizes').toBeGreaterThan(0)
  })

  it('leaves a table keyed by something other than a size as it was', () => {
    expect(bySize({ in: 1, out: 2, spring: 3 })).toEqual([
      ['in', 1],
      ['out', 2],
      ['spring', 3],
    ])
  })

  it('puts a step it does not know after every step it does', () => {
    expect(bySize({ loose: 0, md: 0, xs: 0 }).map(([step]) => step)).toEqual(['xs', 'md', 'loose'])
  })
})

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
    expect(sorted(Object.keys(RADIUS))).toEqual(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'])
    expect(sorted(Object.keys(RADIUS)).map((step) => RADIUS[step])).toEqual(
      sorted(Object.keys(RADIUS))
        .map((step) => RADIUS[step])
        .toSorted((a, b) => (a ?? 0) - (b ?? 0)),
    )
  })
})

describe('the shadows', () => {
  it("run Tailwind's steps for each kind of shadow", () => {
    expect(sorted(Object.keys(SHADOW))).toEqual(['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'])
    expect(sorted(Object.keys(INSET_SHADOW))).toEqual(['2xs', 'xs', 'sm'])
    expect(sorted(Object.keys(DROP_SHADOW))).toEqual(['xs', 'sm', 'md', 'lg', 'xl', '2xl'])
    expect(sorted(Object.keys(TEXT_SHADOW))).toEqual(['2xs', 'xs', 'sm', 'md', 'lg'])
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
      ...Object.values(INSET_SHADOW).flat(),
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
    expect(sorted(Object.keys(BLUR))).toEqual(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'])
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

describe('the densities', () => {
  it('name three, the default among them, each one length', () => {
    expect(Object.keys(DENSITY).toSorted()).toEqual(['comfortable', 'compact', 'touch'])
    expect(DENSITY[DEFAULT_DENSITY]).toBeDefined()
    expect(DENSITY['compact']?.control).toBeLessThan(DENSITY['comfortable']?.control ?? 0)
    expect(DENSITY['comfortable']?.control).toBeLessThan(DENSITY['touch']?.control ?? 0)
  })

  it('derive every step from the one length, four pixels apart, the default in the middle', () => {
    expect(CONTROL_STEPS.md).toBe(0)
    expect(controlHeights({ control: 2, focusOffset: 0 })).toEqual({
      lg: 2.25,
      md: 2,
      sm: 1.75,
      xs: 1.5,
    })
    for (const name of Object.keys(DENSITY)) {
      const heights = pixelsOf(name)
      for (const [index, height] of heights.entries()) {
        expect(height, `${name} step ${String(index)}`).toBe(
          (heights[0] ?? 0) + index * (ROOT_FONT_SIZE / 4),
        )
      }
    }
  })

  it('draw every control on whole pixels, at or above the minimum target', () => {
    for (const name of Object.keys(DENSITY)) {
      for (const height of pixelsOf(name)) {
        expect(Number.isInteger(height), `${name} ${String(height)}px`).toBe(true)
        expect(height, name).toBeGreaterThanOrEqual(TARGET_SIZES.minimum)
      }
    }
  })

  it('clear the enhanced target at touch, from the default step up', () => {
    const [, , md, lg] = pixelsOf('touch')

    expect(md).toBeGreaterThanOrEqual(TARGET_SIZES.enhanced)
    expect(lg).toBeGreaterThanOrEqual(TARGET_SIZES.enhanced)
  })

  it('keep one ring width at the enhanced perimeter, and never draw the ring inside', () => {
    expect(FOCUS_WIDTH).toBeGreaterThanOrEqual(2)
    for (const { focusOffset } of Object.values(DENSITY)) {
      expect(focusOffset).toBeGreaterThanOrEqual(0)
    }
    expect(DENSITY['compact']?.focusOffset, 'packed edge to edge, so flush').toBe(0)
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
      'height',
      'size',
    ]) {
      expect(OWNED_NAMESPACES).toContain(namespace)
    }
    expect(OWNED_NAMESPACES).not.toContain('breakpoint')
    expect(OWNED_NAMESPACES).not.toContain('container')
    expect(OWNED_NAMESPACES).not.toContain('spacing')
  })
})
