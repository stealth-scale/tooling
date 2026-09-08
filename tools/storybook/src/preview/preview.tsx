/**
 * @fileoverview Assembles the preview every story is drawn in: the toolbars, the decorator
 * that draws the design system around a story, the docs container, and what a story never has
 * to think about. Everything it needs arrives as an argument, so the whole preview is a value
 * a specification can read; the module that reaches for the workspace is the one beside this.
 */

import { type Preview } from '@storybook/react-vite'

import { type Offered } from '@stealthscale/core-appearance'

import { FOUNDATIONS, PAGES, titleCase } from '#pages.ts'

import { type Themes } from './appearance.ts'
import { appearanceDecorator, type Provider } from './decorator.tsx'
import { docsParameters } from './docs.tsx'
import { initialGlobalsFor, toolbarsFor } from './globals.ts'
import { seedSpies } from './spies.ts'

/**
 * Describes what the preview is built from.
 */
export interface PreviewOptions {
  /**
   * Lists what a toolbar may offer.
   */
  offered: Offered

  /**
   * Names what a story is wrapped in.
   */
  provider: Provider

  /**
   * Carries every theme the workspace registered, solved.
   */
  themes: Themes
}

/**
 * Builds the preview every story in a repository is drawn in.
 *
 * A story states the component and the scene and nothing else. The theme, the mode, the
 * language, the direction, the density and the motion all come from the toolbars, the
 * accessibility pass runs on every story, and the forced states a variant grid draws are
 * declared here rather than per story. The sidebar opens with the kit's own pages, in the
 * order they read.
 *
 * @param {Readonly<PreviewOptions>} options - The reading of the workspace. `PreviewOptions`
 *     documents every member.
 * @returns {Preview} The preview, which the kit's preset registers with Storybook.
 */
export function storybookPreview(options: Readonly<PreviewOptions>): Preview {
  const { offered, provider, themes } = options

  return {
    argsEnhancers: [seedSpies],
    decorators: [appearanceDecorator(offered, provider)],
    globalTypes: toolbarsFor(offered, themes),
    initialGlobals: initialGlobalsFor(offered),
    parameters: {
      a11y: { test: 'error' },
      controls: { matchers: { color: /(?:background|color)$/iu, date: /Date$/iu } },
      docs: docsParameters(),
      layout: 'centered',
      options: { storySort: { order: [FOUNDATIONS, PAGES.map((page) => titleCase(page)), '*'] } },
      pseudo: {
        active: ['.pseudo-active'],
        focusVisible: ['.pseudo-focus-visible'],
        hover: ['.pseudo-hover'],
      },
    },
  }
}
