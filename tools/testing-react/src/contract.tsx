import { createRef, type CSSProperties, type ReactElement, type Ref } from 'react'

import { render } from '@testing-library/react'
import { expect, it } from 'vite-plus/test'

import { part as partBy } from './part.ts'

/**
 * Names the props the contract drives through a component.
 *
 * @template E - The element the component's part renders as.
 */
export interface ContractProps<E extends Element> {
  /**
   * Sets the class a consumer passes, which has to beat the component's own.
   */
  className: string

  /**
   * Takes the reference, which has to reach the element rather than a wrapper.
   */
  ref: Ref<E>

  /**
   * Sets an inline style, which has to survive alongside the class.
   */
  style: CSSProperties

  /**
   * Sets an arbitrary attribute, which has to reach the element untouched.
   */
  title: string
}

/**
 * Describes what a contract suite is told: how to render the component, and where its part is.
 *
 * @template E - The element the component's part renders as.
 */
export interface ContractSpec<E extends Element> {
  /**
   * Renders the component, spreading the props it is given onto the part `slot` names.
   */
  element: (props: Partial<ContractProps<E>>) => ReactElement

  /**
   * `[consumer, internal]` — two Tailwind utilities that collide. The consumer's must win,
   * which only happens when the component merges through `cn` rather than concatenating.
   */
  overrides: [consumer: string, internal: string]

  /**
   * Skip the `ref` assertion, for a component whose root is a third-party function component
   * that never declared a `ref` prop. `Calendar` renders react-day-picker's `DayPicker`, which
   * is not a forwardRef component, so a ref has nowhere to land. Set this only with that kind of
   * reason — a missing ref in *our* wrapper is a defect to fix, not to skip.
   */
  skipRef?: boolean

  /**
   * Skip the `style` assertion, for a control whose inline styles are computed by the library
   * that owns it. `input-otp` positions its single real `<input>` as a transparent overlay with
   * inline styles applied after the consumer's, so a passed `style` cannot survive — a fact about
   * that library, not a defect in the wrapper. Set this only with that kind of reason.
   */
  skipStyle?: boolean

  /**
   * Names the `data-slot` on the part that receives the reference, the style and any
   * arbitrary attribute.
   */
  slot: string

  /**
   * The `data-slot` that receives `className`, when it is not `slot`.
   *
   * Some components wrap their control — `NativeSelect` renders a positioning `<div>` around a
   * `<select>` so it can overlay a chevron — and send `className` to the wrapper while
   * everything else spreads onto the control. That split is deliberate and worth asserting
   * rather than glossing over, so the two slots can differ.
   */
  stylesSlot?: string
}

/**
 * Registers the suite every component owes its consumers. Call it at the top level of a spec.
 *
 * Each case is something a consumer does on the first day and something a port can break
 * without saying so: a merge order that concatenates where it should override, a forgotten
 * spread, a reference that stops at a wrapper, a missing slot. They are the same shape for
 * every component, so they are written here once rather than copied into each spec.
 *
 * The assertions are plain reads of the document rather than jest-dom, so this file carries
 * no matcher setup of its own and still fails with a readable difference.
 *
 * @template E - The element the component's part renders as.
 * @param {ContractSpec<E>} spec - How to render it and where its part is. `ContractSpec`
 *     documents every member.
 */
export function describeContract<E extends Element>(spec: ContractSpec<E>): void {
  const {
    element,
    overrides: [consumerClass, internalClass],
    slot,
    stylesSlot = spec.slot,
  } = spec

  /**
   * Finds the part that takes everything but the class.
   *
   * @param {HTMLElement} container - The rendered output.
   * @returns {HTMLElement} The element carrying the slot the spec named.
   */
  const part = (container: HTMLElement): HTMLElement => partBy(container, slot)

  /**
   * Finds the part that takes the class, which is the same one unless a component splits them.
   *
   * @param {HTMLElement} container - The rendered output.
   * @returns {HTMLElement} The element the class was sent to.
   */
  const styled = (container: HTMLElement): HTMLElement => partBy(container, stylesSlot)

  it(`marks its part with data-slot="${slot}"`, () => {
    const { container } = render(element({}))
    expect(part(container).dataset.slot).toBe(slot)
  })

  it(`lets a consumer className win over its own (${consumerClass} beats ${internalClass})`, () => {
    const { container } = render(element({ className: consumerClass }))
    const target = styled(container)
    expect([...target.classList]).toContain(consumerClass)
    expect([...target.classList]).not.toContain(internalClass)
  })

  const styleTest = spec.skipStyle === true ? it.skip : it
  styleTest('merges style rather than replacing className', () => {
    const { container } = render(element({ className: consumerClass, style: { zIndex: 42 } }))
    expect(part(container).style.zIndex).toBe('42')
    expect([...styled(container).classList]).toContain(consumerClass)
  })

  it('spreads arbitrary DOM props through', () => {
    const { container } = render(element({ title: 'contract' }))
    expect(part(container).getAttribute('title')).toBe('contract')
  })

  const refTest = spec.skipRef === true ? it.skip : it
  refTest('forwards ref to the element it renders', () => {
    const ref = createRef<E>()
    const { container } = render(element({ ref }))
    expect(ref.current).toBe(part(container))
  })
}
