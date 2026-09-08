import { type Meta, type StoryObj } from '@storybook/react-vite'

import { example } from './example.ts'
import { Grid } from './grid.tsx'

const SIZES = ['small', 'medium', 'large'] as const
const TONES = ['neutral', 'accent'] as const

const meta = {
  component: Grid,
} satisfies Meta<typeof Grid<string, string>>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    cell: (row, column) => `${row} / ${column}`,
    columns: [...TONES],
    rows: [...SIZES],
  },
}

export const EveryCrossingIsDrawn: Story = {
  ...example,
  args: {
    cell: (row, column) => `${row} on ${column}`,
    columns: [...TONES],
    rows: [...SIZES],
  },
}
