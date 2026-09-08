import { render, within } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { Mirror } from './mirror.tsx'

describe('Mirror', () => {
  it('draws each name against the value the story holds under it', () => {
    const { container } = render(<Mirror of={{ open: true, selected: 'Rotterdam' }} />)

    expect(within(container).getByText('open').tagName).toBe('DT')
    expect(container.querySelector('[data-mirror="open"] dd')?.textContent).toBe('true')
    expect(container.querySelector('[data-mirror="selected"] dd')?.textContent).toBe('Rotterdam')
  })

  it('writes a number as its digits, so a play compares text rather than a type', () => {
    const { container } = render(<Mirror of={{ acknowledged: 0 }} />)

    expect(container.querySelector('[data-mirror="acknowledged"] dd')?.textContent).toBe('0')
  })

  it('keeps the order the story gave, so a reader finds a value where it was put', () => {
    const { container } = render(<Mirror of={{ a: 1, b: 2, c: 3 }} />)
    const rows = [...container.querySelectorAll<HTMLElement>('[data-mirror]')]

    expect(rows.map((one) => one.dataset['mirror'])).toEqual(['a', 'b', 'c'])
  })

  it('holds the names apart, so two values never land in one row', () => {
    const { container } = render(<Mirror of={{ a: 1, b: 2, c: 3 }} />)
    const names = [...container.querySelectorAll('dt')].map((one) => one.textContent)

    expect(names).toEqual(['a', 'b', 'c'])
  })

  it('draws nothing to read when the story holds nothing', () => {
    const { container } = render(<Mirror of={{}} />)

    expect(container.querySelectorAll('[data-mirror]')).toHaveLength(0)
    expect(
      container.querySelector('[data-slot="mirror"]')?.tagName,
      'the list is still there, so a story adding one value does not shift the page',
    ).toBe('DL')
  })
})
