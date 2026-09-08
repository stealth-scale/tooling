import { render } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { countsEveryCell } from './assert.ts'

const TONES = ['neutral', 'accent'] as const
const SIZES = ['small', 'medium', 'large'] as const

/**
 * Draws the given number of buttons and answers the element holding them.
 *
 * @param {number} count - How many buttons the canvas draws.
 * @returns {HTMLElement} The canvas element.
 */
function canvasOf(count: number): HTMLElement {
  const { container } = render(
    <div>
      {Array.from({ length: count }, (_, index) => (
        <button key={index} type="button">
          {index}
        </button>
      ))}
    </div>,
  )

  return container
}

describe('countsEveryCell', () => {
  it('passes when every crossing drew a cell', async () => {
    const play = countsEveryCell('button', TONES, SIZES)

    await expect(
      play({ canvasElement: canvasOf(TONES.length * SIZES.length) }),
    ).resolves.toBeUndefined()
  })

  it('fails when a variant reached the recipe and not the grid', async () => {
    const play = countsEveryCell('button', TONES, SIZES)

    await expect(
      play({ canvasElement: canvasOf(TONES.length * SIZES.length - 1) }),
    ).rejects.toThrow(/length/iu)
  })

  it('counts the role it was given, not every element on the canvas', async () => {
    const play = countsEveryCell('checkbox', TONES, SIZES)

    await expect(play({ canvasElement: canvasOf(6) })).rejects.toThrow(/unable to find/iu)
  })
})
