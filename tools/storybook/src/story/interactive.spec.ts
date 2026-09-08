import { afterEach, describe, expect, it, vi } from 'vite-plus/test'

import { interactive, underTest } from './interactive.ts'

const FLAG = '__vitest_browser__'

afterEach(() => {
  Reflect.deleteProperty(globalThis, FLAG)
})

/**
 * Claims the browser runner is composing the story.
 *
 * @param {boolean} watching - Whether the runner is watching.
 */
function runnerIs(watching: boolean): void {
  Reflect.set(globalThis, FLAG, watching)
}

describe('underTest', () => {
  it('answers false in the catalogue, which sets no flag', () => {
    expect(underTest()).toBe(false)
  })

  it('answers true when the browser runner set its flag', () => {
    runnerIs(true)

    expect(underTest()).toBe(true)
  })

  it('answers false for a flag set to anything but true', () => {
    Reflect.set(globalThis, FLAG, 'yes')

    expect(underTest()).toBe(false)
  })
})

describe('interactive', () => {
  it('drives the story under the test run', async () => {
    const play = vi.fn<(context: unknown) => void>()
    runnerIs(true)

    await interactive(play)({})

    expect(play).toHaveBeenCalledTimes(1)
  })

  it('leaves the story still in the catalogue, so it does not thrash on the page', async () => {
    const play = vi.fn<(context: unknown) => void>()

    await interactive(play)({})

    expect(play).not.toHaveBeenCalled()
  })

  it('hands the play function the context it was called with', async () => {
    const play = vi.fn<(context: unknown) => void>()
    runnerIs(true)

    await interactive(play)({ canvasElement: 'the canvas' })

    expect(play).toHaveBeenCalledWith({ canvasElement: 'the canvas' })
  })

  it('waits for a play function that resolves later', async () => {
    const order: string[] = []
    runnerIs(true)

    await interactive(async () => {
      await Promise.resolve()
      order.push('played')
    })({})
    order.push('returned')

    expect(order).toEqual(['played', 'returned'])
  })
})
