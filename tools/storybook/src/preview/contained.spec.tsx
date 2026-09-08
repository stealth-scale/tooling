import { type MouseEvent } from 'react'

import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vite-plus/test'

import { Contained, navigates } from './contained.tsx'

/** A click on something, for the cases a rendered event cannot reach. */
function clickOn(target: unknown): MouseEvent {
  return {
    altKey: false,
    button: 0,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    target,
  } as MouseEvent
}

describe('navigates', () => {
  it('says nothing navigates when the click landed on no element at all', () => {
    expect(navigates(clickOn(null))).toBe(false)
    expect(navigates(clickOn({ closest: () => null }))).toBe(false)
  })
})

describe('Contained', () => {
  it('stops a plain click on a link, so a story cannot take the reader off the page', () => {
    const { container } = render(
      <Contained>
        <a href="/elsewhere">go</a>
      </Contained>,
    )
    const link = container.querySelector('a')

    expect(fireEvent.click(link as Element), 'the default was prevented').toBe(false)
  })

  // These two let the click through, which is the point of them. The href is a fragment so
  // that jsdom has somewhere to go it implements: a path would make it report a navigation it
  // cannot perform, on every run, for a case that is passing.
  it('leaves a modified click alone, which is somebody asking for a new tab', () => {
    const { container } = render(
      <Contained>
        <a href="#elsewhere">go</a>
      </Contained>,
    )
    const link = container.querySelector('a')

    expect(fireEvent.click(link as Element, { metaKey: true })).toBe(true)
  })

  it('leaves a middle click alone, which opens a tab in every browser', () => {
    const { container } = render(
      <Contained>
        <a href="#elsewhere">go</a>
      </Contained>,
    )
    const link = container.querySelector('a')

    expect(fireEvent.click(link as Element, { button: 1 })).toBe(true)
  })

  it('leaves a click that goes nowhere alone, and the component still sees it', () => {
    const onClick = vi.fn<() => void>()
    const { container } = render(
      <Contained>
        <button onClick={onClick} type="button">
          press
        </button>
      </Contained>,
    )
    const button = container.querySelector('button')

    expect(fireEvent.click(button as Element), 'nothing to prevent').toBe(true)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('stops a form submitting, and the component still receives the event', () => {
    const onSubmit = vi.fn<() => void>()
    const { container } = render(
      <Contained>
        <form onSubmit={onSubmit}>
          <button type="submit">send</button>
        </form>
      </Contained>,
    )

    fireEvent.click(container.querySelector('button') as Element)

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('takes part in no layout, so a story measures what it would without it', () => {
    const { container } = render(
      <Contained>
        <p>a story</p>
      </Contained>,
    )

    expect(container.querySelector('[data-slot="canvas"]')?.getAttribute('style')).toContain(
      'display: contents',
    )
  })
})
