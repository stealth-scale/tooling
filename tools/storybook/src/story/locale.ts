/**
 * @fileoverview Reads the language a story is drawn in off the context Storybook hands it, so
 * a story's fixtures speak the language its chrome does.
 */

/**
 * Names what a story or a decorator is told about the toolbars.
 */
export interface StoryContext {
  /**
   * Carries the values the toolbars are on.
   */
  globals: Readonly<Record<string, unknown>>

  /**
   * Carries the values this story pinned for itself, which win over the toolbars.
   */
  storyGlobals?: Readonly<Record<string, unknown>>
}

/**
 * Names the locale a story is drawn in.
 *
 * @param {StoryContext} context - The context Storybook hands a story or a decorator.
 * @returns {string | undefined} The tag the toolbar is on, or nothing where it says nothing.
 */
export function localeOf(context: StoryContext): string | undefined {
  const chosen = { ...context.globals, ...context.storyGlobals }['locale']
  return typeof chosen === 'string' && chosen !== '' ? chosen : undefined
}
