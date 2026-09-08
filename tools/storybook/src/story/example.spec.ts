import { describe, expect, it } from 'vite-plus/test'

import { example } from './example.ts'

describe('example', () => {
  it('turns the controls off, because an example states its props rather than offering them', () => {
    expect(example.parameters.controls).toEqual({ disable: true })
  })

  it('pads the canvas, because a grid has no centre worth finding', () => {
    expect(example.parameters.layout).toBe('padded')
  })

  it('writes no tag, since the indexer hides every story but the Playground by name', () => {
    expect(example).not.toHaveProperty('tags')
  })
})
