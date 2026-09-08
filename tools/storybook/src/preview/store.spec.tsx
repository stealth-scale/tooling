import { type JSX } from 'react'

import { act, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vite-plus/test'

import { type Appearance } from '@stealthscale/core-appearance'

import { preview, type PreviewState, previewStore, usePreview } from './store.ts'

/** An appearance in one theme. */
function drawnIn(theme: string): Appearance {
  return {
    density: 'comfortable',
    direction: 'ltr',
    locale: 'en',
    mode: 'light',
    reducedMotion: false,
    theme,
  }
}

/** What the preview knows, in one theme with no themes solved. */
function known(theme: string): PreviewState {
  return { appearance: drawnIn(theme), themes: {} }
}

/** A block that prints the theme the preview says the document is drawn in. */
function Reading(): JSX.Element {
  const current = usePreview()
  return <output>{current?.appearance.theme ?? 'nothing yet'}</output>
}

describe('previewStore', () => {
  it('holds nothing until the preview writes, then what it wrote last', () => {
    const store = previewStore()

    expect(store.get()).toBeUndefined()
    store.set(known('kalon'))
    store.set(known('thesmos'))
    expect(store.get()?.appearance.theme).toBe('thesmos')
  })

  it('tells every subscriber after a write, until it unsubscribes', () => {
    const store = previewStore()
    const listener = vi.fn<() => void>()
    const stop = store.subscribe(listener)

    store.set(known('kalon'))
    stop()
    store.set(known('thesmos'))

    expect(listener).toHaveBeenCalledTimes(1)
  })
})

describe('usePreview', () => {
  it('re-renders a block when the preview writes, so a page follows the toolbars', () => {
    const { container } = render(<Reading />)

    expect(container.textContent).toBe('nothing yet')

    act(() => {
      preview.set(known('kalon'))
    })

    expect(container.textContent).toBe('kalon')
  })
})
