/**
 * @fileoverview Wraps every story in the design system's provider, in the appearance the
 * toolbars settled on, and keeps it inside Storybook.
 */

import { createElement, type ReactNode } from 'react'

import { type Decorator } from '@storybook/react-vite'

import { type Appearance, type Offered } from '@stealthscale/core-appearance'

import { type StoryContext } from '#story/locale.ts'

import { appearanceFrom } from './appearance.ts'
import { Contained } from './contained.tsx'

/**
 * Describes what the design system's provider is handed.
 */
export interface ProviderProps {
  /**
   * Carries the appearance the toolbars settled on.
   */
  appearance: Appearance

  /**
   * Carries the story being drawn.
   */
  children: ReactNode
}

/**
 * Names what a story is wrapped in: the design system's own provider, or a passthrough.
 */
export type Provider = (props: ProviderProps) => ReactNode

/**
 * Reads the appearance a story is drawn in, with the values it pinned for itself on top.
 *
 * @param {StoryContext} context - The context Storybook hands a decorator.
 * @param {Offered} offered - The offer the workspace registered.
 * @returns {Appearance} The appearance to draw in.
 */
export function appearanceOf(context: StoryContext, offered: Offered): Appearance {
  return appearanceFrom({ ...context.globals, ...context.storyGlobals }, offered)
}

/**
 * Builds the decorator that draws every story inside the design system.
 *
 * @param {Offered} offered - The offer the workspace registered.
 * @param {Provider} Wrap - The provider a story is wrapped in.
 * @returns {Decorator} The decorator, for the preview's `decorators`.
 */
export function appearanceDecorator(offered: Offered, Wrap: Provider): Decorator {
  return (Story, context) => {
    const appearance = appearanceOf(context, offered)

    return createElement(Wrap, {
      appearance,
      children: createElement(Contained, { appearance, children: createElement(Story) }),
    })
  }
}
