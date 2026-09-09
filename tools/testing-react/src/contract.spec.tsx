import { type ComponentProps, type ReactElement } from 'react'

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { type ContractProps, describeContract } from './contract.tsx'
import { part } from './part.ts'

// The contract suite runs inside every component's spec. What it cannot assert about itself is
// what it does when the part it is looking for is not there, and what it does for the two kinds
// of component that cannot answer every case.

/**
 * Draws a component that meets the whole contract: it marks its part, lets a caller's class
 * win, takes a reference and keeps an inline style.
 *
 * A design system lets the class win by merging through `cn`, so a caller's `rounded-none`
 * displaces the component's `rounded-lg` rather than joining it. Replacing outright is the
 * same thing for one colliding pair, and it keeps a Tailwind library out of the toolchain for
 * the sake of a fixture.
 *
 * @param {ComponentProps<'div'>} props - Whatever the suite drives through it.
 * @returns {ReactElement} The marked part.
 */
function Marked({ className, ...props }: ComponentProps<'div'>): ReactElement {
  return <div className={className ?? 'rounded-lg'} data-slot="marked" {...props} />
}

/**
 * Draws a component that sends the class to a wrapper and everything else to the control,
 * which is the split `stylesSlot` exists for.
 *
 * It also answers neither the reference nor the style, standing in for a component whose root
 * is a function component that never declared a reference, or whose inline styles are written
 * by the library that owns it.
 *
 * The props are the ones the suite drives rather than a `span`'s own, because the reference it
 * passes belongs to the control and this component drops it.
 *
 * @param {Partial<ContractProps<HTMLSpanElement>>} props - Whatever the suite drives through it.
 * @returns {ReactElement} The wrapper, around the control.
 */
function Split({ className, title }: Partial<ContractProps<HTMLSpanElement>>): ReactElement {
  return (
    <div className={className ?? 'rounded-lg'} data-slot="split-styles">
      <span data-slot="split" title={title} />
    </div>
  )
}

describe('a component that meets the whole contract', () => {
  describeContract<HTMLDivElement>({
    element: (props) => <Marked {...props} />,
    overrides: ['rounded-none', 'rounded-lg'],
    slot: 'marked',
  })
})

describe('a component that styles a wrapper and answers neither reference nor style', () => {
  describeContract<HTMLSpanElement>({
    element: (props) => <Split {...props} />,
    overrides: ['rounded-none', 'rounded-lg'],
    skipRef: true,
    skipStyle: true,
    slot: 'split',
    stylesSlot: 'split-styles',
  })
})

describe('part', () => {
  it('says which slot was missing rather than reporting undefined', () => {
    // The message is what a reader gets when a rename lands: "no such part", not "undefined is
    // not 'sm'" three assertions later.
    const { container } = render(<Marked />)

    expect(() => part(container, 'absent')).toThrow('[data-slot="absent"]')
  })
})
