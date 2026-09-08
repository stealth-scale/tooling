/**
 * @fileoverview Draws a docs page in the theme the toolbars are on, and reads a component's
 * table and description off its own docblocks. Storybook's docs chrome is themed on its own
 * and defaults to light, so without this a dark story sat on a white page, and every
 * contrast judgement on that page was a judgement against the wrong background.
 */

import { type JSX, type PropsWithChildren } from 'react'

import { DocsContainer, type DocsContainerProps } from '@storybook/addon-docs/blocks'

import { extractArgTypes } from './argtypes.ts'
import { chromeFor } from './chrome.ts'
import { extractComponentDescription } from './description.ts'
import { sourceOf } from './source.ts'
import { usePreview } from './store.ts'

/**
 * Draws a docs page in the theme and the mode the toolbars are on.
 *
 * The chrome comes from the same solved values the manager draws its frame from, so a docs
 * page and the sidebar around it are one theme. A page with no story attached follows the
 * toolbars too, because the values are read from the store the preview writes rather than
 * from any story.
 *
 * @param {PropsWithChildren<DocsContainerProps>} props - The page and its context, as
 *     Storybook hands them to a docs container.
 * @returns {JSX.Element} The page, in Storybook's container, themed.
 */
export function ThemedDocs({
  children,
  context,
}: PropsWithChildren<DocsContainerProps>): JSX.Element {
  const current = usePreview()
  const theme = current === undefined ? undefined : chromeFor(current.appearance, current.themes)

  return (
    <DocsContainer context={context} {...(theme === undefined ? {} : { theme })}>
      {children}
    </DocsContainer>
  )
}

/**
 * Builds the `docs` parameters every page is drawn with.
 *
 * @returns {Record<string, unknown>} The parameters: the themed container, the extractors
 *     that read a component's docblocks, the code panel showing markup, and the table of
 *     contents.
 */
export function docsParameters(): Record<string, unknown> {
  return {
    codePanel: true,
    container: ThemedDocs,
    extractArgTypes,
    extractComponentDescription,
    source: { transform: sourceOf },
    toc: { headingSelector: 'h2, h3', title: 'On this page' },
  }
}
