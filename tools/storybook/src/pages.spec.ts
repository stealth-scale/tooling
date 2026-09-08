import { describe, expect, it } from 'vite-plus/test'

import { PAGES, titleCase } from './pages.ts'

describe('PAGES', () => {
  it('opens with what a colour is and closes with what every theme guarantees', () => {
    expect(PAGES[0]).toBe('Colours')
    expect(PAGES.at(-1)).toBe('Accessibility')
  })

  it('names each page once, as a file stem that reads as a title', () => {
    expect(new Set(PAGES).size).toBe(PAGES.length)
    for (const page of PAGES) expect(page).toMatch(/^[A-Z][a-z]+$/u)
  })
})

describe('titleCase', () => {
  it('capitalises each dashed word and puts spaces between', () => {
    expect(titleCase('library')).toBe('Library')
    expect(titleCase('data-display')).toBe('Data Display')
  })

  it('drops an empty word, so a doubled or trailing dash writes no stray space', () => {
    expect(titleCase('org--chart-')).toBe('Org Chart')
  })
})
