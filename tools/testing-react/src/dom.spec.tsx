import { render } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { attr, renderedAs } from './dom.ts'

describe('attr', () => {
  it('reads a data attribute off a documented part', () => {
    const { container } = render(<div data-size="sm" data-slot="card" />)
    expect(attr(container, 'card', 'size')).toBe('sm')
  })

  it('answers undefined for an attribute the part does not carry', () => {
    const { container } = render(<div data-slot="card" />)
    expect(attr(container, 'card', 'size')).toBeUndefined()
  })

  it('says which part is missing rather than failing on undefined', () => {
    const { container } = render(<div />)
    expect(() => attr(container, 'card', 'size')).toThrow('card')
  })
})

describe('renderedAs', () => {
  it('reports the element a part rendered as', () => {
    const { container } = render(<article data-slot="card" />)
    expect(renderedAs(container, 'card')).toBe('ARTICLE')
  })
})
