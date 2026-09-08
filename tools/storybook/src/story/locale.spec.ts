import { describe, expect, it } from 'vite-plus/test'

import { localeOf } from './locale.ts'

describe('localeOf', () => {
  it('names the language a story is drawn in, so its fixtures speak it too', () => {
    expect(localeOf({ globals: { locale: 'nl-BE' } })).toBe('nl-BE')
  })

  it('lets the language a story pinned win over the toolbar', () => {
    expect(localeOf({ globals: { locale: 'nl-BE' }, storyGlobals: { locale: 'en' } })).toBe('en')
  })

  it('names nothing where no toolbar says a language', () => {
    expect(localeOf({ globals: {} })).toBeUndefined()
    expect(localeOf({ globals: { locale: '' } })).toBeUndefined()
    expect(localeOf({ globals: { locale: 12 } })).toBeUndefined()
  })
})
