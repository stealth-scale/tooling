import { type ReactNode, useCallback, useState } from 'react'

import { type Meta, type StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'

import { countsEveryCell, mirrors } from './assert.ts'
import { example } from './example.ts'
import { interactive } from './interactive.ts'
import { Mirror } from './mirror.tsx'
import { forcedBy, type State, StateGrid, type StateGridProps, STATES } from './states.tsx'

// The home domain: a design system's own control, drawn in every state it is designed for.
const TONES = ['neutral', 'brand', 'destructive'] as const

// E-commerce. What a basket offers at the last step.
const CHECKOUT = ['Pay with iDEAL', 'Pay with card', 'Save for later'] as const

// Legal and compliance. The consents a data-processing agreement asks for.
const CONSENTS = ['Share usage telemetry', 'Transfer outside the EEA'] as const

// Observability and SRE. What an on-call engineer does with a firing alert.
const ALERTS = ['Acknowledge', 'Escalate to secondary'] as const

/**
 * Carries what the panel edits. `cell` is required on the component and cannot cross the
 * manager channel, so it is optional here and every story writes it in `render`.
 */
type PlaygroundArgs = Omit<StateGridProps<string>, 'cell'> & {
  cell?: (row: string, state: State) => ReactNode
}

const Matrix = StateGrid as (props: PlaygroundArgs) => ReactNode

/**
 * Counts what an engineer acknowledged, and mirrors the count as text under the grid.
 *
 * The count is state, so it needs a component rather than an arrow in `render`. It renders
 * beside the grid so a reader sees at a glance what the play asserts on.
 *
 * @param {StateGridProps<string>} props - The rows to draw. `StateGridProps` documents them.
 * @returns {ReactNode} The grid, and the count under it.
 */
function Escalation({ rows }: Readonly<Omit<StateGridProps<string>, 'cell'>>): ReactNode {
  const [seen, setSeen] = useState(0)
  const cell = useCallback(
    (action: string, state: State): ReactNode => (
      <button
        className="border-border rounded-md border px-3 py-1 text-sm disabled:opacity-50"
        onClick={() => {
          setSeen((was) => was + 1)
        }}
        type="button"
        {...forcedBy(state)}
      >
        {action}
      </button>
    ),
    [],
  )

  return (
    <div className="grid gap-4">
      <Matrix cell={cell} rows={rows} />
      <Mirror of={{ acknowledged: seen }} />
    </div>
  )
}

const meta = {
  argTypes: {
    // A render prop cannot be typed into a field.
    cell: { control: false },
  },
  component: Matrix,
} satisfies Meta<typeof Matrix>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: { rows: [...TONES] },

  play: async ({ args, canvasElement }) => {
    // Fails the day a state stops rendering, whatever rows the panel is set to.
    await countsEveryCell('button', args.rows, STATES)({ canvasElement })
  },

  render: ({ rows }) => (
    <Matrix
      cell={(tone, state) => (
        <button
          className="border-border rounded-md border px-3 py-1 text-sm"
          type="button"
          {...forcedBy(state)}
        >
          {tone}
        </button>
      )}
      rows={rows}
    />
  ),
}

/**
 * Every way a basket's last step can be caught: the three controls against the six states the
 * contract designs for.
 */
export const EveryDesignedStateIsDrawn: Story = {
  ...example,
  args: { rows: [...CHECKOUT] },

  play: async ({ args, canvasElement }) => {
    // A state added to STATES without a way to reach it would leave a hole here.
    await countsEveryCell('button', args.rows, STATES)({ canvasElement })
  },

  render: ({ rows }) => (
    <Matrix
      cell={(label, state) => (
        <button
          className="border-border rounded-md border px-3 py-1 text-sm"
          type="button"
          {...forcedBy(state)}
        >
          {label}
        </button>
      )}
      rows={rows}
    />
  ),
}

/**
 * The consents an agreement asks for, one of them refused. `disabled` and `aria-invalid` are
 * real attributes rather than a class that looks like one, so assistive technology hears what
 * the screenshot shows.
 */
export const StatesAreForcedRatherThanMimed: Story = {
  ...example,
  args: { rows: [...CONSENTS] },

  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const row = canvas.getAllByRole('button', { name: String(args.rows[0]) })

    // A disabled cell is really disabled, not a control greyed out with a class.
    await expect(row[STATES.indexOf('disabled')]).toBeDisabled()
    // And an invalid one carries the attribute a screen reader announces.
    await expect(row[STATES.indexOf('invalid')]).toHaveAttribute('aria-invalid', 'true')
  },

  render: ({ rows }) => (
    <Matrix
      cell={(consent, state) => (
        <button
          className="border-border aria-invalid:border-destructive rounded-md border px-3 py-1 text-sm disabled:opacity-50"
          type="button"
          {...forcedBy(state)}
        >
          {consent}
        </button>
      )}
      rows={rows}
    />
  ),
}

/**
 * What an on-call engineer does with a firing alert, and what happens when they do it. The
 * play drives the grid rather than measuring it, so it is wrapped and stays still on the page.
 */
export const APlayThatDrivesIsWrapped: Story = {
  ...example,
  args: { rows: [...ALERTS] },

  play: interactive(async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const resting = canvas.getAllByRole('button', { name: String(args.rows[0]) })[0]

    await userEvent.click(resting as HTMLElement)

    // Clicking the resting cell reaches the handler; a disabled cell in the same row does not.
    await mirrors({ acknowledged: 1 })({ canvasElement })
  }),

  render: ({ rows }) => <Escalation rows={rows} />,
}
