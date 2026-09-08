import { type JSX, type PropsWithChildren } from 'react'

import { act, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vite-plus/test'

import { type Appearance } from '@stealthscale/core-appearance'
import { type ThemeValues } from '@stealthscale/core-theme'

import { docsParameters, ThemedDocs } from './docs.tsx'
import { sourceOf } from './source.ts'
import { preview } from './store.ts'

/** Storybook's container, standing in: it prints the base of the theme it was handed. */
vi.mock('@storybook/addon-docs/blocks', () => ({
  DocsContainer: ({
    children,
    theme,
  }: PropsWithChildren<{ theme?: { base: string } }>): JSX.Element => (
    <section data-base={theme?.base ?? 'storybook-own'}>{children}</section>
  ),
}))

/** A theme's tokens, in the ones the chrome reads. */
const VALUES = {
  background: '#ffffff',
  border: '#dddddd',
  card: '#fafafa',
  'font-mono': 'Mono',
  'font-sans': 'Sans',
  foreground: '#111111',
  input: '#cccccc',
  muted: '#eeeeee',
  'muted-foreground': '#666666',
  primary: '#3b82f6',
  radius: '0.5rem',
} as unknown as ThemeValues['light']

/** An appearance in one theme and one mode. */
function drawnIn(theme: string, mode: Appearance['mode']): Appearance {
  return {
    density: 'comfortable',
    direction: 'ltr',
    locale: 'en',
    mode,
    reducedMotion: false,
    theme,
  }
}

/** A page, drawn through the container with whatever context Storybook would pass. */
function page(): HTMLElement {
  const context = {} as Parameters<typeof ThemedDocs>[0]['context']
  return render(
    <ThemedDocs context={context}>
      <p>the page</p>
    </ThemedDocs>,
  ).container
}

describe('ThemedDocs', () => {
  it('draws the page in the theme and mode the preview says the document is in', () => {
    const container = page()

    act(() => {
      preview.set({
        appearance: drawnIn('kalon', 'dark'),
        themes: { kalon: { title: 'Kalon', values: { dark: VALUES, light: VALUES } } },
      })
    })

    expect(container.querySelector('section')?.dataset['base']).toBe('dark')
    expect(container.textContent).toBe('the page')
  })

  it("leaves Storybook's own chrome where the theme on is one the workspace lacks", () => {
    const container = page()

    act(() => {
      preview.set({ appearance: drawnIn('thesmos', 'light'), themes: {} })
    })

    expect(container.querySelector('section')?.dataset['base']).toBe('storybook-own')
  })
})

describe('docsParameters', () => {
  it('themes the container, reads the docblocks, and shows markup in the code panel', () => {
    const parameters = docsParameters()

    expect(parameters['container']).toBe(ThemedDocs)
    expect(parameters['codePanel']).toBe(true)
    expect(typeof parameters['extractArgTypes']).toBe('function')
    expect(typeof parameters['extractComponentDescription']).toBe('function')
    expect(parameters['source']).toEqual({ transform: sourceOf })
    expect(parameters['toc']).toEqual({ headingSelector: 'h2, h3', title: 'On this page' })
  })
})
