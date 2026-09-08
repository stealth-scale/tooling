/**
 * @fileoverview Keeps a story inside Storybook. A component that links somewhere or
 * submits a form is doing its job, and in Storybook that job would take the reader off the
 * page they were reading. Both are stopped in the capture phase, so the component still sees
 * the event and still reports it in the actions panel.
 */

import { type JSX, type MouseEvent, type ReactNode, type SyntheticEvent } from 'react'

/**
 * Describes what wraps one story.
 */
export interface ContainedProps {
  /**
   * Carries the story being drawn.
   */
  children: ReactNode
}

/**
 * Returns `true` when a click would take the reader off the page.
 *
 * A modified click is left alone: somebody holding a key is asking for a new tab or a
 * download on purpose, and Storybook has no business refusing that.
 *
 * @param {MouseEvent} event - The click, caught on the way down.
 * @returns {boolean} `true` for a plain click on an anchor that has somewhere to go.
 */
export function navigates(event: MouseEvent): boolean {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) {
    return false
  }

  const target: unknown = event.target
  if (!(target instanceof Element)) return false

  const anchor = target.closest('a')
  return anchor !== null && anchor.getAttribute('href') !== null
}

/**
 * Stops an event without keeping it from the component that raised it.
 *
 * @param {SyntheticEvent} event - The event, caught on the way down.
 */
export function contain(event: SyntheticEvent): void {
  event.preventDefault()
}

/**
 * Draws a story and keeps it where it is.
 *
 * The wrapper is `display: contents`, so it takes part in no layout: a story measuring its own
 * geometry measures what it would without this.
 *
 * @param {ContainedProps} props - The story to draw. `ContainedProps` documents every member.
 * @returns {JSX.Element} The story, wrapped in something that catches what would leave.
 */
export function Contained({ children }: Readonly<ContainedProps>): JSX.Element {
  return (
    <div
      data-slot="canvas"
      onClickCapture={(event) => {
        if (navigates(event)) contain(event)
      }}
      onSubmitCapture={contain}
      style={{ display: 'contents' }}
    >
      {children}
    </div>
  )
}
