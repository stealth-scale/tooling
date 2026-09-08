/**
 * @fileoverview Draws the matrix a variant story shows: two axes, labelled on both edges,
 * with the axes passed in so the grid is the recipe rather than a copy of it.
 */

import { Fragment, type JSX, type ReactNode } from 'react'

/**
 * Names what a matrix cell renders: one value from each axis.
 *
 * @template Row - The row axis, a union of the names it holds.
 * @template Column - The column axis, a union of the names it holds.
 */
export type Cell<Row extends string, Column extends string> = (
  row: Row,
  column: Column,
) => ReactNode

/**
 * Describes a matrix: two axes, and what to draw at each crossing.
 *
 * @template Row - The row axis, a union of the names it holds.
 * @template Column - The column axis, a union of the names it holds.
 */
export interface GridProps<Row extends string, Column extends string> {
  /**
   * Draws one crossing of the two axes.
   */
  cell: Cell<Row, Column>

  /**
   * Lists the column axis, in the order it is drawn.
   */
  columns: readonly Column[]

  /**
   * Lists the row axis, in the order it is drawn.
   */
  rows: readonly Row[]
}

/**
 * Describes the props of {@link Legend}.
 */
interface LegendProps {
  /**
   * Names the axis value this legend labels.
   */
  children: string
}

/**
 * Draws a column or row header. It is presentational, which is as much as the kit is allowed
 * to be: a legend that carried meaning would be a component the design system owes a page.
 *
 * @param {LegendProps} props - The props. `LegendProps` documents every member.
 * @returns {JSX.Element} The label.
 */
function Legend({ children }: Readonly<LegendProps>): JSX.Element {
  return <span className="text-muted-foreground text-xs whitespace-nowrap">{children}</span>
}

/**
 * Draws every row against every column, labelled on both axes.
 *
 * A story that draws its own grid drifts: a variant added to the recipe is not added to the
 * grid, and the screenshot suite never sees it. The axes are passed in, so a story derives
 * them from the component and the grid cannot fall behind.
 *
 * @template Row - The row axis, a union of the names it holds.
 * @template Column - The column axis, a union of the names it holds.
 * @param {GridProps<Row, Column>} props - The props. `GridProps` documents every member.
 * @returns {JSX.Element} Every crossing of the two axes, labelled on both edges.
 */
export function Grid<Row extends string, Column extends string>({
  cell,
  columns,
  rows,
}: Readonly<GridProps<Row, Column>>): JSX.Element {
  return (
    <div
      className="grid w-fit items-center justify-items-start gap-x-8 gap-y-3"
      style={{ gridTemplateColumns: `auto repeat(${String(columns.length)}, max-content)` }}
    >
      <span />
      {columns.map((column) => (
        <Legend key={column}>{column}</Legend>
      ))}
      {rows.map((row) => (
        <Fragment key={row}>
          <Legend>{row}</Legend>
          {columns.map((column) => (
            <Fragment key={column}>{cell(row, column)}</Fragment>
          ))}
        </Fragment>
      ))}
    </div>
  )
}
