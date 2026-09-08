import { type ReactNode } from 'react'

import { type Meta, type StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'

import { countsEveryCell } from './assert.ts'
import { example } from './example.ts'
import { type Cell, Grid, type GridProps, Legend } from './grid.tsx'
import { sideOf } from './side.ts'

// The home domain: a design system's own control, which is what a variant matrix is for.
const TONES = ['neutral', 'brand', 'destructive'] as const
const SIZES = ['sm', 'md', 'lg'] as const

// Logistics and freight. Rotterdam's terminal codes against the classes it handles.
const HANDLING = ['dry', 'reefer', 'hazmat'] as const
const CLASSES = ["20' standard", "40' high cube", "45' pallet-wide"] as const

// Energy and utilities. One tariff, several meters: the axis that is one long.
const TARIFF = ['Vastrecht 2026'] as const
const METERS = ['single rate', 'day and night', 'feed-in'] as const

// Healthcare. Triage bands against the wards that hold them, drawn as chips rather than
// controls, because a cell renders whatever the story hands it.
const BANDS = ['immediate', 'urgent', 'standard'] as const
const WARDS = ['Spoedeisende hulp', 'Observatie'] as const

// Energy and utilities again, in Arabic: a substation's crews against the shifts they work.
const CREWS = ['طاقم الصيانة', 'طاقم التحويل'] as const
const SHIFTS = ['صباحي', 'مسائي'] as const

/**
 * Draws one swatch, which carries no role of its own.
 *
 * @param {string} label - What the swatch reads.
 * @returns {ReactNode} The swatch.
 */
function chip(label: string): ReactNode {
  return (
    <span className="bg-muted text-muted-foreground rounded-sm px-2 py-1 text-xs">{label}</span>
  )
}

/**
 * Carries what the panel edits. `cell` is required on the component and cannot cross the
 * manager channel, so it is optional here and every story writes it in `render`.
 */
type PlaygroundArgs = Omit<GridProps<string, string>, 'cell'> & { cell?: Cell<string, string> }

const Matrix = Grid as (props: PlaygroundArgs) => ReactNode

const meta = {
  argTypes: {
    // A render prop cannot be typed into a field.
    cell: { control: false },
  },
  component: Matrix,

  // The legend is the grid's one part. Naming it here is what puts its props table beside the
  // grid's own as a tab rather than leaving it undocumented.
  subcomponents: { Legend },
} satisfies Meta<typeof Matrix>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: { columns: [...SIZES], rows: [...TONES] },

  play: async ({ args, canvasElement }) => {
    // Fails the day a crossing stops rendering, whatever the panel is set to.
    await countsEveryCell('button', args.rows, args.columns)({ canvasElement })
  },

  render: ({ columns, rows }) => (
    <Matrix
      cell={(tone, size) => (
        <button className="border-border rounded-md border px-3 py-1 text-sm" type="button">
          {tone} {size}
        </button>
      )}
      columns={columns}
      rows={rows}
    />
  ),
}

/**
 * Every class the terminal handles, against every handling code, with nothing left to a
 * reader to notice is missing.
 */
export const EveryCrossingIsDrawn: Story = {
  ...example,
  args: { columns: [...HANDLING], rows: [...CLASSES] },

  play: async ({ args, canvasElement }) => {
    // A code added to one axis and not to the cell would leave a hole here.
    await countsEveryCell('button', args.rows, args.columns)({ canvasElement })
  },

  render: ({ columns, rows }) => (
    <Matrix
      cell={(box, handling) => (
        <button className="border-border rounded-md border px-3 py-1 text-sm" type="button">
          {box} · {handling}
        </button>
      )}
      columns={columns}
      rows={rows}
    />
  ),
}

/**
 * A tariff with one row still names itself. An axis of one is where a grid drawn by hand
 * stops labelling, and the reader is left with a column of unexplained cells.
 */
export const AnAxisOfOneStillLabelsBothEdges: Story = {
  ...example,
  args: { columns: [...METERS], rows: [...TARIFF] },

  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    // Both edges carry their legend, however short the axis is.
    await expect(canvas.getByText(String(args.rows[0]))).toBeVisible()
    await Promise.all(args.columns.map((meter) => expect(canvas.getByText(meter)).toBeVisible()))
  },

  render: ({ columns, rows }) => (
    <Matrix
      cell={(tariff, meter) => (
        <span className="text-sm">
          {tariff} — {meter}
        </span>
      )}
      columns={columns}
      rows={rows}
    />
  ),
}

/**
 * Triage bands drawn as chips. A cell is a `ReactNode`, so a matrix of swatches, avatars or
 * plain text needs no wrapper to pretend it is a control.
 */
export const ACellNeedsNoRole: Story = {
  ...example,
  args: { columns: [...WARDS], rows: [...BANDS] },

  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    // A chip has no role, so this is the one query that goes by text rather than by role.
    await expect(canvas.getAllByText(/immediate|urgent|standard/u)).toHaveLength(
      args.rows.length * (args.columns.length + 1),
    )
    // And nothing here invented a control to be queryable.
    await expect(canvas.queryAllByRole('button')).toHaveLength(0)
  },

  render: ({ columns, rows }) => (
    <Matrix cell={(band) => chip(band)} columns={columns} rows={rows} />
  ),
}

/**
 * The same matrix in Arabic, where the row legends move to the right and the columns run the
 * other way. The legend column is the one thing the grid places itself, so it is the thing
 * this measures.
 */
export const TheRowLegendSitsAtTheStart: Story = {
  ...example,
  args: { columns: [...SHIFTS], rows: [...CREWS] },
  globals: { direction: 'rtl', locale: 'ar' },

  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const legend = canvas.getByText(String(args.rows[0]))
    const matrix = legend.parentElement

    // Measured rather than read off a class, and written logically, so the claim is the one
    // the left-to-right stories above make and this story mirrors.
    await expect(sideOf(legend, matrix as HTMLElement)).toBe('start')
  },

  render: ({ columns, rows }) => (
    <Matrix
      cell={(crew, shift) => (
        <button className="border-border rounded-md border px-3 py-1 text-sm" type="button">
          {crew} · {shift}
        </button>
      )}
      columns={columns}
      rows={rows}
    />
  ),
}
