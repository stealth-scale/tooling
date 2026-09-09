import { basename } from 'node:path'
import { describe, expect, it } from 'vite-plus/test'

import { kitDirectory, sourceTransform, tailwindSources } from './sources.ts'

/**
 * The entry a theme registers, which is the file Vite hands Tailwind. It imports the file
 * that imports Tailwind and never names Tailwind itself, which is why this is matched by path.
 */
const ENTRY = '/w/themes/base/dist/index.css'

/** What that entry holds, as `writeTheme` writes it. */
const ROOT = "@import './fonts.css';\n@import './tailwind.css';\n@import './tokens.css';\n"

/** The transform under test, pointed somewhere a path never collides with. */
const transform = sourceTransform([ENTRY], '/read/me')

describe('kitDirectory', () => {
  it('answers the package root rather than the directory this module sits in', () => {
    expect(basename(kitDirectory())).toBe('storybook')
  })
})

describe('sourceTransform', () => {
  it('points Tailwind at the directory, from the entry the workspace registered', () => {
    const written = transform(ROOT, ENTRY)

    expect(written).toContain(ROOT)
    expect(written).toContain('@source "/read/me";')
  })

  it('matches the entry through the query Vite appends to it', () => {
    expect(transform(ROOT, `${ENTRY}?direct`)).toContain('@source "/read/me";')
    expect(transform(ROOT, `${ENTRY}?used&lang.css`)).toContain('@source "/read/me";')
  })

  it('quotes the directory, since a path may hold a space or an apostrophe', () => {
    expect(sourceTransform([ENTRY], "/a b/o'brien")(ROOT, ENTRY)).toContain(
      '@source "/a b/o\'brien";',
    )
  })

  it('leaves the file that imports Tailwind alone, which no transform is handed', () => {
    // Tailwind resolves this one itself, off the disk. Matching on what a file holds rather
    // than on its path picks this and never sees the entry, which is the whole failure.
    expect(transform("@import 'tailwindcss';", '/w/themes/base/dist/tailwind.css')).toBeNull()
  })

  it('leaves every other stylesheet and every module alone', () => {
    expect(transform(':root { --a: 1 }', '/w/themes/base/dist/tokens.css')).toBeNull()
    expect(transform(ROOT, '/w/components/badge/badge.tsx')).toBeNull()
  })

  it('answers nothing at all where a workspace registered no stylesheet', () => {
    expect(sourceTransform([], '/read/me')(ROOT, ENTRY)).toBeNull()
  })
})

describe('tailwindSources', () => {
  it('runs before the Tailwind plugin, which reads the stylesheet this one wrote', () => {
    expect(tailwindSources([ENTRY]).enforce).toBe('pre')
    expect(tailwindSources([ENTRY]).name).toBe('stealth:tailwind-sources')
  })
})
