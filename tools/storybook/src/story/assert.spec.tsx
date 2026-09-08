import { render } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { countsEveryCell, mirrors } from './assert.ts'
import { Mirror } from './mirror.tsx'

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

/**
 * Draws a mirror holding the given values and answers the element holding it.
 *
 * @param {Readonly<Record<string, boolean | number | string>>} of - What the story holds.
 * @returns {HTMLElement} The canvas element.
 */
function mirroring(of: Readonly<Record<string, boolean | number | string>>): HTMLElement {
  return render(
    <div>
      <Mirror of={of} />
    </div>,
  ).container
}

describe('mirrors', () => {
  it('passes when the mirror shows what the story says it is holding', async () => {
    const play = mirrors({ acknowledged: 2, open: true })

    await expect(
      play({ canvasElement: mirroring({ acknowledged: 2, open: true }) }),
    ).resolves.toBeUndefined()
  })

  it('fails when the mirror stopped following the state', async () => {
    const play = mirrors({ acknowledged: 2 })

    await expect(play({ canvasElement: mirroring({ acknowledged: 1 }) })).rejects.toThrow(
      /acknowledged/u,
    )
  })

  it('fails when the story never drew the name it asserts on', async () => {
    const play = mirrors({ missing: 'anything' })

    await expect(play({ canvasElement: mirroring({ open: true }) })).rejects.toThrow(/missing/u)
  })

  it('reads only the names it was given, so a mirror may hold more than one claim', async () => {
    const play = mirrors({ open: false })

    await expect(
      play({ canvasElement: mirroring({ chosen: 'Antwerpen', open: false }) }),
    ).resolves.toBeUndefined()
  })
})
