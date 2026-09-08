import { type JSX, type ReactNode } from 'react'

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { type Appearance, type Offered } from '@stealthscale/core-appearance'

import { appearanceDecorator, appearanceOf } from './decorator.tsx'

/** What a workspace with two themes offers. */
const OFFERED: Offered = {
  densities: ['comfortable', 'compact'],
  locales: ['en', 'nl-BE'],
  themes: ['kalon', 'thesmos'],
}

/** The arguments Storybook hands a decorator, in the members the decorator reads. */
type Handed = Parameters<ReturnType<typeof appearanceDecorator>>

/** A provider that writes the theme it was handed around the story. */
function Recording({
  appearance,
  children,
}: {
  appearance: Appearance
  children: ReactNode
}): JSX.Element {
  return <div data-theme={appearance.theme}>{children}</div>
}

/** A story. */
function AStory(): JSX.Element {
  return <p>a story</p>
}

/** Draws a story through the decorator, in the globals given. */
function drawn(globals: Record<string, unknown>): HTMLElement {
  const decorate = appearanceDecorator(OFFERED, Recording)
  const context = { globals, storyGlobals: {} } as unknown as Handed[1]
  return render(decorate(AStory as unknown as Handed[0], context) as ReactNode).container
}

describe('appearanceDecorator', () => {
  it('draws every story inside the design system, in the appearance the toolbars are on', () => {
    const container = drawn({ theme: 'thesmos' })

    expect(container.querySelector<HTMLElement>('[data-theme]')?.dataset['theme']).toBe('thesmos')
    expect(container.querySelector('p')?.textContent).toBe('a story')
  })

  it('keeps the story inside Storybook, through a wrapper that takes no space', () => {
    const canvas = drawn({ theme: 'kalon' }).querySelector('[data-slot="canvas"]')

    expect(canvas?.getAttribute('style')).toContain('display: contents')
    expect(canvas?.querySelector('p')).not.toBeNull()
  })
})

describe('appearanceOf', () => {
  it('lets a story pin a value over the toolbar it would otherwise follow', () => {
    const appearance = appearanceOf(
      { globals: { theme: 'kalon' }, storyGlobals: { theme: 'thesmos' } },
      OFFERED,
    )

    expect(appearance.theme).toBe('thesmos')
  })

  it('follows the toolbars where a story pins nothing', () => {
    expect(appearanceOf({ globals: { theme: 'kalon' } }, OFFERED).theme).toBe('kalon')
  })
})
