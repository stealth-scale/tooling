/**
 * @fileoverview Hands a page block the theme the document is drawn in right now. The preview
 * writes what it knows into a store on boot and on every toolbar change, and a block reads it
 * from here, so every page follows the toolbars without a story attached.
 */

import { type JSX, type ReactNode } from 'react'

import { type Tables, type ThemeMode, type TokenName } from '@stealthscale/core-theme'

import { usePreview } from '#preview/store.ts'

import { CAPTION, CORNER } from './styles.ts'

/**
 * Describes the theme the document is drawn in right now, in the one mode that is on.
 */
export interface CurrentTheme {
  /**
   * Names the density the document is drawn at, which decides every control's height and
   * where its focus ring sits.
   */
  density: string

  /**
   * Names the mode the document is in.
   */
  mode: ThemeMode

  /**
   * Carries the value the document's theme attribute holds.
   */
  name: string

  /**
   * Marks that the motion toolbar asks for reduced motion.
   */
  reducedMotion: boolean

  /**
   * Carries every scale the theme states, so a page draws its timing and its shadows rather
   * than the contract's.
   */
  tables: Tables

  /**
   * Carries the name a person picks the theme by.
   */
  title: string

  /**
   * Carries every token in the mode that is on.
   */
  tokens: Readonly<Record<TokenName, string>>
}

/**
 * Returns the theme the document is drawn in, and re-renders the caller when a toolbar moves.
 *
 * @returns {CurrentTheme | undefined} The theme, or nothing where no preview has written one
 *     or the theme on is one the workspace did not register.
 */
export function useTheme(): CurrentTheme | undefined {
  const current = usePreview()
  if (current === undefined) return undefined

  const { appearance, themes } = current
  const theme = themes[appearance.theme]
  if (theme === undefined) return undefined

  return {
    density: appearance.density,
    mode: appearance.mode,
    name: appearance.theme,
    reducedMotion: appearance.reducedMotion,
    tables: theme.tables,
    title: theme.title,
    tokens: theme.values[appearance.mode],
  }
}

/**
 * Describes what a block draws once it has a theme.
 */
export interface ThemedProps {
  /**
   * Draws the block from the theme the document is in.
   */
  children: (theme: CurrentTheme) => ReactNode
}

/**
 * Draws a block from the theme the document is in, or says why it cannot.
 *
 * @param {ThemedProps} props - The block to draw. `ThemedProps` documents every member.
 * @returns {JSX.Element} The block, or a note that no theme is registered.
 */
export function Themed({ children }: Readonly<ThemedProps>): JSX.Element {
  const theme = useTheme()
  if (theme !== undefined) return <>{children(theme)}</>

  return (
    <p data-slot="no-theme" style={{ ...CAPTION, borderRadius: CORNER, padding: '0.75rem 0' }}>
      No theme is registered in this workspace, so there is nothing to draw here. A theme is a
      package whose manifest carries a <code>stealth.theme</code> entry naming its recipe.
    </p>
  )
}
