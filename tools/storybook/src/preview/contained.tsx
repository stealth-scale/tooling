/**
 * @fileoverview Keeps a story inside Storybook, and draws it in the appearance it asked for.
 * A component that links somewhere or submits a form is doing its job, and in Storybook that
 * job would take the reader off the page they were reading. Both are stopped in the capture
 * phase, so the component still sees the event and still reports it in the actions panel.
 */

import { type JSX, type MouseEvent, type ReactNode, type SyntheticEvent } from 'react'

import { type Appearance, ATTRIBUTES, MODE_CLASS } from '@stealthscale/core-appearance'

/**
 * Describes what wraps one story.
 */
export interface ContainedProps {
  /**
   * Carries the appearance this story is drawn in, which is the toolbars' with whatever the
   * story pinned for itself on top.
   */
  appearance: Appearance

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
 * Draws a story, in the appearance it asked for, and keeps it where it is.
 *
 * The appearance is written here as well as on the document, because a story may pin values of
 * its own and the document cannot hold them: a documentation page draws several stories at
 * once, and one of them asking for Arabic cannot turn the page around it. Written on the
 * story's own wrapper each is scoped to the story that asked, and the theme, the density and
 * the reduced-motion rules all read a descendant as readily as the root.
 *
 * The wrapper is `display: contents`, so it takes part in no layout: a story measuring its own
 * geometry measures what it would without this. Inheritance is untouched by that, which is
 * what lets `dir` and the tokens reach the story from here.
 *
 * @param {ContainedProps} props - The appearance and the story to draw. `ContainedProps`
 *     documents every member.
 * @returns {JSX.Element} The story, in its appearance, wrapped in something that catches what
 *     would leave.
 */
export function Contained({ appearance, children }: ContainedProps): JSX.Element {
  return (
    <div
      className={appearance.mode === 'dark' ? MODE_CLASS : undefined}
      data-slot="canvas"
      dir={appearance.direction}
      lang={appearance.locale}
      onClickCapture={(event) => {
        if (navigates(event)) contain(event)
      }}
      onSubmitCapture={contain}
      style={{ display: 'contents' }}
      {...{
        [ATTRIBUTES.density]: appearance.density,
        [ATTRIBUTES.theme]: appearance.theme,
        ...(appearance.reducedMotion ? { [ATTRIBUTES.reducedMotion]: '' } : {}),
      }}
    >
      {children}
    </div>
  )
}
