import { render } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { previewWrote } from './fixtures.ts'
import { Inks, Pairs, reached } from './pairs.tsx'

/**
 * Reads the level a drawn pair or ink reports.
 */
function levelOf(drawn: Element | undefined): string | undefined {
  return drawn?.querySelector<HTMLElement>('[data-reached]')?.dataset['reached']
}

describe('reached', () => {
  it('names the level a ratio reaches', () => {
    expect(reached(7)).toBe('AAA')
    expect(reached(4.5)).toBe('AA')
    expect(reached(4.49)).toBe('fails')
  })
})

describe('Pairs', () => {
  it('draws each pair as text on its fill, with the ratio the theme reaches', () => {
    const { container } = render(
      <Pairs
        pairs={[
          ['background', 'foreground'],
          ['primary', 'primary-foreground'],
        ]}
      />,
    )
    previewWrote()

    const drawn = container.querySelectorAll('[data-slot="pair"]')

    expect(drawn).toHaveLength(2)
    expect(levelOf(drawn[0])).toBe('AAA')
    expect(drawn[0]?.textContent).toContain('foreground')
  })

  it('writes a pair that reaches no level in the destructive ink', () => {
    const { container } = render(<Pairs pairs={[['background', 'background']]} />)
    previewWrote()

    const ratio = container.querySelector<HTMLElement>('[data-reached]')

    expect(ratio?.dataset['reached']).toBe('fails')
    expect(ratio?.getAttribute('style')).toContain('var(--destructive-ink)')
  })
})

describe('Inks', () => {
  it('draws each ink as a line on the page, with its ratio against the page', () => {
    const { container } = render(<Inks tokens={['primary-ink', 'destructive-ink']} />)
    previewWrote({ mode: 'dark' })

    const drawn = container.querySelectorAll('[data-slot="ink"]')

    expect(drawn).toHaveLength(2)
    expect(drawn[1]?.textContent).toContain('destructive-ink')
    expect(levelOf(drawn[1])).toBe('AAA')
  })

  it('draws on the surface a page names instead of the page', () => {
    const { container } = render(<Inks on="muted" tokens={['code-string']} />)
    previewWrote()

    expect(container.querySelector('[data-slot="ink"] [data-reached]')?.textContent).toContain(':1')
  })
})
