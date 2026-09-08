/**
 * @fileoverview Keeps the document, the store and the frame around a story on the appearance
 * the toolbars are on. The preview builds one follower from what the workspace registered and
 * registers it on the channel for every event that moves a toolbar.
 */

import { applyToDocument, type Offered, type Root } from '@stealthscale/core-appearance'

import { appearanceFrom, type Themes } from './appearance.ts'
import { CHROME_EVENT, chromeFor } from './chrome.ts'
import { type PreviewStore } from './store.ts'

/**
 * Names what the channel carries when the toolbars move.
 */
export interface GlobalsChanged {
  /**
   * Carries the values every toolbar is on.
   */
  globals: Record<string, unknown>
}

/**
 * Describes the channel the frame around a story listens on, in the one member a follower
 * uses. Storybook's channel satisfies it.
 */
export interface Frame {
  /**
   * Sends an event to the frame, with what it carries.
   *
   * @param {string} event - The event's name.
   * @param {unknown} payload - What the event carries.
   */
  emit: (event: string, payload: unknown) => void
}

/**
 * Describes what a follower writes to and reads from.
 */
export interface Followed {
  /**
   * Carries the channel the frame around a story listens on.
   */
  frame: Frame

  /**
   * Carries the offer the workspace registered, which bounds every toolbar.
   */
  offered: Offered

  /**
   * Carries the document root the appearance is written on.
   */
  root: Root

  /**
   * Carries the store everything drawn inside the document reads.
   */
  store: PreviewStore

  /**
   * Carries every theme the workspace registered, solved.
   */
  themes: Themes
}

/**
 * Builds the function that writes the appearance the toolbars are on onto the document, tells
 * everything drawn inside it, and tells the frame around the story to draw itself the same way.
 *
 * A docs page draws several stories at once and has no story view of its own, so the document
 * follows the toolbars rather than any one story.
 *
 * @param {Followed} into - The root, the store and the frame the follower writes to, and the
 *     offer and the themes it reads. `Followed` documents every member.
 * @returns {(changed: GlobalsChanged) => void} The function to register on the channel.
 */
export function follower(into: Followed): (changed: GlobalsChanged) => void {
  /**
   * Follows one move of the toolbars.
   *
   * @param {GlobalsChanged} changed - The values the channel reported.
   */
  return ({ globals }: GlobalsChanged): void => {
    const appearance = appearanceFrom(globals, into.offered)

    applyToDocument(appearance, into.root)
    into.store.set({ appearance, themes: into.themes })
    into.frame.emit(CHROME_EVENT, chromeFor(appearance, into.themes))
  }
}
