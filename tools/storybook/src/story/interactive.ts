/**
 * @fileoverview Separates a story being tested from a story being looked at, so a play
 * function that drives a component does not thrash it on the page.
 */

/**
 * Names a play function, whatever context the renderer hands it.
 *
 * @template Context - What the renderer passes a play function.
 */
export type Play<Context> = (context: Context) => Promise<void> | void

/**
 * Returns `true` when the test runner is watching rather than a person.
 *
 * The Vitest browser runner sets this on the window before it composes a story, and the
 * Storybook never does. That is the one honest difference between the two.
 *
 * @returns {boolean} `true` under the test run, and `false` in Storybook.
 */
export function underTest(): boolean {
  return Reflect.get(globalThis, '__vitest_browser__') === true
}

/**
 * Wraps a play function so it runs under the test run and stays still in Storybook.
 *
 * Storybook plays every story it renders, and the `autoplay` flag it exposes governs
 * documentation pages, where play is already off. That suits a play function that measures
 * something. It ruins one that drives the component: opening six sheets in turn is a test,
 * and on the page it is a component thrashing itself the moment anybody looks at it.
 *
 * A play function that asserts what is already on screen, a count or a measured position or
 * an attribute, is left unwrapped. It costs nothing to run and it is the fastest way to
 * notice that the scene has broken.
 *
 * @template Context - What the renderer passes a play function.
 * @param {Play<Context>} play - The play function to wrap. It drives the story and asserts
 *     on what it did.
 * @returns {Play<Context>} The same function, inert outside the test run.
 */
export function interactive<Context>(play: Play<Context>): Play<Context> {
  return async (context: Context) => {
    if (!underTest()) return
    await play(context)
  }
}
