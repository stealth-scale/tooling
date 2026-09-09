import { type ComponentProps, type ReactElement } from 'react'

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { describeContract } from './contract.tsx'
import { part } from './part.ts'

// The contract suite runs inside every component's spec. What it cannot assert about itself is
// what it does when the part it is looking for is not there.

/**
 * Draws a component that marks its part and lets a caller's class win, which is what the
 * contract asks of one.
 *
 * A design system does this by merging through `cn`, so a caller's `rounded-none` displaces
 * the component's `rounded-lg` rather than joining it. Replacing outright is the same thing
 * for one colliding pair, and it keeps a Tailwind library out of the toolchain for the sake
 * of a fixture.
 *
 * @param {ComponentProps<'div'>} props - Whatever the suite drives through it.
 * @returns {ReactElement} The marked part.
 */
function Marked({ className, ...props }: ComponentProps<'div'>): ReactElement {
  return <div className={className ?? 'rounded-lg'} data-slot="marked" {...props} />
}

describeContract<HTMLDivElement>({
  element: (props) => <Marked {...props} />,
  overrides: ['rounded-none', 'rounded-lg'],
  skipRef: true,
  skipStyle: true,
  slot: 'marked',
})

describe('part', () => {
  it('says which slot was missing rather than reporting undefined', () => {
    // The message is what a reader gets when a rename lands: "no such part", not "undefined is
    // not 'sm'" three assertions later.
    const { container } = render(<Marked />)

    expect(() => part(container, 'absent')).toThrow('[data-slot="absent"]')
  })
})
