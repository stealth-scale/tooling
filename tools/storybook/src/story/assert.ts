/**
 * @fileoverview Holds the assertions a story plays, kept out of the render modules so a
 * canvas does not pull the test library into its bundle.
 */

import { expect, within } from 'storybook/test'

import { type Mirrored } from './mirror.tsx'

/**
 * Describes what a play function is handed about the canvas it is asserting on.
 */
export interface Canvas {
  /**
   * Holds the element the story rendered into.
   */
  canvasElement: HTMLElement
}

/**
 * Builds the assertion that fails the day a variant reaches the recipe and not the grid.
 *
 * A documented variant with no cell has no screenshot, and nothing else notices. Counting the
 * cells against the two axes is the cheapest way to catch it.
 *
 * @param {string} role - The role every cell renders.
 * @param {readonly string[]} rows - One axis.
 * @param {readonly string[]} columns - The other axis.
 * @returns {(canvas: Canvas) => Promise<void>} A play function that counts the cells.
 */
export function countsEveryCell(
  role: string,
  rows: readonly string[],
  columns: readonly string[],
): (canvas: Canvas) => Promise<void> {
  return async ({ canvasElement }: Canvas): Promise<void> => {
    await expect(within(canvasElement).getAllByRole(role)).toHaveLength(
      rows.length * columns.length,
    )
  }
}

/**
 * Builds the assertion that the state the story is holding is the state it says it is.
 *
 * The values are read off the `Mirror` the story drew rather than out of the component, so
 * what the play checks is what a reader sees, and a mirror that stopped updating fails here
 * rather than going quiet.
 *
 * @param {Readonly<Record<string, Mirrored>>} values - Each name mapped to what the story
 *     should be holding under it.
 * @returns {(canvas: Canvas) => Promise<void>} A play function that reads the mirror.
 */
export function mirrors(
  values: Readonly<Record<string, Mirrored>>,
): (canvas: Canvas) => Promise<void> {
  return async ({ canvasElement }: Canvas): Promise<void> => {
    const read = Object.keys(values).map((name) => [
      name,
      canvasElement.querySelector(`[data-mirror='${name}'] dd`)?.textContent,
    ])

    await expect(Object.fromEntries(read)).toEqual(
      Object.fromEntries(Object.entries(values).map(([name, value]) => [name, String(value)])),
    )
  }
}
