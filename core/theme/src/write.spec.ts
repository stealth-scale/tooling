import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'

import { writeTheme } from '#write.ts'

const RECIPE = { accent: 250, chart: [10, 80, 150, 220, 290], neutral: 260, primary: 265 }

let root = ''

beforeEach(() => {
  root = join(mkdtempSync(join(tmpdir(), 'stealth-theme-')), 'kalon')
  mkdirSync(join(root, 'src'), { recursive: true })
})

afterEach(() => {
  rmSync(root, { force: true, recursive: true })
})

/**
 * Reads one of the files the write left behind.
 *
 * @param {string} name - The file's name, below `src`.
 * @returns {string} Its contents.
 */
function written(name: string): string {
  return readFileSync(join(root, 'src', name), 'utf8')
}

/**
 * Names the script a theme calls the write from, which sits at its package root.
 *
 * @returns {string} The URL, as `import.meta.url` would give it.
 */
function from(): string {
  return pathToFileURL(join(root, 'emit.ts')).href
}

describe('writeTheme', () => {
  it('writes both stylesheets and the table a consumer imports', () => {
    writeTheme(RECIPE, from())

    expect(written('tokens.gen.css'), 'the one a document takes').toContain(':root')
    expect(written('scoped.gen.css'), 'the one a catalogue loads').toContain('[data-theme=')
    expect(written('values.gen.ts')).toContain('export const values: ThemeValues')
  })

  it('takes the name a document writes from the package directory, so a theme states it nowhere', () => {
    writeTheme(RECIPE, from())

    expect(written('scoped.gen.css')).toContain("[data-theme='kalon']")
  })

  it('answers what it wrote, so a build can read the palette back', () => {
    const emitted = writeTheme(RECIPE, from())

    expect(emitted.scoped).toBe(written('scoped.gen.css'))
    expect(emitted.values.light['background']).toBeDefined()
  })

  it('writes nothing for a recipe no palette builds from', () => {
    expect(() => writeTheme({ ...RECIPE, primary: 400 }, from())).toThrow(/kalon/u)
    expect(() => written('tokens.gen.css')).toThrow()
  })
})
