import { render, within } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { forcedBy, StateGrid, STATES } from './states.tsx'

const TONES = ['neutral', 'accent'] as const

describe('STATES', () => {
  it('names the states a control is designed for, rest first', () => {
    expect(STATES[0]).toBe('rest')
    expect([...STATES]).toEqual(['rest', 'hover', 'focus-visible', 'active', 'disabled', 'invalid'])
  })
})

describe('forcedBy', () => {
  it('forces the three prop-driven states with the props a component already takes', () => {
    expect(forcedBy('disabled')).toEqual({ disabled: true })
    expect(forcedBy('invalid'), 'the attribute a recipe styles and a reader hears').toEqual({
      'aria-invalid': true,
    })
  })

  it('spreads nothing for rest, which is the component as it ships', () => {
    expect(forcedBy('rest')).toEqual({})
  })

  it('forces the three pointer states with a class, since a cursor cannot be held still', () => {
    expect(forcedBy('hover')).toEqual({ className: 'pseudo-hover' })
    expect(forcedBy('focus-visible')).toEqual({ className: 'pseudo-focus-visible' })
    expect(forcedBy('active')).toEqual({ className: 'pseudo-active' })
  })

  it('reaches every state it names, so a state added without a way to force it is a type error', () => {
    const unreachable = STATES.filter((state) => forcedBy(state) === undefined)

    expect(unreachable, 'every state has a way to force it').toEqual([])
  })
})

describe('StateGrid', () => {
  it('draws every row against every designed state', () => {
    const { container } = render(
      <StateGrid
        cell={(tone, state) => <button type="button">{`${tone} ${state}`}</button>}
        rows={TONES}
      />,
    )

    expect(within(container).getAllByRole('button')).toHaveLength(TONES.length * STATES.length)
  })

  it('labels the states, so a reader can tell the columns apart', () => {
    const { container } = render(<StateGrid cell={() => null} rows={TONES} />)
    const labelled = STATES.map((state) => within(container).getByText(state).textContent)

    expect(labelled).toEqual([...STATES])
  })
})
