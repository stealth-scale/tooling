/**
 * @fileoverview Holds the one spread that turns a story into an example: controls off,
 * padded.
 */

/**
 * Holds what an example story is, as one spread.
 *
 * An example is documentation and a test rather than a playground. Its controls are off
 * because its props are the point rather than something to fiddle with, and it is padded
 * rather than centred because a grid has no centre worth finding. It stays out of the
 * sidebar because it is not the Playground, which the kit's indexer decides from the
 * export's name; nothing here has to say so, and nothing here could, since Storybook reads a
 * story file without evaluating it.
 */
export const example = {
  parameters: { controls: { disable: true }, layout: 'padded' },
}
