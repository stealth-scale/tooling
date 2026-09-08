import { describe, expect, it } from 'vite-plus/test'

import { type Appearance } from './appearance.ts'
import { applyToDocument, ATTRIBUTES, MODE_CLASS, readFromDocument, type Root } from './document.ts'

/**
 * Builds a root element that keeps its attributes and classes in two records, so a
 * specification reads what was written without a document.
 *
 * @returns {Root & { attributes: Map<string, string>; classes: Set<string> }} The root, with
 *     its records beside it.
 */
function fakeRoot(): Root & { attributes: Map<string, string>; classes: Set<string> } {
  const attributes = new Map<string, string>()
  const classes = new Set<string>()

  return {
    attributes,
    classes,
    classList: {
      contains: (token) => classes.has(token),
      toggle: (token, force) => {
        if (force) classes.add(token)
        else classes.delete(token)
        return force
      },
    },
    getAttribute: (name) => attributes.get(name) ?? null,
    removeAttribute: (name) => {
      attributes.delete(name)
    },
    setAttribute: (name, value) => {
      attributes.set(name, value)
    },
  }
}

/**
 * Holds an appearance with every value away from its default.
 */
const drawn: Appearance = {
  density: 'compact',
  direction: 'rtl',
  locale: 'ar-EG',
  mode: 'dark',
  reducedMotion: true,
  theme: 'thesmos',
}

describe('ATTRIBUTES', () => {
  it('names an attribute for every value but the mode, which is a class', () => {
    expect(ATTRIBUTES).toEqual({
      density: 'data-density',
      direction: 'dir',
      locale: 'lang',
      reducedMotion: 'data-reduced-motion',
      theme: 'data-theme',
    })
    expect(MODE_CLASS).toBe('dark')
  })
})

describe('applyToDocument', () => {
  it('writes every value on the root, the mode as a class, the motion as a bare attribute', () => {
    const root = fakeRoot()

    applyToDocument(drawn, root)

    expect([...root.attributes]).toEqual([
      ['data-theme', 'thesmos'],
      ['data-density', 'compact'],
      ['lang', 'ar-EG'],
      ['dir', 'rtl'],
      ['data-reduced-motion', ''],
    ])
    expect([...root.classes]).toEqual(['dark'])
  })

  it('takes the class and the motion attribute off again when the values say so', () => {
    const root = fakeRoot()

    applyToDocument(drawn, root)
    applyToDocument({ ...drawn, mode: 'light', reducedMotion: false }, root)

    expect(root.classes.has('dark')).toBe(false)
    expect(root.attributes.has('data-reduced-motion')).toBe(false)
  })
})

describe('readFromDocument', () => {
  it('reads back what was written', () => {
    const root = fakeRoot()

    applyToDocument(drawn, root)

    expect(readFromDocument(root)).toEqual(drawn)
  })

  it('reads a root nothing has written as light, with motion, and nothing else', () => {
    expect(readFromDocument(fakeRoot())).toEqual({ mode: 'light', reducedMotion: false })
  })

  it('leaves out a direction that is neither ltr nor rtl', () => {
    const root = fakeRoot()
    root.setAttribute('dir', 'auto')

    expect(readFromDocument(root)).not.toHaveProperty('direction')
  })
})
