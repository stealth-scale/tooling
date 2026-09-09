import { type MouseEvent, type ReactNode } from 'react'

import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vite-plus/test'

import { type Appearance } from '@stealthscale/core-appearance'

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

/** The appearance a story is drawn in, where the case is about something else. */
const DRAWN: Appearance = {
  density: 'comfortable',
  direction: 'ltr',
  locale: 'en',
  mode: 'light',
  reducedMotion: false,
  theme: 'base',
}

/**
 * Draws a story in one appearance and answers the wrapper it was given.
 *
 * @param {ReactNode} children - The story to draw.
 * @param {Partial<Appearance>} [pinned] - What the story pinned for itself. Default: nothing.
 * @returns {{ canvas: HTMLElement | null; container: HTMLElement }} The wrapper and the tree.
 */
function drawn(
  children: ReactNode,
  pinned: Partial<Appearance> = {},
): { canvas: HTMLElement | null; container: HTMLElement } {
  const { container } = render(
    <Contained appearance={{ ...DRAWN, ...pinned }}>{children}</Contained>,
  )

  return { canvas: container.querySelector<HTMLElement>('[data-slot="canvas"]'), container }
}

describe('navigates', () => {
  it('says nothing navigates when the click landed on no element at all', () => {
    expect(navigates(clickOn(null))).toBe(false)
    expect(navigates(clickOn({ closest: () => null }))).toBe(false)
  })
})

describe('Contained', () => {
  it('stops a plain click on a link, so a story cannot take the reader off the page', () => {
    const { container } = drawn(<a href="/elsewhere">go</a>)
    const link = container.querySelector('a')

    expect(fireEvent.click(link as Element), 'the default was prevented').toBe(false)
  })

  // These two let the click through, which is the point of them. The href is a fragment so
  // that jsdom has somewhere to go it implements: a path would make it report a navigation it
  // cannot perform, on every run, for a case that is passing.
  it('leaves a modified click alone, which is somebody asking for a new tab', () => {
    const { container } = drawn(<a href="#elsewhere">go</a>)
    const link = container.querySelector('a')

    expect(fireEvent.click(link as Element, { metaKey: true })).toBe(true)
  })

  it('leaves a middle click alone, which opens a tab in every browser', () => {
    const { container } = drawn(<a href="#elsewhere">go</a>)
    const link = container.querySelector('a')

    expect(fireEvent.click(link as Element, { button: 1 })).toBe(true)
  })

  it('leaves a click that goes nowhere alone, and the component still sees it', () => {
    const onClick = vi.fn<() => void>()
    const { container } = drawn(
      <button onClick={onClick} type="button">
        press
      </button>,
    )
    const button = container.querySelector('button')

    expect(fireEvent.click(button as Element), 'nothing to prevent').toBe(true)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('stops a form submitting, and the component still receives the event', () => {
    const onSubmit = vi.fn<() => void>()
    const { container } = drawn(
      <form onSubmit={onSubmit}>
        <button type="submit">send</button>
      </form>,
    )

    fireEvent.click(container.querySelector('button') as Element)

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('takes part in no layout, so a story measures what it would without it', () => {
    const { canvas } = drawn(<p>a story</p>)

    expect(canvas?.getAttribute('style')).toContain('display: contents')
  })

  it('writes the appearance on the story rather than only on the document', () => {
    const { canvas } = drawn(<p>a story</p>)

    // The document carries these too, but a documentation page draws several stories at once
    // and cannot carry one story's own.
    expect(canvas?.getAttribute('dir')).toBe('ltr')
    expect(canvas?.getAttribute('lang')).toBe('en')
    expect(canvas?.dataset['theme']).toBe('base')
    expect(canvas?.dataset['density']).toBe('comfortable')
  })

  it('turns one story around without turning the page around it', () => {
    const { canvas } = drawn(<p>قصة</p>, { direction: 'rtl', locale: 'ar' })

    expect(canvas?.getAttribute('dir')).toBe('rtl')
    expect(canvas?.getAttribute('lang')).toBe('ar')
    expect(document.documentElement.getAttribute('dir'), 'the page is untouched').toBeNull()
  })

  it('marks the mode with the class the dark variant keys off', () => {
    expect(drawn(<p>a story</p>, { mode: 'dark' }).canvas?.className).toBe('dark')
    expect(drawn(<p>a story</p>).canvas?.className).toBe('')
  })

  it('marks reduced motion only when it was asked for, since the rules match on presence', () => {
    expect(drawn(<p>a story</p>, { reducedMotion: true }).canvas?.dataset['reducedMotion']).toBe('')
    expect(drawn(<p>a story</p>).canvas?.dataset['reducedMotion']).toBeUndefined()
  })
})
