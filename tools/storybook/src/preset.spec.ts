import { existsSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { describe, expect, it } from 'vite-plus/test'

import { managerEntries, type PreviewAnnotation, previewAnnotations } from './preset.ts'

describe('managerEntries', () => {
  it('adds the entry that draws the frame, after whatever Storybook has', () => {
    const entries = managerEntries(['storybook/its-own'])

    expect(entries[0]).toBe('storybook/its-own')
    expect(entries).toHaveLength(2)
  })

  it('names the manager beside this preset, as a file that exists', () => {
    const [entry] = managerEntries()

    expect(basename(String(entry))).toBe('manager.ts')
    expect(dirname(String(entry))).toBe(import.meta.dirname)
    expect(existsSync(String(entry)), 'Storybook bundles it from this path').toBe(true)
  })
})

describe('previewAnnotations', () => {
  it('adds the preview a story draws in, after whatever Storybook has', () => {
    const annotations = previewAnnotations(['storybook/its-own'])

    expect(annotations[0]).toBe('storybook/its-own')
    expect(annotations).toHaveLength(2)
  })

  it('names the preview below this preset as a file that exists, and by its specifier', () => {
    const [annotation] = previewAnnotations() as PreviewAnnotation[]

    expect(annotation?.absolute).toBe(join(import.meta.dirname, 'preview', 'index.ts'))
    expect(existsSync(String(annotation?.absolute)), 'the builder imports it from here').toBe(true)
    expect(annotation?.bare).toBe('@stealthscale/tool-storybook/preview')
  })
})
