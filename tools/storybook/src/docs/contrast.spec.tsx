import { render } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { OUTLINE_PAIRS, TEXT_PAIRS } from '@stealthscale/core-theme'

import { Guarantees } from './contrast.tsx'
import { BROKEN, previewWrote } from './fixtures.ts'

/**
 * Reads the rows the table marks as failing.
 */
function failingIn(container: HTMLElement): HTMLElement[] {
  const rows = [...container.querySelectorAll<HTMLElement>('[data-slot="guarantee"]')]
  return rows.filter((row) => !('ok' in row.dataset))
}

describe('Guarantees', () => {
  it('measures every pair the contract guarantees, and a built theme passes them all', () => {
    const { container } = render(<Guarantees />)
    previewWrote()

    const rows = container.querySelectorAll('[data-slot="guarantee"]')

    expect(rows).toHaveLength(TEXT_PAIRS.length + OUTLINE_PAIRS.length)
    expect(failingIn(container).map((row) => row.textContent)).toEqual([])
  })

  it('marks every pair a theme fails, so a broken theme shows on the page', () => {
    const { container } = render(<Guarantees />)
    previewWrote({}, BROKEN)

    const failing = failingIn(container)

    expect(failing.length).toBeGreaterThan(0)
    expect(failing[0]?.textContent).toContain('1.00:1')
    expect(failing[0]?.textContent).toContain('fail')
  })

  it('prints the floor each group is held to', () => {
    const { container } = render(<Guarantees />)
    previewWrote({ mode: 'dark' })

    expect(container.textContent).toContain('7.0:1')
    expect(container.textContent).toContain('4.5:1')
    expect(container.textContent).toContain('3.0:1')
  })
})
