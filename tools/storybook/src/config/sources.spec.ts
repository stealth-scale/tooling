import { basename } from 'node:path'
import { describe, expect, it } from 'vite-plus/test'

import { kitDirectory, sourceTransform, tailwindSources } from './sources.ts'

/** A stylesheet that roots a Tailwind build, as a theme's own writes one. */
const ROOT = "@import 'tailwindcss';\n@import 'tw-animate-css';\n"

/** The transform under test, pointed somewhere a path never collides with. */
const transform = sourceTransform('/read/me')

describe('kitDirectory', () => {
  it('answers the package root rather than the directory this module sits in', () => {
    expect(basename(kitDirectory())).toBe('storybook')
  })
})

describe('sourceTransform', () => {
  it('points Tailwind at the directory, from the stylesheet that roots the build', () => {
    const written = transform(ROOT, '/w/themes/base/dist/index.css')

    expect(written).toContain(ROOT)
    expect(written).toContain('@source "/read/me";')
  })

  it('quotes the directory, since a path may hold a space or an apostrophe', () => {
    expect(sourceTransform("/a b/o'brien")(ROOT, '/w/x.css')).toContain('@source "/a b/o\'brien";')
  })

  it('leaves a stylesheet that roots no build alone, since a second root reaches nothing', () => {
    expect(transform(':root { --a: 1 }', '/w/themes/base/dist/tokens.css')).toBeNull()
  })

  it('leaves everything that is not a stylesheet alone', () => {
    expect(transform(ROOT, '/w/components/badge/badge.tsx')).toBeNull()
  })

  it('leaves a stylesheet asked for as text alone, which is a string rather than a build', () => {
    expect(transform(ROOT, '/w/themes/base/dist/index.css?raw')).toBeNull()
    expect(transform(ROOT, '/w/themes/base/dist/index.css?url')).toBeNull()
  })
})

describe('tailwindSources', () => {
  it('runs before the Tailwind plugin, which reads the stylesheet this one wrote', () => {
    expect(tailwindSources().enforce).toBe('pre')
    expect(tailwindSources().name).toBe('stealth:tailwind-sources')
  })
})
