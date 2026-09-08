/**
 * @fileoverview Holds what the preview knows about the document it draws in, for everything
 * that renders inside it and cannot be handed a prop: the docs container around a page, and
 * the blocks a page places. The preview is the only writer, on boot and on every toolbar
 * change; the readers subscribe and re-render.
 */

import { useSyncExternalStore } from 'react'

import { type Appearance } from '@stealthscale/core-appearance'

import { type Themes } from './appearance.ts'

/**
 * Describes what the preview knows: the appearance the document is drawn in, and every
 * theme it can be drawn in.
 */
export interface PreviewState {
  /**
   * Carries the appearance the toolbars settled on.
   */
  appearance: Appearance

  /**
   * Carries every theme the workspace registered, solved.
   */
  themes: Themes
}

/**
 * Describes the store: one value, one writer, any number of readers.
 */
export interface PreviewStore {
  /**
   * Reads the current value, or nothing before the preview has written one.
   *
   * @returns {PreviewState | undefined} The value last written.
   */
  get: () => PreviewState | undefined

  /**
   * Writes a new value and tells every subscriber.
   *
   * @param {PreviewState} next - The value to hold from now on.
   */
  set: (next: PreviewState) => void

  /**
   * Registers a listener called after every write.
   *
   * @param {() => void} listener - The function to call after each write.
   * @returns {() => void} Unregisters the listener.
   */
  subscribe: (listener: () => void) => () => void
}

/**
 * Builds a store holding nothing yet.
 *
 * @returns {PreviewStore} A store with no value written, and no subscriber.
 */
export function previewStore(): PreviewStore {
  const listeners = new Set<() => void>()
  let current: PreviewState | undefined

  return {
    /**
     * Reads the current value.
     *
     * @returns {PreviewState | undefined} The value last written.
     */
    get: () => current,

    /**
     * Writes a new value and tells every subscriber.
     *
     * @param {PreviewState} next - The value to hold from now on.
     */
    set: (next) => {
      current = next
      for (const listener of listeners) listener()
    },

    /**
     * Registers a listener called after every write.
     *
     * @param {() => void} listener - The function to call after each write.
     * @returns {() => void} Unregisters the listener.
     */
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

declare global {
  /**
   * Holds the one store a document has, so two copies of this module share one value.
   */
  // eslint-disable-next-line no-var -- a global is declared with `var` and TypeScript takes no other form
  var stealthPreviewStore: PreviewStore | undefined
}

/**
 * Describes what holds the one store, which in a document is the global object.
 */
export interface Holder {
  /**
   * Carries the store, once something has asked for it.
   */
  stealthPreviewStore?: PreviewStore | undefined
}

/**
 * Returns the store the document already has, and builds it on the first ask.
 *
 * A document can load this module twice. Storybook's builder imports the preview by its path,
 * read in Node with the repository's source condition off, while a page imports this package
 * by name and Vite resolves it with the condition on: the first reaches `dist` and the second
 * `src`. Each copy would hold a store of its own, and the one a page reads is the one the
 * preview never writes, so every block on the page reports that no theme is registered. The
 * value sits on the global object instead, which both copies share.
 *
 * @param {Holder} holder - Where the store is kept, which is `globalThis` in a document.
 * @returns {PreviewStore} The store the holder carries, kept there for the next caller.
 */
export function sharedStore(holder: Holder): PreviewStore {
  const existing = holder.stealthPreviewStore
  if (existing !== undefined) return existing

  const store = previewStore()
  holder.stealthPreviewStore = store
  return store
}

/**
 * Holds what the running preview knows. The preview writes it; a docs container and the
 * blocks on a page read it.
 */
export const preview: PreviewStore = sharedStore(globalThis)

/**
 * Returns what the preview knows, and re-renders the caller when it changes.
 *
 * @returns {PreviewState | undefined} The appearance and the themes, or nothing where no
 *     preview has written them, which is the case in a specification that has not.
 */
export function usePreview(): PreviewState | undefined {
  return useSyncExternalStore(preview.subscribe, preview.get, preview.get)
}
