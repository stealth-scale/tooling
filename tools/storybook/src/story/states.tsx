/**
 * @fileoverview Names the interaction states a control is designed for, says how each one is
 * reached, and draws every row against all of them.
 */

import { type JSX, type ReactNode } from 'react'

import { Grid } from './grid.tsx'

/**
 * Lists the interaction states a control is designed for, in the order a grid draws them.
 */
export const STATES = ['rest', 'hover', 'focus-visible', 'active', 'disabled', 'invalid'] as const

/**
 * Names one of the designed states.
 */
export type State = (typeof STATES)[number]

/**
 * Describes the props that put a component into one of the designed states.
 */
export interface Forced {
  /**
   * Marks the control invalid. It is the attribute the recipes style on and the one
   * assistive technology reads, so a red ring nothing announces stays impossible.
   */
  'aria-invalid'?: boolean | undefined

  /**
   * Names the class a pseudo-state addon rewrites into the matching pseudo-class.
   */
  className?: string | undefined

  /**
   * Disables the control.
   */
  disabled?: boolean | undefined
}

/**
 * Maps each state to the props that reach it.
 *
 * Three states are reached by a prop and hold on their own. The other three are reached by a
 * class, which does nothing until a pseudo-state addon rewrites it: a cursor cannot be held
 * still for a screenshot and a class can. `storybookConfig`'s `addons` is where a repository
 * adds that addon.
 *
 * Total over `State`, so a state added to the list without a way to reach it is a type error.
 */
const FORCED: Readonly<Record<State, Forced>> = {
  active: { className: 'pseudo-active' },
  disabled: { disabled: true },
  'focus-visible': { className: 'pseudo-focus-visible' },
  hover: { className: 'pseudo-hover' },
  invalid: { 'aria-invalid': true },
  rest: {},
}

/**
 * Reads the props that force one state.
 *
 * @param {State} state - The state to force.
 * @returns {Forced} The props to spread onto the component. Empty for `rest`.
 */
export function forcedBy(state: State): Forced {
  return FORCED[state]
}

/**
 * Describes a states matrix: the rows to draw, and what to draw in each state.
 *
 * @template Row - The row axis, a union of the names it holds.
 */
export interface StateGridProps<Row extends string> {
  /**
   * Draws one row in one state.
   */
  cell: (row: Row, state: State) => ReactNode

  /**
   * Lists the row axis, in the order it is drawn.
   */
  rows: ReadonlyArray<Row>
}

/**
 * Draws every row against every designed state.
 *
 * The states are forced rather than mimed with a pointer, which is the only way they reach a
 * visual-regression baseline. `forcedBy` says how each one is reached, so a story spreads it
 * and never learns the addon's class names.
 *
 * @template Row - The row axis, a union of the names it holds.
 * @param {StateGridProps<Row>} props - The props. `StateGridProps` documents every member.
 * @returns {JSX.Element} Every row against every state, labelled on both edges.
 */
export function StateGrid<Row extends string>({ cell, rows }: StateGridProps<Row>): JSX.Element {
  return <Grid cell={cell} columns={STATES} rows={rows} />
}
