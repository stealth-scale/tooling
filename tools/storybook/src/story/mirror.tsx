/**
 * @fileoverview Draws the state a story is holding as text under the component, so a play
 * asserts what a reader can already see. A play that reaches into a component for its state
 * asserts something nobody looking at the page can check, and a reader left to infer the
 * state from the rendering is reading the thing under test to find out what it did.
 */

import { type JSX } from 'react'

/**
 * Names what a mirror shows: a value a play compares as text.
 */
export type Mirrored = boolean | number | string

/**
 * Describes what the mirror is holding up.
 */
export interface MirrorProps {
  /**
   * Maps each name to the value the story holds under it. The names are the story's own, and
   * a play reads a value back by the same name.
   *
   * @category Content
   */
  of: Readonly<Record<string, Mirrored>>
}

/**
 * Draws each name and the value the story holds under it.
 *
 * It is a description list rather than a table, because that is what a name against a value
 * is, and it carries no role of its own: a mirror is the story's scaffolding rather than part
 * of the component, and announcing it would put a reading of the state into the page a
 * component's own output is measured in.
 *
 * @param {MirrorProps} props - The props. `MirrorProps` documents every member.
 * @returns {JSX.Element} One row per name, in the order they were given.
 */
export function Mirror({ of }: MirrorProps): JSX.Element {
  return (
    <dl className="text-muted-foreground grid w-fit gap-x-3 text-xs" data-slot="mirror">
      {Object.entries(of).map(([name, value]) => (
        <div className="flex gap-2" data-mirror={name} key={name}>
          <dt>{name}</dt>
          <dd className="text-foreground font-medium">{String(value)}</dd>
        </div>
      ))}
    </dl>
  )
}
