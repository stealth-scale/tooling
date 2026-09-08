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

/**
 * Holds what the running preview knows. The preview writes it; a docs container and the
 * blocks on a page read it.
 */
export const preview: PreviewStore = previewStore()

/**
 * Returns what the preview knows, and re-renders the caller when it changes.
 *
 * @returns {PreviewState | undefined} The appearance and the themes, or nothing where no
 *     preview has written them, which is the case in a specification that has not.
 */
export function usePreview(): PreviewState | undefined {
  return useSyncExternalStore(preview.subscribe, preview.get, preview.get)
}
