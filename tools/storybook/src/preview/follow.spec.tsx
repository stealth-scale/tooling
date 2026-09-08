import { describe, expect, it, vi } from 'vite-plus/test'

import { ATTRIBUTES, MODE_CLASS, type Offered } from '@stealthscale/core-appearance'
import { emitTheme } from '@stealthscale/core-theme'

import { CHROME_EVENT } from './chrome.ts'
import { follower } from './follow.ts'
import { previewStore } from './store.ts'

/** Holds what a workspace with one theme offers. */
const OFFERED: Offered = {
  densities: ['comfortable', 'compact'],
  locales: ['en', 'nl-BE'],
  themes: ['kalon'],
}

/** Holds the one theme the workspace registered, solved as its own build would. */
const THEMES = {
  kalon: {
    title: 'Kalon',
    values: emitTheme(
      { accent: 200, chart: [258, 152, 292, 45, 12], neutral: 260, primary: 258 },
      'kalon',
    ).values,
  },
}

/**
 * Builds a follower over a fresh root, store and frame, and hands back all three.
 */
function following(): {
  follow: ReturnType<typeof follower>
  frame: { emit: ReturnType<typeof vi.fn> }
  root: HTMLElement
  store: ReturnType<typeof previewStore>
} {
  const frame = { emit: vi.fn<(event: string, payload: unknown) => void>() }
  const root = document.createElement('div')
  const store = previewStore()
  const follow = follower({ frame, offered: OFFERED, root, store, themes: THEMES })
  return { follow, frame, root, store }
}

describe('follower', () => {
  it('writes the appearance the toolbars are on onto the root, and tells the store', () => {
    const { follow, root, store } = following()

    follow({ globals: { density: 'compact', mode: 'dark', theme: 'kalon' } })

    expect(root.getAttribute(ATTRIBUTES.theme)).toBe('kalon')
    expect(root.getAttribute(ATTRIBUTES.density)).toBe('compact')
    expect(root.classList.contains(MODE_CLASS)).toBe(true)
    expect(store.get()?.appearance).toMatchObject({ density: 'compact', mode: 'dark' })
    expect(store.get()?.themes).toBe(THEMES)
  })

  it('tells the frame to draw itself in the theme and the mode the story is in', () => {
    const { follow, frame } = following()

    follow({ globals: { mode: 'dark', theme: 'kalon' } })

    expect(frame.emit).toHaveBeenCalledTimes(1)
    expect(frame.emit).toHaveBeenCalledWith(
      CHROME_EVENT,
      expect.objectContaining({ base: 'dark', brandTitle: 'Kalon' }),
    )
  })

  it('follows every move, so the document is on what the toolbars last said', () => {
    const { follow, root } = following()

    follow({ globals: { mode: 'dark' } })
    follow({ globals: { mode: 'light' } })

    expect(root.classList.contains(MODE_CLASS)).toBe(false)
  })
})
