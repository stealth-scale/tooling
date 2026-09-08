/**
 * @fileoverview Holds the assertions a grid story plays, kept out of the render modules so a
 * canvas does not pull the test library into its bundle.
 */

import { expect, within } from 'storybook/test'

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
