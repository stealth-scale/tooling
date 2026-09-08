import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'

import { type Recipe } from '#recipe.ts'
import { writeTheme } from '#write.ts'

/**
 * Holds a recipe that states one colour and nothing else.
 */
const RECIPE: Recipe = { color: { primary: 265 } }

let root = ''

beforeEach(() => {
  root = join(mkdtempSync(join(tmpdir(), 'stealth-theme-')), 'kalon')
  mkdirSync(root, { recursive: true })
})

afterEach(() => {
  rmSync(root, { force: true, recursive: true })
  vi.restoreAllMocks()
})

/**
 * Reads one of the files the write left behind.
 *
 * @param {string} name - The file's name, below `dist`.
 * @returns {string} Its contents.
 */
function written(name: string): string {
  return readFileSync(join(root, 'dist', name), 'utf8')
}

/**
 * Names the script a theme calls the write from, which sits at its package root.
 *
 * @returns {string} The URL, as `import.meta.url` would give it.
 */
function from(): string {
  return pathToFileURL(join(root, 'vite.config.ts')).href
}

describe('writeTheme', () => {
  it('writes every stylesheet a theme ships, so its dist stands on its own', () => {
    writeTheme(RECIPE, from())

    expect(written('tokens.css'), 'the one a document takes').toContain(':root')
    expect(written('scoped.css'), 'the one a Storybook loads').toContain('[data-theme=')
    expect(written('index.css'), 'the one an app links').toContain(`@import './tokens.css';`)
    expect(written('base.css')).toContain('@layer base')
    expect(written('density.css')).toContain('data-density')
    expect(written('motion.css')).toContain('@keyframes')
    expect(written('tailwind.css')).toContain('tailwindcss')
    expect(written('fonts.css')).toContain('Do not edit')
  })

  it('writes the table a consumer reads a theme as data from, and the tables beside it', () => {
    writeTheme(RECIPE, from())

    expect(written('values.mjs')).toContain('export const values')
    expect(written('values.mjs'), 'so a page draws what the theme states').toContain(
      'export const tables',
    )
    expect(written('values.d.mts')).toContain('ThemeValues')
    expect(written('values.d.mts')).toContain('Tables')
  })

  it('takes the name a document writes from the package directory, so a theme states it nowhere', () => {
    writeTheme(RECIPE, from())

    expect(written('scoped.css')).toContain("[data-theme='kalon']")
  })

  it('answers what it wrote, so a build reads the palette back without opening a file', () => {
    const emitted = writeTheme(RECIPE, from())

    expect(emitted.scoped).toBe(written('scoped.css'))
    expect(emitted.values.light['background']).toBeDefined()
    expect(emitted.tables.spacing).toBe('0.25rem')
  })

  it('loads the font files a theme names, from the theme’s own package', () => {
    writeTheme(
      { ...RECIPE, font: { sans: { family: 'Inter Variable', source: '@fontsource/inter.css' } } },
      from(),
    )

    expect(written('fonts.css')).toContain(`@import '@fontsource/inter.css';`)
  })

  it('says how it read a colour written out, so a build states what shipped', () => {
    const said: string[] = []
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk: unknown) => {
      said.push(String(chunk))
      return true
    })

    writeTheme({ color: { contrast: 'AA', primary: '#2d5bd7' } }, from())

    expect(said).toHaveLength(1)
    expect(said[0]).toContain('theme kalon: primary #2d5bd7 is read as hue')
  })

  it('says nothing for a theme that wrote every colour as a hue', () => {
    const said: string[] = []
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk: unknown) => {
      said.push(String(chunk))
      return true
    })

    writeTheme(RECIPE, from())

    expect(said).toEqual([])
  })

  it('writes nothing for a recipe no palette builds from', () => {
    expect(() => writeTheme({ color: { primary: 400 } }, from())).toThrow(/kalon/u)
    expect(() => written('tokens.css')).toThrow()
  })
})
