import { render } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { CODE_TOKENS, OUTLINE_TOKENS } from '@stealthscale/core-theme'

import { Edges, Syntax } from './edges.tsx'
import { previewWrote } from './fixtures.ts'

describe('Edges', () => {
  it('draws every outline token as the edge it draws', () => {
    const { container } = render(<Edges />)
    previewWrote()

    const drawn = container.querySelectorAll('[data-slot="edge"]')

    expect(drawn).toHaveLength(OUTLINE_TOKENS.length)
    expect(drawn[2]?.textContent).toContain('ring')
    expect(drawn[2]?.querySelector(':scope > div > div')?.getAttribute('style')).toContain(
      'box-shadow',
    )
  })
})

describe('Syntax', () => {
  it('draws code on the muted surface, using every role the contract names', () => {
    const { container } = render(<Syntax />)
    previewWrote()

    const block = container.querySelector<HTMLElement>('[data-slot="syntax"]')

    expect(block?.dataset['roles']).toBe(String(CODE_TOKENS.length))
    expect(block?.querySelectorAll('span')).toHaveLength(CODE_TOKENS.length + 1)
    expect(block?.textContent).toContain("schedule('tomorrow', 3)")
  })
})
