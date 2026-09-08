import { render, within } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { Grid } from './grid.tsx'

const TONES = ['neutral', 'accent', 'danger'] as const
const SIZES = ['small', 'medium'] as const

describe('Grid', () => {
  it('draws one cell per crossing of the two axes', () => {
    const { container } = render(
      <Grid
        cell={(tone, size) => <button type="button">{`${tone} ${size}`}</button>}
        columns={SIZES}
        rows={TONES}
      />,
    )

    expect(within(container).getAllByRole('button')).toHaveLength(TONES.length * SIZES.length)
  })

  it('labels both edges, so a reader can tell which cell is which', () => {
    const { container } = render(<Grid cell={() => null} columns={SIZES} rows={TONES} />)
    const labelled = [...TONES, ...SIZES].map((label) => within(container).getByText(label))

    expect(labelled).toHaveLength(TONES.length + SIZES.length)
  })

  it('hands the cell its own row and column', () => {
    const { container } = render(
      <Grid cell={(tone, size) => <span>{`${tone}/${size}`}</span>} columns={SIZES} rows={TONES} />,
    )

    expect(within(container).getByText('accent/small')).toBeDefined()
    expect(within(container).getByText('danger/medium')).toBeDefined()
  })

  it('draws the axes in the order it was given them, not sorted', () => {
    const { container } = render(<Grid cell={() => null} columns={SIZES} rows={TONES} />)
    const legends = within(container).getAllByText(/neutral|accent|danger/u)

    expect(legends.map((legend) => legend.textContent)).toEqual(['neutral', 'accent', 'danger'])
  })

  it('draws the header row alone when there are no rows', () => {
    const { container } = render(
      <Grid cell={() => <button type="button">cell</button>} columns={SIZES} rows={[]} />,
    )

    expect(within(container).queryAllByRole('button')).toHaveLength(0)
    expect(within(container).getByText('small')).toBeDefined()
  })
})
