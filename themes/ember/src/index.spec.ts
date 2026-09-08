import { describe, expect, it } from 'vite-plus/test'

import * as theme from './index.ts'

describe('the package barrel', () => {
  it('exports the recipe, which is the whole of what a person writes for a theme', () => {
    expect(Object.keys(theme).toSorted()).toEqual(['recipe'])
  })
})
