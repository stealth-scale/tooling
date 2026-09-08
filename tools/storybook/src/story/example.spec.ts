import { describe, expect, it } from 'vite-plus/test'

import { example } from './example.ts'

describe('example', () => {
  it('drops the story from the sidebar, so the sidebar holds Docs and Playground alone', () => {
    expect(example.tags).toEqual(['!dev'])
  })

  it('turns the controls off, because an example states its props rather than offering them', () => {
    expect(example.parameters.controls).toEqual({ disable: true })
  })

  it('pads the canvas, because a grid has no centre worth finding', () => {
    expect(example.parameters.layout).toBe('padded')
  })

  it('keeps tags mutable, which is how Storybook types the field a story spreads it into', () => {
    const spread: { tags: string[] } = { ...example }

    expect(spread.tags).toEqual(['!dev'])
  })
})
