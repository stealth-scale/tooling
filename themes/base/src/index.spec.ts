import { describe, expect, it } from 'vite-plus/test'

import * as theme from './index.ts'

describe('the package barrel', () => {
  it('exports the recipe the theme is written as, and the table it solves to', () => {
    expect(Object.keys(theme).toSorted()).toEqual(['recipe', 'values'])
  })
})
