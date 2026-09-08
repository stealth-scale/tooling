/**
 * @fileoverview Holds the one spread that turns a story into an example: out of the sidebar,
 * controls off, padded.
 */

/**
 * Holds what an example story is, as one spread.
 *
 * An example is documentation and a test rather than a playground. It leaves the sidebar
 * under `!dev`, its controls are off because its props are the point rather than something to
 * fiddle with, and it is padded rather than centred because a grid has no centre worth
 * finding.
 */
export const example = {
  parameters: { controls: { disable: true }, layout: 'padded' },

  // Storybook types `tags` as a mutable `string[]`, so a readonly tuple spread into a story
  // fails to assign.
  tags: ['!dev'],
}
