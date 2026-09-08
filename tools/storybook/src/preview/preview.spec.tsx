import { type ReactNode } from 'react'

import { describe, expect, it } from 'vite-plus/test'

import { type Appearance, type Offered } from '@stealthscale/core-appearance'

import { type Themes } from './appearance.ts'
import { ThemedDocs } from './docs.tsx'
import { storybookPreview } from './preview.tsx'

/** What a workspace with two themes offers. */
const OFFERED: Offered = {
  densities: ['comfortable', 'compact'],
  locales: ['en', 'nl-BE'],
  themes: ['kalon', 'thesmos'],
}

/** The themes a workspace registered, in the members the toolbars read. */
const THEMES = { kalon: { title: 'Kalon', values: {} } } as unknown as Themes

/** A provider that draws the story and nothing around it. */
function Passthrough({ children }: { appearance: Appearance; children: ReactNode }): ReactNode {
  return children
}

/** The preview a workspace with these registrations gets. */
const preview = storybookPreview({ offered: OFFERED, provider: Passthrough, themes: THEMES })

describe('storybookPreview', () => {
  it('wraps every story once, and fills in a spy for every handler a story left out', () => {
    expect(preview.decorators).toHaveLength(1)
    expect(preview.argsEnhancers).toHaveLength(1)
  })

  it('names a toolbar for every value a person can change, and where each starts', () => {
    expect(preview.globalTypes).toHaveProperty('theme')
    expect(preview.initialGlobals).toMatchObject({ theme: 'kalon' })
  })

  it('runs the accessibility pass on every story, so no specification calls it', () => {
    expect(preview.parameters).toMatchObject({ a11y: { test: 'error' } })
  })

  it('declares the classes a forced state is drawn with, so a grid states none', () => {
    expect(preview.parameters).toMatchObject({
      pseudo: {
        active: ['.pseudo-active'],
        focusVisible: ['.pseudo-focus-visible'],
        hover: ['.pseudo-hover'],
      },
    })
  })

  it('draws every docs page in the toolbars’ theme', () => {
    expect(preview.parameters).toMatchObject({ docs: { container: ThemedDocs } })
  })

  it('opens the sidebar with its own pages, in the order they read', () => {
    expect(preview.parameters).toMatchObject({
      options: {
        storySort: {
          order: [
            'Foundations',
            ['Colours', 'Typography', 'Shape', 'Motion', 'Accessibility'],
            '*',
          ],
        },
      },
    })
  })
})
