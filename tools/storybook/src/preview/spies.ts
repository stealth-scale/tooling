/**
 * @fileoverview Fills in a spy for every handler a component takes and a story did not set,
 * so the actions panel is loud without a story writing `fn()` per prop. A story that wants to
 * assert on a handler still passes its own; this only fills what was left out.
 */

import { fn } from 'storybook/test'

/**
 * Matches a prop that is a handler: `on` followed by a capital.
 */
const HANDLER = /^on[A-Z]/u

/**
 * Names what a story is told about the component it draws, in what this reads.
 */
export interface Enhanced {
  /**
   * Names every prop the component documents, which is what the props table was built from.
   */
  argTypes: Readonly<Record<string, unknown>>

  /**
   * Carries what the story set itself.
   */
  initialArgs: Readonly<Record<string, unknown>>
}

/**
 * Names what a spy is built with, which is Storybook's own so the panel records it.
 */
export type Spy = (name: string) => unknown

/**
 * Builds a spy for every handler the component documents and the story left out.
 *
 * @param {Enhanced} context - The props the component documents and the ones the story set.
 * @param {Spy} spy - Builds one named spy.
 * @returns {Record<string, unknown>} One entry per handler filled in. It is empty where the
 *     story set them all, which is what a story asserting on a handler does.
 */
export function seededSpies(context: Enhanced, spy: Spy): Record<string, unknown> {
  const seeded: Record<string, unknown> = {}

  for (const name of Object.keys(context.argTypes)) {
    if (HANDLER.test(name) && context.initialArgs[name] === undefined) seeded[name] = spy(name)
  }

  return seeded
}

/**
 * Fills in Storybook's own spy for every handler the story left out, named after the prop so
 * the actions panel says which one fired.
 *
 * @param {Enhanced} context - The props the component documents and the ones the story set.
 * @returns {Record<string, unknown>} The handlers filled in.
 */
export function seedSpies(context: Enhanced): Record<string, unknown> {
  return seededSpies(context, (name) => fn().mockName(name))
}
